"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db, storage } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";

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
  sessionId?: string; // For verification
}

interface VerificationState {
  isVerifying: boolean;
  isCorrect: boolean | null;
  feedback: string | null;
}

export default function QuestionsPage() {
  const [loading, setLoading] = useState(true);
  const [generationStatus, setGenerationStatus] = useState<string>("Initializing...");
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [verificationStates, setVerificationStates] = useState<Record<string, VerificationState>>({});
  const router = useRouter();
  const { toast } = useToast();

  const [hasFailed, setHasFailed] = useState(false);
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);
  const [uploadStatus, setUploadStatus] = useState<string>("");

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
        const { getGeneratedQuestions, streamGenerateQuestions, storeGeneratedQuestions } = await import('@/lib/qaApi');
        let generatedQuestions = getGeneratedQuestions();

        if (!generatedQuestions || generatedQuestions.length === 0) {
          // Questions not yet generated - start streaming in this page for better UX
          setGenerationStatus("Starting Q&A generation stream...");

          const { getFileFromIndexedDB } = await import('@/lib/fileStorage');
          const file = await getFileFromIndexedDB();

          if (!file) {
            toast({
              title: "File Not Found",
              description: "We couldn't find your uploaded document. Please try uploading again.",
              variant: "destructive",
            });
            router.push("/upload");
            return;
          }

          let collectedQuestions: Question[] = [];
          let currentSessionId = "";

          await streamGenerateQuestions(file, 5, (type, data) => {
            switch (type) {
              case 'status':
                setGenerationStatus(data.message || data.status);
                break;
              case 'info':
                currentSessionId = data.session_id;
                setGenerationStatus(`Processing document (${data.extraction_method || 'OCR'})...`);
                break;
              case 'question':
                const newQuestion: Question = {
                  id: data.question_id || `q${collectedQuestions.length}`,
                  question: data.question || data.q,
                  type: data.type === 'true_false' ? 'boolean' : 'text',
                  required: true,
                  options: data.type === 'true_false' ? ['True', 'False'] : undefined,
                  sessionId: currentSessionId
                };
                collectedQuestions.push(newQuestion);
                setGenerationStatus(`Generated ${collectedQuestions.length} questions...`);
                break;
              case 'done':
                setGenerationStatus("Generation complete!");
                generatedQuestions = collectedQuestions;
                storeGeneratedQuestions(collectedQuestions);
                // Trigger shuffle and show questions
                const shuffled = [...collectedQuestions].sort(() => Math.random() - 0.5);
                setShuffledQuestions(shuffled);
                setLoading(false);
                break;
              case 'error':
                toast({
                  title: "Generation Failed",
                  description: data.message || "An error occurred during question generation.",
                  variant: "destructive",
                });
                setLoading(false);
                break;
            }
          });

          return; // The 'done' event will set loading(false)
        }

        // Questions already generated in background
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
    // Clear verification state when answer changes
    setVerificationStates(prev => ({
      ...prev,
      [questionId]: { isVerifying: false, isCorrect: null, feedback: null }
    }));
  };

  const validateAnswers = async () => {
    if (hasFailed) return false;

    for (const question of shuffledQuestions) {
      const answer = answers[question.id]?.trim();
      if (question.required && !answer) {
        toast({
          title: "Required Field",
          description: `Please answer: ${question.question}`,
          variant: "destructive",
        });
        return false;
      }

      // Verify answer semantically or fuzzy match via API
      if (question.sessionId) {
        setVerificationStates(prev => ({
          ...prev,
          [question.id]: { isVerifying: true, isCorrect: null, feedback: "Verifying..." }
        }));

        const { verifyAnswer } = await import('@/lib/qaApi');
        const result = await verifyAnswer(question.sessionId, question.id, answer);

        if (result) {
          const isCorrect = result.is_correct;
          setVerificationStates(prev => ({
            ...prev,
            [question.id]: {
              isVerifying: false,
              isCorrect: isCorrect,
              feedback: isCorrect ? result.feedback : "Incorrect answer. Please check your document and try again."
            }
          }));

          if (!isCorrect) {
            setHasFailed(true);
            const { clearAllKycData } = await import('@/lib/kycCleanup');
            await clearAllKycData();
            toast({
              title: "Verification Failed",
              description: `Verification failed. Cached verification data has been cleared. Please restart the process.`,
              variant: "destructive",
            });
            return false;
          }
        } else {
          setVerificationStates(prev => ({
            ...prev,
            [question.id]: { isVerifying: false, isCorrect: null, feedback: "Verification failed. Please try again." }
          }));
          return false;
        }
      }
    }
    return true;
  };

  const uploadFinalDocument = async () => {
    try {
      setUploadStatus("Uploading document to IPFS...");

      const { getFileFromIndexedDB } = await import('@/lib/fileStorage');
      const file = await getFileFromIndexedDB();
      if (!file) throw new Error("Document not found in local storage");

      const { uploadToPinata } = await import('@/lib/ipfs');
      const { storeDocumentMetadata, storeVideoVerification, linkVideoToDocument } = await import('@/lib/canister');
      const { encryptKycData, getKycDataFromSession } = await import('@/lib/encryption');

      // 1. Upload document to Pinata
      const ipfsResult = await uploadToPinata(file);
      if (!ipfsResult.success) throw new Error(ipfsResult.error || 'IPFS upload failed');
      const cid = ipfsResult.hash;

      // 2. Encrypt KYC data with real CID
      setUploadStatus("Encrypting KYC data...");
      const kycData = await getKycDataFromSession();
      if (!kycData) throw new Error('KYC data not found');
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');
      const encryptedKycData = await encryptKycData(kycData, currentUser.uid, cid);

      // 3. Store document on blockchain
      setUploadStatus("Storing metadata on blockchain...");
      const documentType = sessionStorage.getItem('documentType') || 'legal';
      await storeDocumentMetadata({
        name: file.name,
        uid: currentUser.uid,
        date: new Date().toISOString().split("T")[0],
        file_type: file.type || "application/octet-stream",
        file_size: file.size,
        cid: cid,
        kyc_detail: encryptedKycData,
        document_type: documentType,
      });

      // 4. Upload video to Firebase Storage & store on blockchain
      setUploadStatus("Uploading video verification...");
      const videoVerificationData = sessionStorage.getItem('videoVerification');
      if (videoVerificationData) {
        const videoData = JSON.parse(videoVerificationData);

        // Retrieve video blob from IndexedDB
        const videoBlob: Blob = await new Promise((resolve, reject) => {
          // Open without specifying version to get current database state
          const dbRequest = indexedDB.open('evilblock-kyc');

          dbRequest.onsuccess = () => {
            const dbInstance = dbRequest.result;

            // Check if the object store exists before using it
            if (!dbInstance.objectStoreNames.contains('videoVerification')) {
              // Store doesn't exist at current version - upgrade to create it
              const newVersion = dbInstance.version + 1;
              dbInstance.close();

              const upgradeRequest = indexedDB.open('evilblock-kyc', newVersion);
              upgradeRequest.onupgradeneeded = (event) => {
                const upgradedDb = (event.target as IDBOpenDBRequest).result;
                if (!upgradedDb.objectStoreNames.contains('videoVerification')) {
                  upgradedDb.createObjectStore('videoVerification');
                }
              };
              upgradeRequest.onsuccess = () => {
                // Store was just created but is empty - video wasn't stored here
                upgradeRequest.result.close();
                reject(new Error('Video verification store was missing. Please re-record your video.'));
              };
              upgradeRequest.onerror = () => reject(new Error('Failed to upgrade video database'));
              return;
            }

            const transaction = dbInstance.transaction('videoVerification', 'readonly');
            const store = transaction.objectStore('videoVerification');
            const getRequest = store.get('current');

            getRequest.onsuccess = () => {
              if (getRequest.result && getRequest.result.videoBlob) {
                resolve(getRequest.result.videoBlob);
              } else {
                reject(new Error('Video not found in database'));
              }
            };

            getRequest.onerror = () => reject(new Error('Failed to retrieve video'));
          };

          dbRequest.onerror = () => reject(new Error('Failed to open database'));
        });

        // Verify video hash integrity before uploading
        const videoArrayBuffer = await videoBlob.arrayBuffer();
        const videoHashBuffer = await crypto.subtle.digest('SHA-256', videoArrayBuffer);
        const videoHashArray = Array.from(new Uint8Array(videoHashBuffer));
        const currentVideoHash = videoHashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        if (currentVideoHash !== videoData.videoHash) {
          throw new Error('Video integrity check failed! The video has been modified or swapped. Security violation detected.');
        }

        // Upload video to Firebase Storage
        const { ref: storageRef, uploadBytes, getDownloadURL } = await import('firebase/storage');
        const videoStorageRef = storageRef(storage, `users/${currentUser.uid}/videos/${videoData.fileName}`);
        await uploadBytes(videoStorageRef, videoBlob);
        const videoUrl = await getDownloadURL(videoStorageRef);

        // Store video metadata in Firestore
        setUploadStatus("Recording video verification...");
        const { collection, addDoc } = await import('firebase/firestore');
        const videoProofRef = collection(db, 'users', currentUser.uid, 'videoProof');
        const videoProofDoc = await addDoc(videoProofRef, {
          videoUrl,
          videoHash: videoData.videoHash,
          timestamp: new Date().toISOString(),
          documentCid: cid,
          fileName: videoData.fileName,
          fileSize: videoData.videoSize,
        });

        // Store video verification on blockchain
        const vidVerification = await storeVideoVerification(currentUser.uid, videoData.videoHash, videoProofDoc.id);

        // Link video to document on blockchain
        await linkVideoToDocument(Number(vidVerification.id), cid);
      }

      // 5. Cleanup
      const { clearKycDataOnSuccess } = await import('@/lib/kycCleanup');
      await clearKycDataOnSuccess();

      return true;
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    if (hasFailed) return;

    const isValid = await validateAnswers();
    if (!isValid) return;

    setSubmitting(true);

    try {
      // Step 2: Since verification is successful, perform the actual upload to Pinata and Blockchain
      await uploadFinalDocument();

      toast({
        title: "Verification Successful",
        description: "Your document has been verified and stored securely.",
      });

      // Navigate back to dashboard with success status
      router.push('/dashboard?verification=success');
    } catch (error: any) {
      console.error('Error submitting KYC:', error);
      const rawMessage = error?.message || "An error occurred while finishing your KYC.";
      const description = rawMessage.includes("Global upload limit reached")
        ? "The platform-wide upload capacity has been reached. Please try again later."
        : rawMessage;
      toast({
        title: "Submission Failed",
        description,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background px-4">
        <Loader2 className="size-12 animate-spin text-primary" />
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold">Generating Your Secure Questions</h2>
          <p className="text-muted-foreground animate-pulse">{generationStatus}</p>
        </div>
        <div className="max-w-md w-full bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 p-4 rounded-lg mt-4 text-sm text-blue-800 dark:text-blue-200">
          <p className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </span>
            Our AI is analyzing your document to create unique identity verification questions.
          </p>
        </div>
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

        {hasFailed ? (
          <Card className="border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/10">
            <CardHeader>
              <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-2">
                <AlertCircle className="size-8" />
                <CardTitle className="text-2xl">Verification Failed</CardTitle>
              </div>
              <CardDescription className="text-red-700 dark:text-red-300">
                Multiple incorrect answers detected. For security reasons, your verification has been halted.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">
                Your answers did not sufficiently match the contents of the uploaded document.
                To ensure the integrity of the verification process, you must re-upload a clear and valid document.
              </p>
              <div className="pt-4 flex gap-4">
                <Button
                  onClick={async () => {
                    const { clearAllKycData } = await import('@/lib/kycCleanup');
                    await clearAllKycData();
                    router.push('/document-type-selection');
                  }}
                  variant="destructive"
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white border-none"
                >
                  Restart Upload Process
                </Button>
                <Button
                  onClick={async () => {
                    const { clearAllKycData } = await import('@/lib/kycCleanup');
                    await clearAllKycData();
                    router.push('/contact');
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Contact Support
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
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
                <div key={question.id} className="space-y-3 pb-6 border-b last:border-0">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <HelpCircle className="size-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Label htmlFor={question.id} className="text-base font-medium">
                          {index + 1}. {question.question}
                        </Label>
                        {question.type === 'boolean' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800">
                            True/False
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            Q&A
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {question.type === 'text' ? (
                    <div className="space-y-2">
                      <Input
                        id={question.id}
                        type="text"
                        value={answers[question.id] || ''}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        placeholder={question.placeholder || 'Enter your answer'}
                        className={`w-full ${verificationStates[question.id]?.isCorrect === true ? 'border-green-500 bg-green-50' : verificationStates[question.id]?.isCorrect === false ? 'border-red-500 bg-red-50' : ''}`}
                        required={question.required}
                      />
                      {verificationStates[question.id]?.feedback && (
                        <p className={`text-xs ${verificationStates[question.id]?.isCorrect === true ? 'text-green-600' : verificationStates[question.id]?.isCorrect === false ? 'text-red-600' : 'text-muted-foreground'}`}>
                          {verificationStates[question.id]?.feedback}
                        </p>
                      )}
                    </div>
                  ) : question.type === 'boolean' && question.options ? (
                    <div className="space-y-2">
                      <div className="flex gap-4 ml-8">
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
                      {verificationStates[question.id]?.feedback && (
                        <p className={`text-xs ml-8 ${verificationStates[question.id]?.isCorrect === true ? 'text-green-600' : verificationStates[question.id]?.isCorrect === false ? 'text-red-600' : 'text-muted-foreground'}`}>
                          {verificationStates[question.id]?.feedback}
                        </p>
                      )}
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
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {uploadStatus || "Processing..."}
                  </>
                ) : (
                  <>
                    Complete Verification
                    <CheckCircle className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}