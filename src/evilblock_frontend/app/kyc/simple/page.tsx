"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { FileCheck } from "lucide-react";

export default function SimpleKYCPage() {
    const router = useRouter();
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
    });

    const [errors, setErrors] = useState({
        name: "",
        email: "",
        phone: "",
    });

    const validateForm = () => {
        const newErrors = {
            name: "",
            email: "",
            phone: "",
        };

        let isValid = true;

        // Name validation
        if (!formData.name.trim()) {
            newErrors.name = "Name is required";
            isValid = false;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email.trim()) {
            newErrors.email = "Email is required";
            isValid = false;
        } else if (!emailRegex.test(formData.email)) {
            newErrors.email = "Please enter a valid email";
            isValid = false;
        }

        // Phone validation
        const phoneRegex = /^[0-9]{10}$/;
        if (!formData.phone.trim()) {
            newErrors.phone = "Phone number is required";
            isValid = false;
        } else if (!phoneRegex.test(formData.phone)) {
            newErrors.phone = "Please enter a valid 10-digit phone number";
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            toast({
                title: "Validation Error",
                description: "Please fix the errors in the form",
                variant: "destructive",
            });
            return;
        }

        try {
            // Store simplified KYC data in secure storage
            const { setSecure } = await import('@/lib/secureStorage');
            await setSecure('kycFormData', formData);

            // Set cookie for middleware
            document.cookie = `kyc_step_1=completed; path=/; max-age=3600; SameSite=Strict`;

            toast({
                title: "Basic Info Confirmed",
                description: "You can now upload your document",
            });

            setTimeout(() => {
                router.push("/upload");
            }, 1000);

        } catch (error) {
            console.error("Mini-KYC error:", error);
            toast({
                title: "Error",
                description: "Failed to save information. Please try again.",
                variant: "destructive",
            });
        }
    };

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field as keyof typeof errors]) {
            setErrors(prev => ({ ...prev, [field]: "" }));
        }
    };

    return (
        <div className="min-h-screen bg-background py-12">
            <div className="container mx-auto px-4 max-w-2xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <FileCheck className="size-12 text-primary" />
                        <h1 className="text-4xl font-bold">Basic Information</h1>
                    </div>
                    <p className="text-muted-foreground">
                        Please provide your basic details for document verification
                    </p>
                </div>

                {/* Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Verification</CardTitle>
                        <CardDescription>
                            Simple documents require basic contact information
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Name */}
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name *</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="Enter your full name"
                                    value={formData.name}
                                    onChange={(e) => handleChange("name", e.target.value)}
                                    className={errors.name ? "border-red-500" : ""}
                                />
                                {errors.name && (
                                    <p className="text-sm text-red-500">{errors.name}</p>
                                )}
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="your.email@example.com"
                                    value={formData.email}
                                    onChange={(e) => handleChange("email", e.target.value)}
                                    className={errors.email ? "border-red-500" : ""}
                                />
                                {errors.email && (
                                    <p className="text-sm text-red-500">{errors.email}</p>
                                )}
                            </div>

                            {/* Phone */}
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number *</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    placeholder="10-digit phone number"
                                    value={formData.phone}
                                    onChange={(e) => handleChange("phone", e.target.value.replace(/\D/g, '').slice(0, 10))}
                                    className={errors.phone ? "border-red-500" : ""}
                                />
                                {errors.phone && (
                                    <p className="text-sm text-red-500">{errors.phone}</p>
                                )}
                            </div>

                            {/* Submit */}
                            <Button type="submit" className="w-full" size="lg">
                                Continue to Upload
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Info */}
                <div className="mt-6 p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground text-center">
                        <strong>Note:</strong> This basic information will be encrypted and stored with your document for verification purposes.
                    </p>
                </div>
            </div>
        </div>
    );
}
