"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Shield, Upload, ArrowRight, Info } from "lucide-react";

export default function DocumentTypeSelection() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSelectType = (type: "legal" | "evidence" | "simple") => {
    try {
      console.log("Document type selected:", type);
      setLoading(true);

      // Store document type in sessionStorage
      sessionStorage.setItem("documentType", type);
      console.log("Stored in sessionStorage, now navigating...");

      // Route based on type
      if (type === "simple") {
        console.log("Navigating to /kyc/simple");
        router.push("/kyc/simple"); // Mini-KYC for simple docs
      } else {
        // Legal and Evidence both require full KYC
        console.log("Navigating to /kyc");
        router.push("/kyc");
      }
    } catch (error) {
      console.error("Navigation error:", error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Select Document Type</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Choose the type of document you want to upload. Different types require different verification levels.
          </p>
        </div>

        {/* Document Type Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* Legal/Government Documents */}
          <Card className="border-2 hover:border-primary transition-all cursor-pointer group relative overflow-hidden flex flex-col">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <CardHeader className="relative">
              <div className="absolute right-4 top-4 group/info z-20">
                <Info className="size-5 text-muted-foreground hover:text-blue-500 transition-colors cursor-help" />
                <div className="absolute right-0 top-8 w-64 p-3 bg-popover border rounded-lg shadow-lg opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all duration-200 z-10 animate-in fade-in slide-in-from-top-2">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">Use for:</span> Passports, licenses, contracts, deeds, or any official document requiring maximum verification
                  </p>
                </div>
              </div>
              <div className="size-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
                <Shield className="size-6 text-blue-500" />
              </div>
              <CardTitle className="text-xl">Legal/Government Documents</CardTitle>
              <CardDescription>
                Official documents requiring full identity verification
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <ul className="space-y-2 text-sm text-muted-foreground mb-6 flex-1">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">✓</span>
                  <span>Complete KYC verification</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">✓</span>
                  <span>Video identity proof</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">✓</span>
                  <span>Security questions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">✓</span>
                  <span>Highest security level</span>
                </li>
              </ul>
              <Button
                className="w-full group-hover:bg-blue-600"
                onClick={() => handleSelectType("legal")}
                disabled={loading}
              >
                Start Verification
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Evidence Documents */}
          <Card className="border-2 hover:border-primary transition-all cursor-pointer group relative overflow-hidden flex flex-col">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <CardHeader className="relative">
              <div className="absolute right-4 top-4 group/info z-20">
                <Info className="size-5 text-muted-foreground hover:text-orange-500 transition-colors cursor-help" />
                <div className="absolute right-0 top-8 w-64 p-3 bg-popover border rounded-lg shadow-lg opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all duration-200 z-10 animate-in fade-in slide-in-from-top-2">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">Use for:</span> Photos, videos, or documents that need identity proof but not full security questions
                  </p>
                </div>
              </div>
              <div className="size-12 rounded-lg bg-orange-500/10 flex items-center justify-center mb-4">
                <FileText className="size-6 text-orange-500" />
              </div>
              <CardTitle className="text-xl">Upload Evidence</CardTitle>
              <CardDescription>
                Evidence requiring identity verification
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <ul className="space-y-2 text-sm text-muted-foreground mb-6 flex-1">
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 mt-1">✓</span>
                  <span>Complete KYC verification</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 mt-1">✓</span>
                  <span>Video identity proof</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground/50 mt-1">−</span>
                  <span className="text-muted-foreground/50">No security questions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 mt-1">✓</span>
                  <span>Standard security level</span>
                </li>
              </ul>
              <Button
                className="w-full group-hover:bg-orange-600"
                onClick={() => handleSelectType("evidence")}
                disabled={loading}
              >
                Start Verification
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Simple Document */}
          <Card className="border-2 hover:border-primary transition-all cursor-pointer group relative overflow-hidden flex flex-col">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <CardHeader className="relative">
              <div className="absolute right-4 top-4 group/info z-20">
                <Info className="size-5 text-muted-foreground hover:text-green-500 transition-colors cursor-help" />
                <div className="absolute right-0 top-8 w-64 p-3 bg-popover border rounded-lg shadow-lg opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all duration-200 z-10 animate-in fade-in slide-in-from-top-2">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">Use for:</span> Personal documents, notes, or files you just want to store securely on the blockchain
                  </p>
                </div>
              </div>
              <div className="size-12 rounded-lg bg-green-500/10 flex items-center justify-center mb-4">
                <Upload className="size-6 text-green-500" />
              </div>
              <CardTitle className="text-xl">Simple Document</CardTitle>
              <CardDescription>
                Regular documents for secure storage
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <ul className="space-y-2 text-sm text-muted-foreground mb-6 flex-1">
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground/50 mt-1">−</span>
                  <span className="text-muted-foreground/50">No KYC verification</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground/50 mt-1">−</span>
                  <span className="text-muted-foreground/50">No video proof</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground/50 mt-1">−</span>
                  <span className="text-muted-foreground/50">No security questions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Quick upload only</span>
                </li>
              </ul>
              <Button
                className="w-full group-hover:bg-green-600"
                onClick={() => handleSelectType("simple")}
                disabled={loading}
                variant="outline"
              >
                Quick Upload
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
