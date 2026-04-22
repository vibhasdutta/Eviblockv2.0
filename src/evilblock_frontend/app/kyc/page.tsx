"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserCheck, ArrowRight, ArrowLeft, Shield, CheckCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { isValidDocumentType, restartKycFlow } from "@/lib/kycCleanup";

interface KYCFormData {
  name: string;
  email: string;
  phone: string;
  address1: string;
  address2: string;
  panCard: string;
  aadhaarCard: string;
}

export default function KYCPage() {
  const [step, setStep] = useState(1); // 1: Form, 2: Review
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<KYCFormData>({
    name: "",
    email: "",
    phone: "",
    address1: "",
    address2: "",
    panCard: "",
    aadhaarCard: "",
  });

  // OTP verification states
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [verifyingField, setVerifyingField] = useState<'pan' | 'aadhaar' | null>(null);
  const [otpValue, setOtpValue] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [panVerified, setPanVerified] = useState(false);
  const [aadhaarVerified, setAadhaarVerified] = useState(false);

  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const documentType = sessionStorage.getItem('documentType');

        if (!isValidDocumentType(documentType) || documentType === 'simple') {
          toast({
            title: "Session Reset",
            description: "Please select your document type again to restart verification.",
            variant: "destructive",
          });
          void restartKycFlow(router);
          return;
        }

        // Pre-fill name and email from Firebase Auth
        setFormData(prev => ({
          ...prev,
          name: user.displayName || "",
          email: user.email || "",
        }));
        setLoading(false);
      } else {
        router.push("/login?returnUrl=/kyc");
      }
    });

    return () => unsubscribe();
  }, [router, toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.phone || formData.phone.length < 10) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid 10-digit phone number.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.address1) {
      toast({
        title: "Validation Error",
        description: "Address Line 1 is required.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.panCard || formData.panCard.length !== 10) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid 10-character PAN card number.",
        variant: "destructive",
      });
      return false;
    }

    if (!panVerified) {
      toast({
        title: "PAN Verification Required",
        description: "Please verify your PAN card number before proceeding.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.aadhaarCard || formData.aadhaarCard.length !== 12) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid 12-digit Aadhaar card number.",
        variant: "destructive",
      });
      return false;
    }

    if (!aadhaarVerified) {
      toast({
        title: "Aadhaar Verification Required",
        description: "Please verify your Aadhaar card number before proceeding.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (validateForm()) {
      setStep(2);
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleConfirm = async () => {
    setSubmitting(true);

    try {
      // Store form data in encrypted secure storage
      const { setSecure } = await import('@/lib/secureStorage');
      await setSecure('kycFormData', formData);

      // Also set a flag cookie for middleware to check KYC completion
      document.cookie = `kyc_step_1=completed; path=/; max-age=3600; SameSite=Strict`;

      toast({
        title: "KYC Details Saved",
        description: "Proceeding to document upload...",
      });

      setTimeout(() => {
        router.push("/upload");
      }, 1000);
    } catch (error) {
      console.error("Failed to save KYC data:", error);
      toast({
        title: "Error",
        description: "Failed to save KYC details. Please try again.",
        variant: "destructive",
      });
      setSubmitting(false);
    }
  };

  // OTP verification functions
  const handleVerifyPAN = () => {
    if (!formData.panCard || formData.panCard.length !== 10) {
      toast({
        title: "Invalid PAN",
        description: "Please enter a valid 10-character PAN card number first.",
        variant: "destructive",
      });
      return;
    }
    setVerifyingField('pan');
    setOtpModalOpen(true);
    // Simulate sending OTP
    toast({
      title: "OTP Sent",
      description: "A verification code has been sent to your registered mobile number.",
    });
  };

  const handleVerifyAadhaar = () => {
    if (!formData.aadhaarCard || formData.aadhaarCard.length !== 12) {
      toast({
        title: "Invalid Aadhaar",
        description: "Please enter a valid 12-digit Aadhaar card number first.",
        variant: "destructive",
      });
      return;
    }
    setVerifyingField('aadhaar');
    setOtpModalOpen(true);
    // Simulate sending OTP
    toast({
      title: "OTP Sent",
      description: "A verification code has been sent to your registered mobile number.",
    });
  };

  const handleOtpSubmit = async () => {
    if (!otpValue || otpValue.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a valid 6-digit OTP.",
        variant: "destructive",
      });
      return;
    }

    setOtpLoading(true);

    // Simulate OTP verification
    setTimeout(() => {
      if (verifyingField === 'pan') {
        setPanVerified(true);
        toast({
          title: "PAN Verified",
          description: "Your PAN card has been successfully verified.",
        });
      } else if (verifyingField === 'aadhaar') {
        setAadhaarVerified(true);
        toast({
          title: "Aadhaar Verified",
          description: "Your Aadhaar card has been successfully verified.",
        });
      }

      setOtpModalOpen(false);
      setOtpValue('');
      setVerifyingField(null);
      setOtpLoading(false);
    }, 2000);
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
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <UserCheck className="size-12 text-primary" />
            <h1 className="text-4xl font-bold">KYC Verification</h1>
          </div>
          <p className="text-muted-foreground">
            <strong>Step 1 of 5:</strong> Complete your KYC verification with PAN/Aadhaar verification
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2">
            <div className={`flex items-center justify-center size-10 rounded-full ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              1
            </div>
            <div className={`h-1 w-20 ${step >= 2 ? 'bg-primary' : 'bg-muted'}`}></div>
            <div className={`flex items-center justify-center size-10 rounded-full ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              2
            </div>
            <div className={`h-1 w-20 ${step >= 3 ? 'bg-primary' : 'bg-muted'}`}></div>
            <div className={`flex items-center justify-center size-10 rounded-full ${step >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              3
            </div>
          </div>
          <div className="flex justify-between mt-2 text-sm text-muted-foreground">
            <span>Details</span>
            <span>Review</span>
            <span></span>
          </div>
        </div>

        {/* Step 1: Form */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Please fill in your KYC details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    required
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">Pre-filled from your account</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    required
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">Pre-filled from your account</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter 10-digit phone number"
                  maxLength={10}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address1">Address Line 1</Label>
                <Input
                  id="address1"
                  name="address1"
                  value={formData.address1}
                  onChange={handleInputChange}
                  placeholder="Street address, building name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address2">Address Line 2</Label>
                <Input
                  id="address2"
                  name="address2"
                  value={formData.address2}
                  onChange={handleInputChange}
                  placeholder="City, State, PIN code (Optional)"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="panCard">PAN Card Number</Label>
                  <div className="flex gap-2">
                    <Input
                      id="panCard"
                      name="panCard"
                      value={formData.panCard}
                      onChange={(e) => {
                        e.target.value = e.target.value.toUpperCase();
                        handleInputChange(e);
                      }}
                      placeholder="ABCDE1234F"
                      maxLength={10}
                      required
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={handleVerifyPAN}
                      variant={panVerified ? "default" : "outline"}
                      size="sm"
                      disabled={panVerified}
                      className="shrink-0"
                    >
                      {panVerified ? (
                        <>
                          <CheckCircle className="mr-1 size-3" />
                          Verified
                        </>
                      ) : (
                        <>
                          <Shield className="mr-1 size-3" />
                          Verify
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="aadhaarCard">Aadhaar Card Number</Label>
                  <div className="flex gap-2">
                    <Input
                      id="aadhaarCard"
                      name="aadhaarCard"
                      type="text"
                      value={formData.aadhaarCard}
                      onChange={handleInputChange}
                      placeholder="123456789012"
                      maxLength={12}
                      required
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={handleVerifyAadhaar}
                      variant={aadhaarVerified ? "default" : "outline"}
                      size="sm"
                      disabled={aadhaarVerified}
                      className="shrink-0"
                    >
                      {aadhaarVerified ? (
                        <>
                          <CheckCircle className="mr-1 size-3" />
                          Verified
                        </>
                      ) : (
                        <>
                          <Shield className="mr-1 size-3" />
                          Verify
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <Button onClick={handleNext} className="w-full">
                Continue to Review
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Review */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Review Your Information</CardTitle>
              <CardDescription>Please verify all details before proceeding</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="grid grid-cols-3 gap-2">
                  <span className="font-semibold">Name:</span>
                  <span className="col-span-2">{formData.name}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="font-semibold">Email:</span>
                  <span className="col-span-2">{formData.email}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="font-semibold">Phone:</span>
                  <span className="col-span-2">{formData.phone}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="font-semibold">Address:</span>
                  <span className="col-span-2">
                    {formData.address1}
                    {formData.address2 && `, ${formData.address2}`}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="font-semibold">PAN Card:</span>
                  <span className="col-span-2 flex items-center gap-2">
                    {formData.panCard}
                    {panVerified && <CheckCircle className="size-4 text-green-600" />}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="font-semibold">Aadhaar Card:</span>
                  <span className="col-span-2 flex items-center gap-2">
                    {formData.aadhaarCard}
                    {aadhaarVerified && <CheckCircle className="size-4 text-green-600" />}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleBack} variant="outline" className="flex-1">
                  <ArrowLeft className="mr-2 size-4" />
                  Back
                </Button>
                <Button onClick={handleConfirm} disabled={submitting} className="flex-1">
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Confirm & Continue
                      <ArrowRight className="ml-2 size-4" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* OTP Verification Modal */}
      <Dialog open={otpModalOpen} onOpenChange={setOtpModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Verify {verifyingField === 'pan' ? 'PAN Card' : 'Aadhaar Card'}</DialogTitle>
            <DialogDescription>
              Enter the 6-digit OTP sent to your registered mobile number to verify your {verifyingField === 'pan' ? 'PAN card' : 'Aadhaar card'}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Enter OTP</Label>
              <Input
                id="otp"
                type="text"
                value={otpValue}
                onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="text-center text-lg tracking-widest"
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setOtpModalOpen(false);
                  setOtpValue('');
                  setVerifyingField(null);
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleOtpSubmit}
                disabled={otpLoading || otpValue.length !== 6}
                className="flex-1"
              >
                {otpLoading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 size-4" />
                    Verify OTP
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
