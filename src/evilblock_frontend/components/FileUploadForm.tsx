"use client";

import { useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import FileUploadDropzone from "@/components/FileUploadDropzone";
import { uploadToPinata } from "@/lib/ipfs";
import { storeDocumentMetadata, checkDocumentExists } from "@/lib/canister";
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
}

export default function FileUploadForm({ uid, onSuccess, storeOnly = false }: FileUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>({
    stage: "idle",
    message: "",
  });
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus({ stage: "idle", message: "" });
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setStatus({
        stage: "error",
        message: "Please select a file",
        error: "No file selected",
      });
      return;
    }

    /* DISABLED - OLD BROKEN CODE WITHOUT KYC ENCRYPTION
    if (storeOnly) {
      // Store file locally for later upload
      try {
        setStatus({
          stage: "uploading",
          message: "Uploading to IPFS to generate file fingerprint...",
        });

        // First, upload to IPFS to get CID (cryptographic hash of file)
        const ipfsResult = await uploadToPinata(file);
        if (!ipfsResult.success) {
          throw new Error(ipfsResult.error || 'IPFS upload failed');
        }

        const ipfsCID = ipfsResult.hash;

        // Check if file already exists (prevent duplicate uploads)
        setStatus({
          stage: "uploading",
          message: "Verifying file hasn't been modified...",
        });

        const fileExists = await checkDocumentExists(ipfsCID);
        if (fileExists) {
          throw new Error(`File with CID '${ipfsCID}' already exists. You can verify it using the verification tool.`);
        }

        // Convert file to base64 for storage
        const reader = new FileReader();
        reader.onload = () => {
          const base64Data = reader.result as string;
          const fileData = {
            name: file.name,
            type: file.type,
            size: file.size,
            data: base64Data,
            lastModified: file.lastModified,
            cid: ipfsCID  // Store CID for later verification
          };

          sessionStorage.setItem('pendingDocument', JSON.stringify(fileData));

          setStatus({
            stage: "success",
            message: "Document stored locally. Will be uploaded after verification.",
            cid: ipfsCID,
          });

          toast({
            title: "Document Stored",
            description: "Your document fingerprint has been verified and stored securely.",
            variant: "success",
          });

          if (onSuccess) {
            onSuccess();
          }
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error("Store error:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";

        let toastTitle = "Storage Failed";
        let toastDescription = errorMessage;
        let toastVariant: "destructive" | "warning" = "destructive";

        if (errorMessage.includes("already exists")) {
          toastTitle = "File Already Exists";
          toastDescription = "This file has already been uploaded to the blockchain. You can verify it using the verification tool.";
          toastVariant = "warning";
        } else if (errorMessage.includes("IPFS") || errorMessage.includes("Pinata")) {
          toastTitle = "Storage Error";
          toastDescription = "Failed to verify file. Please try again.";
        }

        setStatus({
          stage: "error",
          message: "Storage failed",
          error: errorMessage,
        });

        toast({
          title: toastTitle,
          description: toastDescription,
          variant: toastVariant,
        });
      }
      return;
    }
    */ // END OF DISABLED BROKEN CODE - USE CORRECT PATH BELOW

    try {
      // Stage 1: Upload to IPFS (Pinata)
      setStatus({
        stage: "uploading",
        message: "Uploading to IPFS...",
      });

      const ipfsResult = await uploadToPinata(file);
      if (!ipfsResult.success) {
        throw new Error(ipfsResult.error || 'IPFS upload failed');
      }

      const ipfsCID = ipfsResult.hash;

      // Stage 2: Check if file already exists
      setStatus({
        stage: "uploading",
        message: "Checking for duplicate files...",
      });

      const fileExists = await checkDocumentExists(ipfsCID);
      if (fileExists) {
        throw new Error(`File with CID '${ipfsCID}' already exists. You can verify it using the verification tool.`);
      }

      // Stage 3.5: Handle KYC data based on document type
      const documentType = sessionStorage.getItem('documentType') || 'simple';
      let encryptedKycData = '';

      // All document types need KYC encryption (simple has mini-KYC, others have full KYC)
      setStatus({
        stage: "storing",
        message: "Encrypting KYC data...",
      });

      const kycData = await getKycDataFromSession();
      if (!kycData) {
        throw new Error('KYC data not found. Please complete the KYC form first.');
      }

      // Encrypt KYC data using UID + CID as the key
      encryptedKycData = await encryptKycData(kycData, uid, ipfsCID);

      // Stage 4: Handle blockchain upload based on storeOnly flag
      const currentDate = new Date().toISOString().split("T")[0];

      if (storeOnly) {
        // Legal/Evidence: Store locally for later finalization
        sessionStorage.setItem('pendingDocument', JSON.stringify({
          name: file.name,
          cid: ipfsCID,
          file_type: file.type || "application/octet-stream",
          file_size: file.size,
          date: currentDate,
          kyc_detail: encryptedKycData, // Pass encrypted data forward
        }));

        setStatus({
          stage: "success",
          message: "File uploaded to IPFS. Complete verification to finalize.",
          cid: ipfsCID,
        });

        toast({
          title: "Upload Successful",
          description: `File "${file.name}" uploaded. Continue to video verification.`,
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
      </CardContent >
    </Card >
  );
}
