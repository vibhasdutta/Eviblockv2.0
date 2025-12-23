use candid::{CandidType, Decode, Encode};
use ic_cdk::api::time;
use ic_stable_structures::memory_manager::{MemoryId, MemoryManager, VirtualMemory};
use ic_stable_structures::{DefaultMemoryImpl, StableBTreeMap, Storable};
use serde::{Deserialize, Serialize};
use std::borrow::Cow;
use std::cell::RefCell;

// Type aliases for stable storage
type Memory = VirtualMemory<DefaultMemoryImpl>;
type IdCell = ic_stable_structures::StableCell<u64, Memory>;

// File record structure
#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct FileRecord {
    pub id: u64,
    pub name: String,
    pub uid: String,
    pub date: String,
    pub file_type: String,
    pub file_size: u64,
    pub cid: String,
    pub timestamp: u64,
    pub kyc_detail: String, // Encrypted KYC JSON (AES-256-GCM, Base64 encoded)
    #[serde(default = "default_document_type")]
    pub document_type: String, // "legal", "evidence", or "simple" - defaults to "legal" for old records
}

// Default value for old records without document_type
fn default_document_type() -> String {
    "legal".to_string()
}

// Verification log structure
#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct VerificationLog {
    pub id: u64,
    pub file_id: u64,
    pub cid: String,
    pub verifier_uid: String,
    pub verifier_name: String,
    pub timestamp: u64,
}

// Video verification record structure
#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct VideoVerificationRecord {
    pub id: u64,
    pub uid: String,
    pub video_hash: String,
    pub firestore_doc_id: String,
    pub document_cid: String, // Empty initially, updated after document upload
    pub timestamp: u64,
}

// Implement Storable for FileRecord
impl Storable for FileRecord {
    fn to_bytes(&self) -> Cow<'_, [u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }

    const BOUND: ic_stable_structures::storable::Bound = ic_stable_structures::storable::Bound::Bounded {
        max_size: 4096, // 4KB max per record (increased for encrypted KYC data)
        is_fixed_size: false,
    };
}

// Implement Storable for VerificationLog
impl Storable for VerificationLog {
    fn to_bytes(&self) -> Cow<'_, [u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }

    const BOUND: ic_stable_structures::storable::Bound = ic_stable_structures::storable::Bound::Bounded {
        max_size: 1024, // 1KB max per log entry
        is_fixed_size: false,
    };
}

// Implement Storable for VideoVerificationRecord
impl Storable for VideoVerificationRecord {
    fn to_bytes(&self) -> Cow<'_, [u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }

    const BOUND: ic_stable_structures::storable::Bound = ic_stable_structures::storable::Bound::Bounded {
        max_size: 1024, // 1KB max per record
        is_fixed_size: false,
    };
}

// Thread-local storage
thread_local! {
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> =
        RefCell::new(MemoryManager::init(DefaultMemoryImpl::default()));

    static ID_COUNTER: RefCell<IdCell> = RefCell::new(
        IdCell::init(MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(0))), 0)
            .expect("Failed to initialize ID counter")
    );

    static FILE_STORAGE: RefCell<StableBTreeMap<u64, FileRecord, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(1))),
        )
    );

    static VERIFICATION_LOGS: RefCell<StableBTreeMap<u64, VerificationLog, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(2))),
        )
    );

    static VIDEO_VERIFICATIONS: RefCell<StableBTreeMap<u64, VideoVerificationRecord, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(3))),
        )
    );
}

// Helper function to generate next ID
fn next_id() -> u64 {
    ID_COUNTER.with(|counter| {
        let mut counter = counter.borrow_mut();
        let current = *counter.get();
        let next = current + 1;
        counter.set(next).expect("Failed to increment ID counter");
        next
    })
}

// Validation helper functions
fn validate_cid(cid: &str) -> Result<(), String> {
    // Basic CID validation (starts with Qm or bafy for CIDv0/v1, or 64-char hex for SHA-256)
    if cid.is_empty() {
        return Err("CID cannot be empty".to_string());
    }
    
    // Check if it's a SHA-256 hash (64 hex characters)
    if cid.len() == 64 && cid.chars().all(|c| c.is_ascii_hexdigit()) {
        return Ok(()); // Valid SHA-256 hash
    }
    
    // Otherwise, validate as IPFS CID
    if !cid.starts_with("Qm") && !cid.starts_with("bafy") && !cid.starts_with("bafk") {
        return Err("Invalid CID format. Must be IPFS CID (Qm/bafy/bafk) or SHA-256 hash".to_string());
    }
    
    if cid.len() < 46 {
        return Err("CID too short".to_string());
    }
    
    Ok(())
}

