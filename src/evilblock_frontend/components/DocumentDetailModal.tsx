"use client";

import { useState, useEffect } from "react";
import { Eye, Loader2, FileText, User, Video, Shield, Clock, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { type FileRecord, getVideoByDocumentCid, type VideoVerificationRecord } from "@/lib/canister";
import { decryptKycData, type KYCFormData } from "@/lib/encryption";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs } from "firebase/firestore";

interface DocumentDetailModalProps {
    file: FileRecord;
    uid: string;
}

interface VideoProofData {
    videoUrl: string;
    videoHash: string;
    timestamp: string;
    fileName: string;
    fileSize: number;
}

export default function DocumentDetailModal({ file, uid }: DocumentDetailModalProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [kycData, setKycData] = useState<KYCFormData | null>(null);
    const [videoProof, setVideoProof] = useState<VideoProofData | null>(null);
    const [blockchainVideo, setBlockchainVideo] = useState<VideoVerificationRecord | null>(null);
    const [error, setError] = useState<string | null>(null);

    const loadDetails = async () => {
        if (!open) return;

        setLoading(true);
        setError(null);

        try {
            // 1. Decrypt KYC data
            if (file.kyc_detail) {
                try {
                    const decrypted = await decryptKycData(file.kyc_detail, uid, file.cid);
                    setKycData(decrypted);
                } catch (e) {
                    console.error("Failed to decrypt KYC data:", e);
                    setKycData(null);
                }
            }

            // 2. Get video verification from blockchain
            try {
                const videoRecord = await getVideoByDocumentCid(file.cid);
                setBlockchainVideo(videoRecord);

                // 3. Get video URL from Firestore if we have the record
                if (videoRecord?.firestore_doc_id) {
                    // Search in user's videoProof collection
                    const videoProofRef = collection(db, 'users', uid, 'videoProof');
                    const q = query(videoProofRef, where('documentCid', '==', file.cid));
                    const querySnapshot = await getDocs(q);

                    if (!querySnapshot.empty) {
                        const videoDoc = querySnapshot.docs[0].data();
                        setVideoProof({
                            videoUrl: videoDoc.videoUrl,
                            videoHash: videoDoc.videoHash,
                            timestamp: videoDoc.timestamp,
                            fileName: videoDoc.fileName,
                            fileSize: videoDoc.fileSize,
                        });
                    }
                }
            } catch (e) {
                console.error("Failed to fetch video proof:", e);
            }

        } catch (e) {
            console.error("Error loading details:", e);
            setError(e instanceof Error ? e.message : "Failed to load details");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            loadDetails();
        }
    }, [open]);

    const formatDate = (timestamp: bigint | string) => {
        if (typeof timestamp === 'bigint') {
            return new Date(Number(timestamp) / 1000000).toLocaleString();
        }
        return new Date(timestamp).toLocaleString();
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                    <Eye className="mr-2 size-3" />
                    View Detail
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="size-5" />
                        Document Details
                    </DialogTitle>
                    <DialogDescription>
                        Complete information for "{file.name}"
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="size-8 animate-spin text-muted-foreground" />
                    </div>
                ) : error ? (
                    <div className="rounded-lg bg-red-50 p-4 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                        <p>{error}</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Document Info Section */}
                        <div className="space-y-3">
                            <h3 className="font-semibold flex items-center gap-2">
                                <FileText className="size-4" />
                                Document Information
                            </h3>
                            <div className="grid grid-cols-2 gap-3 text-sm bg-muted/50 rounded-lg p-4">
                                <div>
                                    <span className="font-medium text-muted-foreground">Name:</span>
                                    <p className="font-semibold">{file.name}</p>
                                </div>
                                <div>
                                    <span className="font-medium text-muted-foreground">Type:</span>
                                    <p>{file.file_type}</p>
                                </div>
                                <div>
                                    <span className="font-medium text-muted-foreground">Size:</span>
                                    <p>{(Number(file.file_size) / 1024).toFixed(2)} KB</p>
                                </div>
                                <div>
                                    <span className="font-medium text-muted-foreground">Upload Date:</span>
                                    <p>{file.date}</p>
                                </div>
                                <div className="col-span-2">
                                    <span className="font-medium text-muted-foreground">CID (IPFS Hash):</span>
                                    <p className="font-mono text-xs break-all bg-muted px-2 py-1 rounded mt-1">{file.cid}</p>
                                </div>
                                <div className="col-span-2">
                                    <span className="font-medium text-muted-foreground">Blockchain Timestamp:</span>
                                    <p>{formatDate(file.timestamp)}</p>
                                </div>
                            </div>
                        </div>

                        {/* KYC Data Section */}
                        <div className="space-y-3">
                            <h3 className="font-semibold flex items-center gap-2">
                                <User className="size-4" />
                                KYC Information
                            </h3>
                            {kycData ? (
                                <div className="grid grid-cols-2 gap-3 text-sm bg-muted/50 rounded-lg p-4">
                                    <div>
                                        <span className="font-medium text-muted-foreground">Full Name:</span>
                                        <p className="font-semibold">{kycData.name}</p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-muted-foreground">Email:</span>
                                        <p>{kycData.email}</p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-muted-foreground">Phone:</span>
                                        <p>{kycData.phone}</p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-muted-foreground">PAN Card:</span>
                                        <p className="font-mono">{kycData.panCard}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="font-medium text-muted-foreground">Address:</span>
                                        <p>{kycData.address1}{kycData.address2 && `, ${kycData.address2}`}</p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-muted-foreground">Aadhaar Card:</span>
                                        <p className="font-mono">{kycData.aadhaarCard?.replace(/(\d{4})/g, '$1 ').trim()}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-4">
                                    <p>KYC data not available or could not be decrypted</p>
                                </div>
                            )}
                        </div>

                        {/* Video Proof Section */}
                        <div className="space-y-3">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Video className="size-4" />
                                Video Verification Proof
                            </h3>
                            {videoProof ? (
                                <div className="space-y-3 bg-muted/50 rounded-lg p-4">
                                    {/* Video Player */}
                                    <div className="rounded-lg overflow-hidden bg-black">
                                        <video
                                            controls
                                            className="w-full max-h-64"
                                            src={videoProof.videoUrl}
                                        >
                                            Your browser does not support the video tag.
                                        </video>
                                    </div>

                                    {/* Video Metadata */}
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div className="flex items-start gap-2">
                                            <Clock className="size-4 text-muted-foreground mt-0.5" />
                                            <div>
                                                <span className="font-medium text-muted-foreground">Recorded:</span>
                                                <p>{new Date(videoProof.timestamp).toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <FileText className="size-4 text-muted-foreground mt-0.5" />
                                            <div>
                                                <span className="font-medium text-muted-foreground">File Name:</span>
                                                <p>{videoProof.fileName}</p>
                                            </div>
                                        </div>
                                        <div className="col-span-2 flex items-start gap-2">
                                            <Hash className="size-4 text-muted-foreground mt-0.5" />
                                            <div>
                                                <span className="font-medium text-muted-foreground">SHA-256 Hash:</span>
                                                <p className="font-mono text-xs break-all bg-muted px-2 py-1 rounded mt-1">
                                                    {videoProof.videoHash}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Blockchain Verification */}
                                    {blockchainVideo && (
                                        <div className="mt-3 pt-3 border-t">
                                            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                                <Shield className="size-4" />
                                                <span className="text-sm font-medium">Verified on Blockchain</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Blockchain Record ID: {Number(blockchainVideo.id)}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-4">
                                    <p>Video proof not available for this document</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
