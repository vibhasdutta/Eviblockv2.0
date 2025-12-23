"use client";

import { useEffect, useState, useCallback } from "react";
import { FileText, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDocumentsByUid, type FileRecord } from "@/lib/canister";
import { getIPFSUrl } from "@/lib/ipfs";
import VerificationLogs from "@/components/VerificationLogs";
import DocumentDetailModal from "@/components/DocumentDetailModal";

export default function FilesList({ uid }: { uid: string }) {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFiles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const records = await getDocumentsByUid(uid);
      setFiles(records);
    } catch (err) {
      console.error("Error loading files:", err);
      setError(err instanceof Error ? err.message : "Failed to load files");
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  return (
    <Card className="w-full min-h-[400px]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="size-6" />
              Your Uploaded Files
            </CardTitle>
            <CardDescription>
              All files uploaded to IPFS and stored on blockchain
            </CardDescription>
          </div>
          <Button
            onClick={loadFiles}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                <RefreshCw className="mr-2 size-4" />
                Refresh
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading && files.length === 0 ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="rounded-lg bg-red-50 p-4 text-red-800 dark:bg-red-900/20 dark:text-red-400">
            <p className="font-medium">Error loading files</p>
            <p className="text-sm">{error}</p>
          </div>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileText className="size-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No files uploaded yet</p>
            <p className="text-sm text-muted-foreground">
              Upload your first file to get started
            </p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto space-y-3">
            {files.map((file) => (
              <div
                key={Number(file.id)}
                className="flex items-start justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <FileText className="size-5 text-muted-foreground" />
                    <h3 className="font-semibold">{file.name}</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium">Type:</span> {file.file_type}
                    </div>
                    <div>
                      <span className="font-medium">Size:</span>{" "}
                      {(Number(file.file_size) / 1024).toFixed(2)} KB
                    </div>
                    <div>
                      <span className="font-medium">Category:</span>{" "}
                      <span className="capitalize">{file.document_type || 'Unknown'}</span>
                    </div>
                    <div>
                      <span className="font-medium">Date:</span> {file.date}
                    </div>
                    <div>
                      <span className="font-medium">ID:</span> {Number(file.id)}
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">CID:</span>{" "}
                    <code className="bg-muted px-1 py-0.5 rounded">
                      {file.cid.substring(0, 20)}...{file.cid.substring(file.cid.length - 10)}
                    </code>
                  </div>
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  <Button
                    size="sm"
                    variant="outline"
                    asChild
                  >
                    <a
                      href={getIPFSUrl(file.cid)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View on IPFS
                      <ExternalLink className="ml-2 size-3" />
                    </a>
                  </Button>

                  <VerificationLogs
                    fileId={Number(file.id)}
                    fileName={file.name}
                  />

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      navigator.clipboard.writeText(file.cid);
                    }}
                  >
                    Copy CID
                  </Button>

                  <DocumentDetailModal file={file} uid={uid} />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
