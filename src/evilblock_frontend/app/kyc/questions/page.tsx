"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db, storage } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, HelpCircle, CheckCircle, AlertCircle } from "lucide-react";

interface Question {
  id: string;
  question: string;
  type: 'text' | 'boolean';
  required: boolean;
  placeholder?: string;
  options?: string[]; // For boolean questions
}

export default function QuestionsPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const router = useRouter();
  const { toast } = useToast();

  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Check prerequisites using secure storage
        const { hasSecure } = await import('@/lib/secureStorage');
        const hasKycData = hasSecure('kycFormData');
        const documentStored = sessionStorage.getItem('documentStored');
        const videoVerification = sessionStorage.getItem('videoVerification');

        if (!hasKycData) {
          toast({
            title: "KYC Required",
            description: "Please complete KYC verification first.",
            variant: "destructive",
          });
          router.push("/kyc");
          return;
        }

        if (!documentStored) {
          toast({
            title: "Document Upload Required",
            description: "Please upload your documents first.",
            variant: "destructive",
          });
          router.push("/upload");
          return;
        }

        if (!videoVerification) {
          toast({
            title: "Video Verification Required",
            description: "Please complete video verification first.",
            variant: "destructive",
          });
          router.push("/kyc/video-verification");
          return;
        }

        // Load AI-generated questions (this page is legal-only)
        const { getGeneratedQuestions } = await import('@/lib/qaApi');
        let generatedQuestions = getGeneratedQuestions();

        if (!generatedQuestions || generatedQuestions.length === 0) {
          // Questions not yet generated - show waiting state
          toast({
            title: "Generating Questions",
            description: "Please wait while we generate questions from your document...",
          });

          // Wait and retry (questions are being generated in background)
          await new Promise(resolve => setTimeout(resolve, 3000));
          generatedQuestions = getGeneratedQuestions();

          if (!generatedQuestions || generatedQuestions.length === 0) {
            // Still not ready - show error
            setLoading(false);
            toast({
              title: "Questions Not Ready",
              description: "Questions are still being generated. Please wait a moment and refresh this page.",
              variant: "destructive",
            });
            return;
          }
        }

        // Shuffle questions randomly for security
        const shuffled = [...generatedQuestions].sort(() => Math.random() - 0.5);
        setShuffledQuestions(shuffled);

        setLoading(false);
      } else {
        router.push("/login?returnUrl=/kyc/questions");
      }
    });

    return () => unsubscribe();
  }, [router, toast]);

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const validateAnswers = () => {
    for (const question of shuffledQuestions) {
      if (question.required && !answers[question.id]?.trim()) {
        toast({
          title: "Required Field",
          description: `Please answer: ${question.question}`,
          variant: "destructive",
        });
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateAnswers()) return;

    setSubmitting(true);

    try {
      // Store answers in sessionStorage
      sessionStorage.setItem('verificationAnswers', JSON.stringify(answers));

      // Retrieve stored document and perform final upload
      const pendingDocument = sessionStorage.getItem('pendingDocument');
      if (!pendingDocument) {
        throw new Error('No document found for upload');
      }

      const fileData = JSON.parse(pendingDocument);

      // Import canister functions
      const { storeDocumentMetadata, linkVideoToDocument, storeVideoVerification } = await import('@/lib/canister');

      // Stage 1: Store metadata on blockchain (using pre-uploaded data)
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      toast({
        title: "Storing on Blockchain",
        description: "Recording document metadata on the blockchain...",
      });

      const currentDate = new Date().toISOString().split("T")[0];
      const documentType = sessionStorage.getItem('documentType') || 'legal'; // Default to legal
      const documentCid = fileData.cid;

      // Use the encrypted KYC data passed from the upload step
      const encryptedKycData = fileData.kyc_detail;
      if (!encryptedKycData) {
        // Fallback if missing (shouldn't happen with new flow, but good for safety)
        const { encryptKycData, getKycDataFromSession } = await import('@/lib/encryption');
        const kycData = await getKycDataFromSession();
        if (!kycData) throw new Error('KYC data not found');
        // Note: Accessing kycData requires 'encryptedKycData' to be re-generated if missing
        // But simpler to just throw error if data flow is broken
        throw new Error('Encrypted KYC data missing from upload step');
      }

      await storeDocumentMetadata({
        name: fileData.name,
        uid: currentUser.uid,
        date: currentDate,
        file_type: fileData.file_type,
        file_size: fileData.file_size,
        cid: fileData.cid,
        kyc_detail: encryptedKycData,
        document_type: documentType,
      });

      // Stage 3: Upload Video to Firebase (after successful file upload)
      toast({
        title: "Uploading Video",
        description: "Uploading your verification video to Firebase Storage...",
      });

      const videoVerificationData = sessionStorage.getItem('videoVerification');
      if (!videoVerificationData) {
        throw new Error('No video verification data found');
      }

      // Retrieve video blob from IndexedDB
      const indexedDB = window.indexedDB || (window as any).webkitIndexedDB;
      const dbRequest = indexedDB.open('evilblock-kyc', 1);

      const videoBlob = await new Promise<Blob>((resolve, reject) => {
        dbRequest.onerror = () => {
          reject(new Error('Failed to open IndexedDB'));
        };

        dbRequest.onsuccess = () => {
          const db = dbRequest.result;
          const transaction = db.transaction('videoVerification', 'readonly');
          const store = transaction.objectStore('videoVerification');
          const getRequest = store.get('current');

          getRequest.onsuccess = () => {
            const data = getRequest.result;
            if (!data || !data.videoBlob) {
              reject(new Error('No video blob found in storage'));
            } else {
              resolve(data.videoBlob);
            }
          };

          getRequest.onerror = () => {
            reject(new Error('Failed to retrieve video from IndexedDB'));
          };
        };
      });

      const videoData = JSON.parse(videoVerificationData);

      // SECURITY: Verify video hash before uploading to Firebase
      // This prevents attackers from swapping the video blob before upload
      toast({
        title: "Verifying Video",
        description: "Verifying video integrity before upload...",
      });

      const videoArrayBuffer = await videoBlob.arrayBuffer();
      const videoHashBuffer = await crypto.subtle.digest('SHA-256', videoArrayBuffer);
      const videoHashArray = Array.from(new Uint8Array(videoHashBuffer));
      const currentVideoHash = videoHashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Compare with stored hash
      if (currentVideoHash !== videoData.videoHash) {
        throw new Error('Video integrity check failed! The video has been modified or swapped. Security violation detected.');
      }

      const storageRef = ref(storage, `users/${currentUser.uid}/videos/${videoData.fileName}`);
      const uploadResult = await uploadBytes(storageRef, videoBlob);
      const videoUrl = await getDownloadURL(uploadResult.ref);

      // Store video metadata in Firestore
      toast({
        title: "Storing Video Metadata",
        description: "Recording video verification in Firestore...",
      });

      const { addDoc, collection } = await import('firebase/firestore');
      const videoProofRef = collection(db, 'users', currentUser.uid, 'videoProof');
      const videoProofDoc = await addDoc(videoProofRef, {
        videoUrl,
        videoHash: videoData.videoHash,
        timestamp: new Date().toISOString(),
        documentCid,
        fileName: videoData.fileName,
        fileSize: videoData.videoSize,
      });

      // Store video hash on blockchain
      toast({
        title: "Storing Video on Blockchain",
        description: "Recording video hash on blockchain...",
      });

      const blockchainRecord = await storeVideoVerification(
        currentUser.uid,
        videoData.videoHash,
        videoProofDoc.id
      );

      // Link video to document on blockchain
      toast({
        title: "Linking Records",
        description: "Linking document to video verification...",
      });

      await linkVideoToDocument(Number(blockchainRecord.id), documentCid);

      toast({
        title: "Verification Complete",
        description: "All verification steps completed successfully. Cleaning up...",
      });

      // Clear ALL sensitive KYC data after successful completion
      const { clearKycDataOnSuccess } = await import('@/lib/kycCleanup');
      await clearKycDataOnSuccess();

      toast({
        title: "Success!",
        description: "Your documents are now being processed. Redirecting to dashboard...",
      });

      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (error) {
      console.error("Submission error:", error);
      toast({
        title: "Submission Failed",
        description: "Failed to complete verification. Please try again.",
        variant: "destructive",
      });
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <HelpCircle className="size-12 text-primary" />
            <h1 className="text-4xl font-bold">Additional Verification</h1>
          </div>
          <p className="text-muted-foreground">
            <strong>Step 4 of 5:</strong> Please answer the following questions to complete your verification process
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Verification Questions</CardTitle>
            <CardDescription>
              These questions have been <strong>automatically generated from your uploaded document</strong> to verify your understanding of its contents.
              Answer all questions accurately based on the document you submitted.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {shuffledQuestions.map((question, index) => (
              <div key={question.id} className="space-y-2">
                <Label htmlFor={question.id} className="text-base font-medium">
                  {index + 1}. {question.question}
                  {question.required && <span className="text-red-500 ml-1">*</span>}
                </Label>

                {question.type === 'text' ? (
                  <Input
                    id={question.id}
                    type="text"
                    value={answers[question.id] || ''}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    placeholder={question.placeholder}
                    required={question.required}
                    className="w-full"
                  />
                ) : question.type === 'boolean' ? (
                  <div className="flex gap-6 mt-2">
                    {question.options?.map((option) => (
                      <label key={option} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={question.id}
                          value={option}
                          checked={answers[question.id] === option}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          className="w-4 h-4 text-primary"
                          required={question.required}
                        />
                        <span className="text-sm font-medium">{option}</span>
                      </label>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}

            <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-3">
                <AlertCircle className="size-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800 dark:text-amber-200">
                  <p className="font-medium mb-1">Important:</p>
                  <p>Please ensure all information provided is accurate and matches your submitted documents.
                    False information may result in account suspension or legal action.</p>
                </div>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full"
              size="lg"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Completing Verification...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 size-4" />
                  Complete Verification & Submit Documents
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}