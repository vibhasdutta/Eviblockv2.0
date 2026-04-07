import { Actor, HttpAgent } from '@dfinity/agent';
import { idlFactory } from './candid/evilblock_backend';
import type { _SERVICE } from './candid/evilblock_backend';

// Canister ID - replace with your actual canister ID after deployment
const CANISTER_ID = process.env.NEXT_PUBLIC_CANISTER_ID_EVILBLOCK_BACKEND || 'rrkah-fqaaa-aaaaa-aaaaq-cai';

let agentInstance: HttpAgent | null = null;
let backendActor: ReturnType<typeof Actor.createActor<_SERVICE>> | null = null;

// Create agent lazily (only when needed and on client-side)
function getAgent(): HttpAgent {
  if (!agentInstance) {
    const host = process.env.NEXT_PUBLIC_IC_HOST || 'http://localhost:4943';

    agentInstance = new HttpAgent({
      host,
      // Disable host verification for local development
      verifyQuerySignatures: false,
    });

    // Fetch root key for local canister replica (needed regardless of NODE_ENV)
    // Without this, all canister calls fail with certificate verification errors
    const isLocalReplica = host.includes('localhost') || host.includes('127.0.0.1');
    if (typeof window !== 'undefined' && isLocalReplica) {
      agentInstance.fetchRootKey().catch(err => {
        console.error('Failed to fetch root key:', err);
      });
    }
  }
  return agentInstance;
}

// Get or create backend actor
function getBackend(): ReturnType<typeof Actor.createActor<_SERVICE>> {
  if (!backendActor) {
    backendActor = Actor.createActor<_SERVICE>(idlFactory, {
      agent: getAgent(),
      canisterId: CANISTER_ID,
    });
  }
  return backendActor;
}

const backend = new Proxy({} as ReturnType<typeof Actor.createActor<_SERVICE>>, {
  get: (_, prop) => {
    return getBackend()[prop as keyof ReturnType<typeof Actor.createActor<_SERVICE>>];
  }
});

export interface FileRecord {
  id: bigint;
  name: string;
  uid: string;
  date: string;
  file_type: string;
  file_size: bigint;
  cid: string;
  timestamp: bigint;
  kyc_detail: string;
  document_type: string;
}

export interface VerificationLog {
  id: bigint;
  file_id: bigint;
  cid: string;
  verifier_uid: string;
  verifier_name: string;
  timestamp: bigint;
}

export interface VideoVerificationRecord {
  id: bigint;
  uid: string;
  video_hash: string;
  firestore_doc_id: string;
  document_cid: string;
  timestamp: bigint;
}

export interface StoreFileMetadataParams {
  name: string;
  uid: string;
  date: string;
  file_type: string;
  file_size: number;
  cid: string;
  kyc_detail: string;
  document_type: string;
}

/**
 * Store document metadata on ICP blockchain
 */
export async function storeDocumentMetadata(params: StoreFileMetadataParams): Promise<FileRecord> {
  try {
    const result = await backend.store_document_metadata(
      params.name,
      params.uid,
      params.date,
      params.file_type,
      BigInt(params.file_size),
      params.cid,
      params.kyc_detail,
      params.document_type
    );

    if ('Err' in result) {
      throw new Error(result.Err);
    }

    return result.Ok;
  } catch (error) {
    console.error('Store metadata error:', error);
    throw error;
  }
}

/**
 * Get all document records for a user
 */
export async function getDocumentsByUid(uid: string): Promise<FileRecord[]> {
  try {
    return await backend.get_documents_by_uid(uid) as FileRecord[];
  } catch (error) {
    console.error('Get records error:', error);
    throw error;
  }
}

/**
 * Get document record by CID
 */
export async function getDocumentByCid(cid: string): Promise<FileRecord | null> {
  try {
    const result = await backend.get_document_by_cid(cid);

    if ('Err' in result) {
      return null;
    }

    return result.Ok as FileRecord;
  } catch (error) {
    console.error('Get document by CID error:', error);
    throw error;
  }
}

/**
 * Check if a document with the given CID already exists
 */
export async function checkDocumentExists(cid: string): Promise<boolean> {
  try {
    const record = await getDocumentByCid(cid);
    return record !== null;
  } catch (error) {
    console.error('Check document exists error:', error);
    return false;
  }
}

/**
 * Verify document by CID
 */
