"use client";

import { useEffect, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import FileUploadDropzone from "@/components/FileUploadDropzone";
import { uploadToPinata } from "@/lib/ipfs";
import { storeDocumentMetadata, checkDocumentExists, getTotalDocuments } from "@/lib/canister";
import { encryptKycData, getKycDataFromSession } from "@/lib/encryption";
import { useToast } from "@/hooks/use-toast";

interface UploadStatus {
  stage: "idle" | "uploading" | "storing" | "success" | "error";
  message: string;
  cid?: string;
  error?: string;
}

interface FileUploadFormProps {
  uid: string;
  onSuccess?: () => void;
  storeOnly?: boolean; // New prop to indicate if we should only store locally
  documentType?: string; // Add documentType as a prop
}

type DocumentType = "legal" | "evidence" | "simple";

const normalizeDocumentType = (value?: string | null): DocumentType | null => {
  if (!value) return null;
  const normalized = value.toLowerCase().trim();

  if (normalized === "leagal") return "legal";
  if (normalized === "legal" || normalized === "evidence" || normalized === "simple") {
    return normalized;
  }

  return null;
};

export default function FileUploadForm({ uid, onSuccess, storeOnly = false, documentType: propDocumentType }: FileUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [globalUploadCount, setGlobalUploadCount] = useState<number | null>(null);
  const [isCountLoading, setIsCountLoading] = useState(true);
  const [status, setStatus] = useState<UploadStatus>({
    stage: "idle",
    message: "",
  });
  const { toast } = useToast();

  const refreshGlobalUploadCount = async () => {
    try {
      const count = await getTotalDocuments();
      setGlobalUploadCount(count);
    } catch (error) {
      console.error("Failed to fetch global upload count:", error);
    } finally {
      setIsCountLoading(false);
    }
  };

  useEffect(() => {
    refreshGlobalUploadCount();
  }, []);

  const handleUpload = async () => {
    if (!file) {
      setStatus({
        stage: "error",
        message: "Please select a file",
        error: "No file selected",
      });
      return;
    }

    try {
      const resolvedDocumentType =
        normalizeDocumentType(propDocumentType) ??
        normalizeDocumentType(sessionStorage.getItem('documentType'));
      const isGatedDocument = storeOnly || resolvedDocumentType === 'legal' || resolvedDocumentType === 'evidence';
      const documentType: DocumentType = resolvedDocumentType ?? (isGatedDocument ? 'legal' : 'simple');
      let ipfsCID = '';

      // Stage 1: Determine document type and handle accordingly
      if (isGatedDocument) {
        // Gated documents (Legal & Evidence): Store file locally, skip Pinata upload
        console.log(`📋 ${documentType} document detected - storing locally for verification`);

        setStatus({
          stage: "uploading",
          message: "Saving document locally...",
        });

        const { storeFileInIndexedDB } = await import('@/lib/fileStorage');
        await storeFileInIndexedDB(file);

        // Store file metadata for later upload
        sessionStorage.setItem('pendingFileUpload', JSON.stringify({
          fileName: file.name,
          fileType: file.type || "application/octet-stream",
          fileSize: file.size,
        }));

        // Generate a temporary placeholder CID for encryption
        ipfsCID = `pending_${Date.now()}_${file.name}`;

        console.log('✅ File stored locally, will upload to IPFS after final verification');
      } else {
        // Simple Documents: Upload to Pinata immediately
        console.log('📋 Simple document - uploading to IPFS');

        setStatus({
          stage: "uploading",
          message: "Uploading to IPFS...",
        });

        const ipfsResult = await uploadToPinata(file);
        if (!ipfsResult.success) {
          throw new Error(ipfsResult.error || 'IPFS upload failed');
        }

        ipfsCID = ipfsResult.hash;

        // Check if file already exists
        setStatus({
          stage: "uploading",
          message: "Checking for duplicate files...",
        });

        const fileExists = await checkDocumentExists(ipfsCID);
        if (fileExists) {
          throw new Error(`File with CID '${ipfsCID}' already exists. You can verify it using the verification tool.`);
        }
      }

      // Stage 2: Handle KYC data
      let encryptedKycData = '';

      if (isGatedDocument) {
        // Gated documents: Skip encryption here (no real CID yet)
        console.log(`⏭️ Skipping KYC encryption for ${documentType} (will encrypt after IPFS upload)`);

        // Get unencrypted KYC data from state
        const kycData = await getKycDataFromSession();
        if (!kycData) {
          throw new Error('KYC data not found. Please complete the KYC form first.');
        }

        // Store as JSON string temporarily
        encryptedKycData = JSON.stringify(kycData);
      } else {
        // Simple: Encrypt KYC data now (we have real CID)
        setStatus({
          stage: "storing",
          message: "Encrypting KYC data...",
        });

        const kycData = await getKycDataFromSession();
        if (!kycData) {
          throw new Error('KYC data not found. Please complete the KYC form first.');
        }

        encryptedKycData = await encryptKycData(kycData, uid, ipfsCID);
      }

      // Stage 4: Handle blockchain upload based on storeOnly flag
      const currentDate = new Date().toISOString().split("T")[0];

      if (storeOnly) {
        // Legal/Evidence: Store locally for later finalization
        console.log('🔍 storeOnly mode - saving metadata to session');

        sessionStorage.setItem('pendingDocument', JSON.stringify({
          name: file.name,
          cid: ipfsCID,
          file_type: file.type || "application/octet-stream",
          file_size: file.size,
          date: currentDate,
          kyc_detail: encryptedKycData, // Pass data forward
        }));

        setStatus({
          stage: "success",
          message: "File saved locally. Complete verification to upload to IPFS.",
          cid: ipfsCID,
        });

        toast({
          title: "Upload Successful",
          description: `File "${file.name}" saved locally. Continue to video verification.`,
          variant: "success",
        });
      } else {
        // Simple: Upload to blockchain immediately
        setStatus({
          stage: "storing",
          message: "Storing metadata on blockchain...",
        });

        await storeDocumentMetadata({
          name: file.name,
          uid: uid,
          date: currentDate,
          file_type: file.type || "application/octet-stream",
          file_size: file.size,
          cid: ipfsCID,
          kyc_detail: encryptedKycData,
          document_type: documentType,
        });

        setStatus({
          stage: "success",
          message: "File uploaded and stored on blockchain!",
          cid: ipfsCID,
        });

        toast({
          title: "Upload Successful",
          description: `File "${file.name}" has been uploaded to IPFS and stored on blockchain.`,
          variant: "success",
        });

        // Refresh global counter after successful blockchain write.
        await refreshGlobalUploadCount();

        // Clear ALL sensitive KYC data after successful completion  
        const { clearKycDataOnSuccess } = await import('@/lib/kycCleanup');
        await clearKycDataOnSuccess();
      }

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }

      // Reset form
      setFile(null);
      const fileInput = document.getElementById("file-upload") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (error) {
      console.error("Upload error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      // Check for specific error types and provide user-friendly messages
      let toastTitle = "Upload Failed";
      let toastDescription = errorMessage;
      let toastVariant: "destructive" | "warning" = "destructive";

      if (errorMessage.includes("already exists")) {
        toastTitle = "File Already Exists";
        toastDescription = "This file has already been uploaded to the blockchain. You can verify it using the verification tool.";
        toastVariant = "warning";
      } else if (errorMessage.includes("Global upload limit reached")) {
        toastTitle = "Global Upload Limit Reached";
        toastDescription = "The platform-wide upload capacity has been reached. Please try again later.";
      } else if (errorMessage.includes("network") || errorMessage.includes("connection")) {
        toastTitle = "Network Error";
        toastDescription = "Please check your internet connection and try again.";
      } else if (errorMessage.includes("IPFS") || errorMessage.includes("Pinata")) {
        toastTitle = "Storage Error";
        toastDescription = "Failed to upload to IPFS. Please try again.";
      }

      setStatus({
        stage: "error",
        message: "Upload failed",
        error: errorMessage,
      });

      toast({
        title: toastTitle,
        description: toastDescription,
        variant: toastVariant,
      });
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="size-6" />
          Upload Evidence
        </CardTitle>
        <CardDescription>
          Upload your document to IPFS and store verification data on blockchain
        </CardDescription>
        <div className="text-sm text-muted-foreground">
          {isCountLoading
            ? "Global uploads: loading..."
            : `Global uploads: ${globalUploadCount ?? 0}`}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Upload Dropzone */}
        <div className="space-y-2">
          <FileUploadDropzone onFileSelect={setFile} />
        </div>

        {/* Upload Button */}
        <Button
          onClick={handleUpload}
          disabled={!file || status.stage === "uploading" || status.stage === "storing"}
          className="w-full"
        >
          {status.stage === "uploading" || status.stage === "storing" ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              {status.message}
            </>
          ) : (
            <>
              <Upload className="mr-2 size-4" />
              Upload to IPFS & Blockchain
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
