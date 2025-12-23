"use client";

import { useState } from "react";
import { Eye, Users, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getVerificationLogsByDocumentId, type VerificationLog } from "@/lib/canister";

interface VerificationLogsProps {
  fileId: number;
  fileName: string;
}

export default function VerificationLogs({ fileId, fileName }: VerificationLogsProps) {
  const [logs, setLogs] = useState<VerificationLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const verificationLogs = await getVerificationLogsByDocumentId(fileId);
      setLogs(verificationLogs);
    } catch (error) {
      console.error("Error loading verification logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      loadLogs();
    }
  };

  const formatTimestamp = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000); // Convert nanoseconds to milliseconds
    return date.toLocaleString();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost">
          <Eye className="mr-2 size-3" />
          View Verifications
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="size-5" />
            Verification History
          </DialogTitle>
          <DialogDescription>
            People who have verified: <span className="font-semibold">{fileName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading verification logs...
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="size-12 mx-auto mb-2 opacity-50" />
              <p>No one has verified this file yet</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <Users className="size-4" />
                <span>{logs.length} verification{logs.length !== 1 ? 's' : ''}</span>
              </div>
              
              {logs.map((log) => (
                <div
                  key={Number(log.id)}
                  className="rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">{log.verifier_name}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          UID: {log.verifier_uid.substring(0, 15)}...
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="size-3" />
                        {formatTimestamp(log.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