fn validate_file_size(size: u64) -> Result<(), String> {
    const MAX_FILE_SIZE: u64 = 100 * 1024 * 1024; // 100MB limit
    
    if size == 0 {
        return Err("File size cannot be zero".to_string());
    }
    
    if size > MAX_FILE_SIZE {
        return Err(format!("File size exceeds maximum allowed size of {}MB", MAX_FILE_SIZE / (1024 * 1024)));
    }
    
    Ok(())
}

fn validate_uid(uid: &str) -> Result<(), String> {
    if uid.is_empty() {
        return Err("UID cannot be empty".to_string());
    }
    
    if uid.len() > 100 {
        return Err("UID too long (max 100 characters)".to_string());
    }
    
    Ok(())
}

fn validate_filename(name: &str) -> Result<(), String> {
    if name.is_empty() {
        return Err("Filename cannot be empty".to_string());
    }
    
    if name.len() > 255 {
        return Err("Filename too long (max 255 characters)".to_string());
    }
    
    Ok(())
}

fn check_duplicate_cid(cid: &str) -> Result<(), String> {
    FILE_STORAGE.with(|storage| {
        let storage = storage.borrow();
        for (_id, record) in storage.iter() {
            if record.cid == cid {
                return Err(format!("File with CID '{}' already exists (ID: {})", cid, record.id));
            }
        }
        Ok(())
    })
}

// Validate KYC detail (encrypted base64 string) - all types require it now
fn validate_kyc_detail(kyc_detail: &str) -> Result<(), String> {
    // All document types require KYC data (simple has mini-KYC, others have full KYC)
    if kyc_detail.is_empty() {
        return Err("KYC detail is required for all document types".to_string());
    }
    
    if kyc_detail.len() > 2048 {
        return Err("KYC detail too long (max 2048 characters)".to_string());
    }
    
    Ok(())
}

// Validate document type
fn validate_document_type(document_type: &str) -> Result<(), String> {
    match document_type {
        "legal" | "evidence" | "simple" => Ok(()),
        _ => Err("Invalid document type. Must be 'legal', 'evidence', or 'simple'".to_string()),
    }
}

// Store document metadata
#[ic_cdk::update]
fn store_document_metadata(
    name: String,
    uid: String,
    date: String,
    file_type: String,
    file_size: u64,
    cid: String,
    kyc_detail: String,
    document_type: String,
) -> Result<FileRecord, String> {
    // Validation
    validate_filename(&name)?;
    validate_uid(&uid)?;
    validate_cid(&cid)?;
    validate_file_size(file_size)?;
    validate_document_type(&document_type)?;
    validate_kyc_detail(&kyc_detail)?;
    check_duplicate_cid(&cid)?;
    
    let id = next_id();
    let timestamp = time();
    
    let record = FileRecord {
        id,
        name,
        uid,
        date,
        file_type,
        file_size,
        cid,
        timestamp,
        kyc_detail,
        document_type,
    };
    
    FILE_STORAGE.with(|storage| {
        storage.borrow_mut().insert(id, record.clone());
    });
    
    Ok(record)
}

// Get all documents for a specific user
#[ic_cdk::query]
fn get_documents_by_uid(uid: String) -> Vec<FileRecord> {
    FILE_STORAGE.with(|storage| {
        storage
            .borrow()
            .iter()
            .filter(|(_, record)| record.uid == uid)
            .map(|(_, record)| record.clone())
            .collect()
    })
}

// Get all documents (admin function)
#[ic_cdk::query]
fn get_all_documents() -> Vec<FileRecord> {
    FILE_STORAGE.with(|storage| {
        storage
            .borrow()
            .iter()
            .map(|(_, record)| record.clone())
            .collect()
    })
}

// Get document by CID
#[ic_cdk::query]
fn get_document_by_cid(cid: String) -> Result<FileRecord, String> {
    validate_cid(&cid)?;
    
    FILE_STORAGE.with(|storage| {
        let storage = storage.borrow();
        for (_id, record) in storage.iter() {
            if record.cid == cid {
                return Ok(record.clone());
            }
        }
        Err(format!("No document found with CID: {}", cid))
    })
}

// Verify document integrity by comparing CID (alias for get_document_by_cid)
#[ic_cdk::query]
fn verify_document(cid: String) -> Result<FileRecord, String> {
    get_document_by_cid(cid)
}

// Log a document verification event
#[ic_cdk::update]
fn log_document_verification(cid: String, verifier_uid: String, verifier_name: String) -> Result<VerificationLog, String> {
    validate_cid(&cid)?;
    validate_uid(&verifier_uid)?;
    
    // Find the file record
    let file_id = FILE_STORAGE.with(|storage| {
        let storage = storage.borrow();
        for (id, record) in storage.iter() {
            if record.cid == cid {
                return Ok(id);
            }
        }
        Err(format!("No file found with CID: {}", cid))
    })?;
    
    let log_id = next_id();
    let timestamp = time();
    
    let log = VerificationLog {
        id: log_id,
        file_id,
        cid,
        verifier_uid,
        verifier_name,
        timestamp,
    };
    
    VERIFICATION_LOGS.with(|logs| {
        logs.borrow_mut().insert(log_id, log.clone());
    });
    
    Ok(log)
}

