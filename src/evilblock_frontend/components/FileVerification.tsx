"use client";

import { useState, useEffect } from "react";
import { Shield, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import FileUploadDropzone from "@/components/FileUploadDropzone";
import { getIPFSUrl, uploadToPinata } from "@/lib/ipfs";
import { verifyDocument, logDocumentVerification, type FileRecord } from "@/lib/canister";
import { auth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";

interface VerificationResult {
  status: "idle" | "verifying" | "verified" | "failed" | "not-found";
  message: string;
  record?: FileRecord;
  error?: string;
}

export default function FileVerification() {
  const [file, setFile] = useState<File | null>(null);
  const [currentUser, setCurrentUser] = useState<{ uid: string; name: string } | null>(null);
  const [result, setResult] = useState<VerificationResult>({
    status: "idle",
    message: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser({
          uid: user.uid,
          name: user.displayName || user.email || "Anonymous"
        });
      } else {
        setCurrentUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleVerify = async () => {
    if (!file) {
      setResult({
        status: "failed",
        message: "Please select a file to verify",
        error: "No file selected",
      });
      return;
    }

    try {
      // Step 1: Upload file to IPFS to get its CID
      setResult({
        status: "verifying",
        message: "Uploading to IPFS to generate CID...",
      });

      const ipfsResult = await uploadToPinata(file);
      if (!ipfsResult.success) {
        throw new Error(ipfsResult.error || 'IPFS upload failed');
      }

      const generatedCID = ipfsResult.hash;

      // Step 2: Check blockchain for this CID
      setResult({
        status: "verifying",
        message: "Checking blockchain records...",
      });

      const record = await verifyDocument(generatedCID);

      // Step 3: Verify match
      if (record.cid === generatedCID) {
        setResult({
          status: "verified",
          message: "✅ File verified! This file exists on the blockchain.",
          record,
        });

        toast({
          title: "File Verified Successfully",
          description: `"${file.name}" has been verified against blockchain records.`,
          variant: "success",
        });

        // Log the verification if user is logged in
        if (currentUser) {
          try {
            await logDocumentVerification(generatedCID, currentUser.uid, currentUser.name);
          } catch (logError) {
            console.error("Failed to log verification:", logError);
            // Show a warning that verification was successful but logging failed
            setTimeout(() => {
              toast({
                title: "Verification Logged",
                description: "File verified successfully, but verification activity couldn't be logged.",
                variant: "warning",
              });
            }, 1000); // Delay to show after success toast
          }
        }
      } else {
        setResult({
          status: "failed",
          message: "❌ Verification failed: CID mismatch",
          error: "Generated CID does not match blockchain record",
        });

        toast({
          title: "Verification Failed",
          description: "Generated CID does not match blockchain record.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Verification error:", error);
      
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      if (errorMessage.includes("No file found") || errorMessage.includes("not found")) {
        setResult({
          status: "not-found",
          message: "❌ File not found on blockchain",
          error: "This file has not been uploaded to the system",
        });

        toast({
          title: "File Not Found",
          description: "This file hasn't been uploaded to the blockchain yet. Please upload it first.",
          variant: "destructive",
        });
      } else {
        setResult({
          status: "failed",
          message: "❌ Verification failed",
          error: errorMessage,
        });

        // Provide more specific error messages for verification failures
        let toastTitle = "Verification Failed";
        let toastDescription = errorMessage;
        
        if (errorMessage.includes("network") || errorMessage.includes("connection")) {
          toastTitle = "Network Error";
          toastDescription = "Please check your internet connection and try again.";
        } else if (errorMessage.includes("IPFS") || errorMessage.includes("Pinata")) {
          toastTitle = "Storage Error";
          toastDescription = "Failed to access file storage. Please try again.";
        } else if (errorMessage.includes("blockchain") || errorMessage.includes("canister")) {
          toastTitle = "Blockchain Error";
          toastDescription = "Failed to verify against blockchain records. Please try again.";
        } else if (errorMessage.includes("CID")) {
          toastTitle = "File Processing Error";
          toastDescription = "The file could not be processed for verification. Please ensure the file is valid and try again.";
        }

        toast({
          title: toastTitle,
          description: toastDescription,
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Card className="w-full min-h-[400px] relative">
      <CardHeader className="relative">
        <CardTitle className="flex items-center gap-2">
          <Shield className="size-6" />
          Verify File Integrity
        </CardTitle>
        <CardDescription>
          Upload a file to verify its authenticity against blockchain records
        </CardDescription>
        
        {/* Verify Button - Top Right Corner */}
        <Button
          onClick={handleVerify}
          disabled={!file || result.status === "verifying"}
          className="absolute top-4 right-4 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 shadow-md hover:shadow-lg transition-all duration-200 px-4 py-2"
          variant="secondary"
          size="sm"
        >
          {result.status === "verifying" ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              <Shield className="mr-2 size-4" />
              Verify File
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* File Upload Dropzone */}
        <div className="space-y-2">
          <FileUploadDropzone onFileSelect={setFile} />
        </div>
      </CardContent>
    </Card>
  );
}
