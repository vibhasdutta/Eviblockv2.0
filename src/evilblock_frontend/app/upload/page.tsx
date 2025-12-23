"use client";

import { useState, useEffect } from "react";
import { Upload } from "lucide-react";
import FileUploadForm from "@/components/FileUploadForm";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";

export default function UploadPage() {
  const [uid, setUid] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [documentType, setDocumentType] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docType = sessionStorage.getItem('documentType');
        setDocumentType(docType);

        // Simple documents skip KYC entirely
        if (docType === 'simple') {
          setUid(user.uid);
          setLoading(false);
          return;
        }

        // Legal and Evidence require KYC
        const { hasSecure } = await import('@/lib/secureStorage');
        const hasKycData = hasSecure('kycFormData');

        if (!hasKycData) {
          toast({
            title: "KYC Required",
            description: "Please complete KYC verification first.",
            variant: "destructive",
          });
          router.push("/kyc");
          return;
        }

        setUid(user.uid);
        setLoading(false);
      } else {
        // Redirect to login if not authenticated
        router.push("/login?returnUrl=/upload");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleUploadSuccess = () => {
    const documentType = sessionStorage.getItem('documentType');

    if (documentType === 'simple') {
      // Simple documents go straight to dashboard
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
      return;
    }

    // Legal and Evidence continue to video verification
    sessionStorage.setItem('documentStored', 'true');
    document.cookie = `kyc_step_2=completed; path=/; max-age=3600; SameSite=Strict`;

    setTimeout(() => {
      router.push("/kyc/video-verification");
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Upload className="size-12 text-primary" />
            <h1 className="text-4xl font-bold">Upload Documents</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {documentType === 'simple' ? (
              <>Upload your PDF or DOC/DOCX documents (up to 10MB). Your file will be stored securely on the blockchain.</>
            ) : documentType === 'legal' ? (
              <><strong>Step 2 of 5:</strong> Upload your PDF or DOC/DOCX documents (up to 10MB). Documents will be stored locally first and uploaded to IPFS/blockchain after completing all verification steps.</>
            ) : (
              <><strong>Step 2 of 3:</strong> Upload your PDF or DOC/DOCX documents (up to 10MB). Documents will be stored locally first and uploaded to IPFS/blockchain after video verification.</>
            )}
          </p>
        </div>

        {/* Upload Form */}
        <div className="flex justify-center">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : (
            <FileUploadForm
              uid={uid}
              onSuccess={handleUploadSuccess}
              storeOnly={documentType !== 'simple'} // Simple uploads immediately, others store for later
            />
          )}
        </div>
      </div>
    </div>
  );
}