// Get verification logs for a specific document by CID
#[ic_cdk::query]
fn get_verification_logs_by_cid(cid: String) -> Vec<VerificationLog> {
    VERIFICATION_LOGS.with(|logs| {
        logs.borrow()
            .iter()
            .filter(|(_, log)| log.cid == cid)
            .map(|(_, log)| log.clone())
            .collect()
    })
}

// Get verification logs for a specific document by document ID
#[ic_cdk::query]
fn get_verification_logs_by_document_id(document_id: u64) -> Vec<VerificationLog> {
    VERIFICATION_LOGS.with(|logs| {
        logs.borrow()
            .iter()
            .filter(|(_, log)| log.file_id == document_id)
            .map(|(_, log)| log.clone())
            .collect()
    })
}

// Get total number of documents stored
#[ic_cdk::query]
fn get_total_documents() -> u64 {
    FILE_STORAGE.with(|storage| storage.borrow().len())
}

// Delete a document record (admin function - use with caution)
#[ic_cdk::update]
fn delete_document(id: u64) -> Result<String, String> {
    FILE_STORAGE.with(|storage| {
        let mut storage = storage.borrow_mut();
        match storage.remove(&id) {
            Some(record) => Ok(format!("Successfully deleted record: {} (CID: {})", record.name, record.cid)),
            None => Err(format!("No record found with ID: {}", id)),
        }
    })
}

// Store video verification record
#[ic_cdk::update]
fn store_video_verification(
    uid: String,
    video_hash: String,
    firestore_doc_id: String,
) -> Result<VideoVerificationRecord, String> {
    validate_uid(&uid)?;
    validate_cid(&video_hash)?; // Validates SHA-256 hash
    
    if firestore_doc_id.is_empty() {
        return Err("Firestore document ID cannot be empty".to_string());
    }
    
    let id = next_id();
    let timestamp = time();
    
    let record = VideoVerificationRecord {
        id,
        uid,
        video_hash,
        firestore_doc_id,
        document_cid: String::new(), // Empty initially
        timestamp,
    };
    
    VIDEO_VERIFICATIONS.with(|storage| {
        storage.borrow_mut().insert(id, record.clone());
    });
    
    Ok(record)
}

// Link video verification to document CID
#[ic_cdk::update]
fn link_video_to_document(
    video_verification_id: u64,
    document_cid: String,
) -> Result<VideoVerificationRecord, String> {
    validate_cid(&document_cid)?;
    
    VIDEO_VERIFICATIONS.with(|storage| {
        let mut storage = storage.borrow_mut();
        match storage.get(&video_verification_id) {
            Some(mut record) => {
                record.document_cid = document_cid;
                storage.insert(video_verification_id, record.clone());
                Ok(record)
            },
            None => Err(format!("No video verification found with ID: {}", video_verification_id)),
        }
    })
}

// Get video verification records by UID
#[ic_cdk::query]
fn get_videos_by_uid(uid: String) -> Vec<VideoVerificationRecord> {
    VIDEO_VERIFICATIONS.with(|storage| {
        storage.borrow()
            .iter()
            .filter(|(_, record)| record.uid == uid)
            .map(|(_, record)| record.clone())
            .collect()
    })
}

// Get video verification by Firestore document ID
#[ic_cdk::query]
fn get_video_by_firestore_id(firestore_doc_id: String) -> Option<VideoVerificationRecord> {
    VIDEO_VERIFICATIONS.with(|storage| {
        storage.borrow()
            .iter()
            .find(|(_, record)| record.firestore_doc_id == firestore_doc_id)
            .map(|(_, record)| record.clone())
    })
}

// Get video verification by video hash
#[ic_cdk::query]
fn get_video_by_hash(video_hash: String) -> Option<VideoVerificationRecord> {
    VIDEO_VERIFICATIONS.with(|storage| {
        storage.borrow()
            .iter()
            .find(|(_, record)| record.video_hash == video_hash)
            .map(|(_, record)| record.clone())
    })
}

// Get video verification by document CID
#[ic_cdk::query]
fn get_video_by_document_cid(document_cid: String) -> Option<VideoVerificationRecord> {
    VIDEO_VERIFICATIONS.with(|storage| {
        storage.borrow()
            .iter()
            .find(|(_, record)| record.document_cid == document_cid)
            .map(|(_, record)| record.clone())
    })
}
