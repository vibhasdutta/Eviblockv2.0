"use client";

import { useState, useEffect } from "react";
import { Shield, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FileVerification from "@/components/FileVerification";
import FilesList from "@/components/FilesList";
import { auth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const [uid, setUid] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid);
        setLoading(false);
      } else {
        // Redirect to login if not authenticated
        router.push("/login?returnUrl=/dashboard");
      }
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Verify files and view your uploaded evidence records
          </p>
        </div>

        {/* Main Content */}
        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : (
          <Tabs defaultValue="verify" className="w-full max-w-6xl mx-auto">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="verify" className="flex items-center gap-2">
                <Shield className="size-4" />
                Verify
              </TabsTrigger>
              <TabsTrigger value="files" className="flex items-center gap-2">
                <FileText className="size-4" />
                My Files
              </TabsTrigger>
            </TabsList>

            <TabsContent value="verify" className="flex justify-center">
              <FileVerification />
            </TabsContent>

            <TabsContent value="files">
              <FilesList uid={uid} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