export async function verifyDocument(cid: string): Promise<FileRecord> {
  try {
    const result = await backend.verify_document(cid);

    if ('Err' in result) {
      throw new Error(result.Err);
    }

    return result.Ok as FileRecord;
  } catch (error) {
    console.error('Verify file error:', error);
    throw error;
  }
}

/**
 * Get total documents count
 */
export async function getTotalDocuments(): Promise<number> {
  try {
    const count = await backend.get_total_documents();
    return Number(count);
  } catch (error) {
    console.error('Get total files error:', error);
    throw error;
  }
}

/**
 * Delete document record (admin function)
 */
export async function deleteDocument(id: number): Promise<string> {
  try {
    const result = await backend.delete_document(BigInt(id));

    if ('Err' in result) {
      throw new Error(result.Err);
    }

    return result.Ok;
  } catch (error) {
    console.error('Delete file error:', error);
    throw error;
  }
}

/**
 * Log a document verification event
 */
export async function logDocumentVerification(cid: string, verifierUid: string, verifierName: string): Promise<VerificationLog> {
  try {
    const result = await backend.log_document_verification(cid, verifierUid, verifierName);

    if ('Err' in result) {
      throw new Error(result.Err);
    }

    return result.Ok;
  } catch (error) {
    console.error('Log verification error:', error);
    throw error;
  }
}

/**
 * Get verification logs for a specific document by CID
 */
export async function getVerificationLogsByCid(cid: string): Promise<VerificationLog[]> {
  try {
    return await backend.get_verification_logs_by_cid(cid);
  } catch (error) {
    console.error('Get verification logs error:', error);
    throw error;
  }
}

/**
 * Get verification logs for a specific document by document ID
 */
export async function getVerificationLogsByDocumentId(documentId: number): Promise<VerificationLog[]> {
  try {
    return await backend.get_verification_logs_by_document_id(BigInt(documentId));
  } catch (error) {
    console.error('Get verification logs by file ID error:', error);
    throw error;
  }
}

/**
 * Store video verification record on blockchain
 */
export async function storeVideoVerification(
  uid: string,
  videoHash: string,
  firestoreDocId: string
): Promise<VideoVerificationRecord> {
  try {
    const result = await backend.store_video_verification(uid, videoHash, firestoreDocId);

    if ('Err' in result) {
      throw new Error(result.Err);
    }

    return result.Ok;
  } catch (error) {
    console.error('Store video verification error:', error);
    throw error;
  }
}

/**
 * Link video verification record to document CID
 */
export async function linkVideoToDocument(
  videoVerificationId: number,
  documentCid: string
): Promise<VideoVerificationRecord> {
  try {
    const result = await backend.link_video_to_document(
      BigInt(videoVerificationId),
      documentCid
    );

    if ('Err' in result) {
      throw new Error(result.Err);
    }

    return result.Ok;
  } catch (error) {
    console.error('Update video verification document CID error:', error);
    throw error;
  }
}

/**
 * Get video verification records by user UID
 */
export async function getVideosByUid(uid: string): Promise<VideoVerificationRecord[]> {
  try {
    return await backend.get_videos_by_uid(uid);
  } catch (error) {
    console.error('Get video verifications by UID error:', error);
    throw error;
  }
}

/**
 * Get video verification by Firestore document ID
 */
export async function getVideoByFirestoreId(
  firestoreDocId: string
): Promise<VideoVerificationRecord | null> {
  try {
    const result = await backend.get_video_by_firestore_id(firestoreDocId);
    return result.length > 0 && result[0] ? result[0] : null;
  } catch (error) {
    console.error('Get video verification by Firestore ID error:', error);
    throw error;
  }
}

/**
 * Get video verification by video hash
 */
export async function getVideoByHash(
  videoHash: string
): Promise<VideoVerificationRecord | null> {
  try {
    const result = await backend.get_video_by_hash(videoHash);
    return result.length > 0 && result[0] ? result[0] : null;
  } catch (error) {
    console.error('Get video verification by hash error:', error);
    throw error;
  }
}

/**
 * Get video verification by document CID
 */
export async function getVideoByDocumentCid(
  documentCid: string
): Promise<VideoVerificationRecord | null> {
  try {
    const result = await backend.get_video_by_document_cid(documentCid);
    return result.length > 0 && result[0] ? result[0] : null;
  } catch (error) {
    console.error('Get video verification by document CID error:', error);
    throw error;
  }
}

export { backend };
