"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/firebase/config";
import { collection, addDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storeVideoVerification, linkVideoToDocument } from "@/lib/canister";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Camera, Play, Square, RotateCcw, CheckCircle2 } from "lucide-react";

interface VideoVerificationData {
  videoBlob: Blob | null;
  recordedAt: Date | null;
}

export default function VideoVerificationPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState<VideoVerificationData>({
    videoBlob: null,
    recordedAt: null,
  });
  const [showCamera, setShowCamera] = useState(false);
  const [hasRecordedVideo, setHasRecordedVideo] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [documentType, setDocumentType] = useState<string>('legal'); // Track document type for step indicator

  const videoRef = useRef<HTMLVideoElement>(null);
  const recordedVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const router = useRouter();
  const { toast } = useToast();

  // Sample text for user to read
  const verificationText = `I hereby confirm that I am the rightful owner of the documents being submitted for KYC verification. I understand that providing false information may result in account suspension or legal action. All information provided is accurate and up to date.`;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Check if KYC form data exists using secure storage
        const { hasSecure } = await import('@/lib/secureStorage');
        const hasKycData = hasSecure('kycFormData');
        if (!hasKycData) {
          toast({
            title: "KYC Required",
            description: "Please complete KYC form first.",
            variant: "destructive",
          });
          router.push("/kyc");
          return;
        }

        // Check if document has been stored
        const documentStored = sessionStorage.getItem('documentStored');
        if (!documentStored) {
          toast({
            title: "Document Upload Required",
            description: "Please upload your documents first.",
            variant: "destructive",
          });
          router.push("/upload");
          return;
        }

        // Check if video verification has already been completed
        const videoVerification = sessionStorage.getItem('videoVerification');
        if (videoVerification) {
          toast({
            title: "Video Already Recorded",
            description: "Your video verification has been completed. Proceeding to questions.",
          });
          router.push("/kyc/questions");
          return;
        }

        // Get document type for step indicator
        const docType = sessionStorage.getItem('documentType') || 'legal';
        setDocumentType(docType);

        setLoading(false);
      } else {
        router.push("/login?returnUrl=/kyc/video-verification");
      }
    });

    return () => unsubscribe();
  }, [router, toast]);

  const startCamera = async () => {
    // Check if mediaDevices is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast({
        title: "Camera Not Supported",
        description: "Your browser doesn't support camera access.",
        variant: "destructive",
      });
      return;
    }

    setShowCamera(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: true
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Camera error:", error);
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive",
      });
      setShowCamera(false);
    }
  };

  const startRecording = () => {
    if (!streamRef.current) return;

    // Try different MIME types for better browser compatibility
    const mimeTypes = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4',
      ''
    ];

    let mediaRecorder: MediaRecorder | null = null;
    let selectedMimeType = '';

    for (const mimeType of mimeTypes) {
      if (mimeType === '' || MediaRecorder.isTypeSupported(mimeType)) {
        try {
          mediaRecorder = new MediaRecorder(streamRef.current, mimeType ? { mimeType } : {});
          selectedMimeType = mimeType;
          break;
        } catch (error) {
          console.warn(`MIME type ${mimeType} not supported, trying next...`);
        }
      }
    }

    if (!mediaRecorder) {
      toast({
        title: "Recording Not Supported",
        description: "Your browser doesn't support video recording.",
        variant: "destructive",
      });
      return;
    }

    mediaRecorderRef.current = mediaRecorder;
    chunksRef.current = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: selectedMimeType || 'video/webm' });
      setRecordedVideo({
        videoBlob: blob,
        recordedAt: new Date(),
      });
      setHasRecordedVideo(true);
      setIsRecording(false);
      setRecordingTime(0);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };

    mediaRecorder.start();
    setIsRecording(true);

    // Start timer
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => {
        const newTime = prev + 1;
        // Auto-stop after 30 seconds
        if (newTime >= 30) {
          stopRecording();
          toast({
            title: "Recording Stopped",
            description: "Maximum recording time (30 seconds) reached.",
          });
          // Clear the timer
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          return 30; // Cap at 30 seconds
        }
        return newTime;
      });
    }, 1000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setRecordingTime(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const resetRecording = () => {
    setRecordedVideo({ videoBlob: null, recordedAt: null });
    setHasRecordedVideo(false);
    setRecordingTime(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    setShowCamera(false);
    setIsRecording(false);
    setHasRecordedVideo(false);
    setRecordedVideo({ videoBlob: null, recordedAt: null });
    setRecordingTime(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const playRecordedVideo = () => {
    if (recordedVideoRef.current && recordedVideo.videoBlob) {
      const url = URL.createObjectURL(recordedVideo.videoBlob);
      recordedVideoRef.current.src = url;
      recordedVideoRef.current.play();
    }
  };

  const handleSubmit = async () => {
    if (!hasRecordedVideo || !recordedVideo.videoBlob) {
      toast({
        title: "Video Required",
        description: "Please record your video verification first.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Convert blob to file
      const videoFile = new File([recordedVideo.videoBlob], `video-verification-${Date.now()}.webm`, {
        type: 'video/webm',
      });

      // Generate SHA-256 hash of video
      toast({
        title: "Processing Video",
        description: "Generating video hash...",
      });

      const arrayBuffer = await videoFile.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const videoHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Store video blob in IndexedDB for later upload
      // This will be uploaded to Firebase after document verification is complete
      toast({
        title: "Saving Video",
        description: "Saving video locally...",
      });

      const indexedDB = window.indexedDB || (window as any).webkitIndexedDB;
      const request = indexedDB.open('evilblock-kyc', 1);

      request.onerror = () => {
        throw new Error('Failed to open IndexedDB');
      };

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('videoVerification')) {
          db.createObjectStore('videoVerification');
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction('videoVerification', 'readwrite');
        const store = transaction.objectStore('videoVerification');

        const fileName = `video-verification-${Date.now()}.webm`;
        const videoMetadata = {
          videoHash,
          recordedAt: recordedVideo.recordedAt,
          videoSize: recordedVideo.videoBlob!.size,
          fileName,
        };

        store.put({
          videoBlob: recordedVideo.videoBlob, // Store as blob directly
          ...videoMetadata,
        }, 'current');

        // Also store metadata in sessionStorage for the questions page
        sessionStorage.setItem('videoVerification', JSON.stringify(videoMetadata));

        transaction.oncomplete = async () => {
          // Set KYC step 3 cookie for middleware protection
          document.cookie = `kyc_step_3=completed; path=/; max-age=3600; SameSite=Strict`;

          const documentType = sessionStorage.getItem('documentType');

          if (documentType === 'evidence') {
            // Evidence type skips questions - finalize upload here
            toast({
              title: "Processing Evidence",
              description: "Uploading to blockchain and Firebase...",
            });

            try {
              // Import necessary functions
              const { storeDocumentMetadata, storeVideoVerification, linkVideoToDocument } = await import('@/lib/canister');
              const { getStorage, ref, uploadBytes, getDownloadURL } = await import('firebase/storage');


              // Get pending document from session
              const pendingDocJson = sessionStorage.getItem('pendingDocument');
              if (!pendingDocJson) {
                throw new Error('No pending document found');
              }
              const pendingDoc = JSON.parse(pendingDocJson);

              // Use pre-encrypted KYC data from upload step
              const encryptedKycData = pendingDoc.kyc_detail;
              if (!encryptedKycData) {
                // Fallback re-encryption (safety check)
                const { encryptKycData } = await import('@/lib/encryption');
                const { getSecure } = await import('@/lib/secureStorage');
                const kycData = await getSecure('kycFormData');
                if (!kycData) throw new Error('KYC data not found/expired');
                // This path requires re-importing which is fine for fallback
              }

              // Upload to blockchain
              const currentDate = new Date().toISOString().split("T")[0];
              await storeDocumentMetadata({
                name: pendingDoc.name,
                uid: currentUser.uid,
                date: currentDate,
                file_type: pendingDoc.file_type,
                file_size: pendingDoc.file_size,
                cid: pendingDoc.cid,
                kyc_detail: encryptedKycData || "", // Should be there
                document_type: 'evidence',
              });

              // Get video metadata from sessionStorage (same as Legal)
              const videoVerificationData = sessionStorage.getItem('videoVerification');
              if (!videoVerificationData) {
                throw new Error('No video verification data found');
              }
              const videoData = JSON.parse(videoVerificationData);

              // Get video blob from IndexedDB
              const indexedDB = window.indexedDB || (window as any).webkitIndexedDB;
              const dbRequest = indexedDB.open('evilblock-kyc', 1);

              const videoBlob: Blob = await new Promise((resolve, reject) => {
                dbRequest.onsuccess = () => {
                  const indexedDbInstance = dbRequest.result;
                  const transaction = indexedDbInstance.transaction('videoVerification', 'readonly');
                  const store = transaction.objectStore('videoVerification');
                  const getRequest = store.get('current'); // Use 'current' key as it's used for storing

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

              // Upload video to Firebase Storage (same path and fileName as Legal)
              const storage = getStorage();

              // SECURITY: Verify video hash before uploading to Firebase
              // This prevents attackers from swapping the video blob before upload
              const videoArrayBuffer = await videoBlob.arrayBuffer();
              const videoHashBuffer = await crypto.subtle.digest('SHA-256', videoArrayBuffer);
              const videoHashArray = Array.from(new Uint8Array(videoHashBuffer));
              const currentVideoHash = videoHashArray.map(b => b.toString(16).padStart(2, '0')).join('');

              // Compare with stored hash
              if (currentVideoHash !== videoData.videoHash) {
                throw new Error('Video integrity check failed! The video has been modified or swapped. Security violation detected.');
              }

              const storageRef = ref(storage, `users/${currentUser.uid}/videos/${videoData.fileName}`);
              await uploadBytes(storageRef, videoBlob);
              const videoUrl = await getDownloadURL(storageRef);

              // Store video metadata in Firestore (same as Legal flow - with ALL fields)
              const { db: firestoreDb } = await import('@/lib/firebase/config');
              const videoProofRef = collection(firestoreDb, 'users', currentUser.uid, 'videoProof');
              const videoProofDoc = await addDoc(videoProofRef, {
                videoUrl,
                videoHash: videoData.videoHash,
                timestamp: new Date().toISOString(),
                documentCid: pendingDoc.cid,
                fileName: videoData.fileName,
                fileSize: videoData.videoSize,
              });

              // Store video verification on blockchain  
              const vidVerification = await storeVideoVerification(currentUser.uid, videoData.videoHash, videoProofDoc.id);

              // Link video to document on blockchain (same as Legal)
              await linkVideoToDocument(Number(vidVerification.id), pendingDoc.cid);

              toast({
                title: "Upload Complete",
                description: "Evidence uploaded successfully!",
              });

              // Clear ALL sensitive KYC data after successful completion
              const { clearKycDataOnSuccess } = await import('@/lib/kycCleanup');
              await clearKycDataOnSuccess();

              // Clean up and redirect
              setTimeout(() => {
                router.push("/dashboard");
              }, 1500);

            } catch (error) {
              console.error("Evidence finalization error:", error);
              toast({
                title: "Upload Failed",
                description: error instanceof Error ? error.message : "Failed to finalize upload",
                variant: "destructive",
              });
            }
          } else {
            // Legal type continues to questions
            toast({
              title: "Video Recorded",
              description: "Video saved locally. Will be uploaded after document verification.",
            });

            setTimeout(() => {
              router.push("/kyc/questions");
            }, 1500);
          }
        };

        transaction.onerror = () => {
          throw new Error('Failed to save video to IndexedDB');
        };
      };
    } catch (error) {
      console.error("Submission error:", error);
      toast({
        title: "Submission Failed",
        description: "Failed to upload video verification. Please try again.",
        variant: "destructive",
      });
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">Video Verification</h1>
          <p className="text-muted-foreground">
            {documentType === 'legal' ? (
              <><strong>Step 3 of 5:</strong> Read the text below aloud while recording yourself</>
            ) : (
              <><strong>Step 3 of 3:</strong> Read the text below aloud while recording yourself</>
            )}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Left Column - Text to Read */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Please Read This Text</CardTitle>
              <CardDescription>
                Read the following text clearly and naturally while recording your video
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/50 p-6 rounded-lg border">
                <p className="text-lg leading-relaxed text-foreground">
                  {verificationText}
                </p>
              </div>
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Instructions:</strong> Position yourself clearly in frame, read the text naturally,
                  and ensure good lighting and audio quality. Recording will automatically stop after 30 seconds.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Right Column - Camera/Recording */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Video Recording</CardTitle>
              <CardDescription>
                {hasRecordedVideo ? "Review your recorded video" : "Record yourself reading the text"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!showCamera && !hasRecordedVideo && (
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Camera className="size-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">Click start to begin recording</p>
                    <Button onClick={startCamera} size="lg">
                      <Camera className="mr-2 size-4" />
                      Start Camera
                    </Button>
                  </div>
                </div>
              )}

              {showCamera && !hasRecordedVideo && (
                <div className="space-y-4">
                  <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    {isRecording && (
                      <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full">
                        <div className="size-2 bg-white rounded-full animate-pulse" />
                        <span className="text-sm font-medium">REC {formatTime(recordingTime)} / 0:30</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    {!isRecording ? (
                      <Button onClick={startRecording} className="flex-1" size="lg">
                        <Play className="mr-2 size-4" />
                        Start Recording
                      </Button>
                    ) : (
                      <Button onClick={stopRecording} variant="destructive" className="flex-1 text-white" size="lg">
                        <Square className="mr-2 size-4" />
                        Stop Recording
                      </Button>
                    )}
                    <Button onClick={isRecording ? cancelRecording : stopCamera} variant="outline" size="lg">
                      {isRecording ? "Cancel Recording" : "Cancel"}
                    </Button>
                  </div>
                </div>
              )}

              {hasRecordedVideo && (
                <div className="space-y-4">
                  <div className="aspect-video bg-black rounded-lg overflow-hidden">
                    <video
                      ref={recordedVideoRef}
                      controls
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={playRecordedVideo} variant="outline" className="flex-1">
                      <Play className="mr-2 size-4" />
                      Play Video
                    </Button>
                    <Button onClick={resetRecording} variant="outline" className="flex-1">
                      <RotateCcw className="mr-2 size-4" />
                      Record Again
                    </Button>
                  </div>

                  <div className="text-sm text-muted-foreground text-center">
                    Recorded on {recordedVideo.recordedAt?.toLocaleString()}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="pt-6">
            <Button
              onClick={handleSubmit}
              disabled={submitting || !hasRecordedVideo}
              className="w-full"
              size="lg"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Submitting Verification...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 size-4" />
                  Complete Video Verification & Proceed to Upload
                </>
              )}
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-3">
              By submitting, you confirm that you are the person in the video and have read the text accurately
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
