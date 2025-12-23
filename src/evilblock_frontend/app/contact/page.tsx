"use client";

import { Mail, MessageCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface Contact7Props {
  title?: string;
  description?: string;
  emailLabel?: string;
  emailDescription?: string;
  email?: string;
  officeLabel?: string;
  officeDescription?: string;
  officeAddress?: string;
  phoneLabel?: string;
  phoneDescription?: string;
  phone?: string;
  chatLabel?: string;
  chatDescription?: string;
  chatLink?: string;
}

const Contact7 = ({
  title = "Contact EviBlock",
  description = "Get in touch with the EviBlock team. We're here to help you with decentralized file storage and verification solutions.",
  emailLabel = "Email Support",
  emailDescription = "We respond to all technical inquiries within 24 hours.",
  email = "vibhasdutta11@gmail.com",
  officeLabel = "Headquarters",
  officeDescription = "Our development hub and innovation center.",
  officeAddress = "Remote-First Company - Global Team",
  phoneLabel = "Business Inquiries",
  phoneDescription = "Available for partnerships and enterprise solutions.",
  phone = "Contact via Email",
  chatLabel = "Technical Support",
  chatDescription = "Need help with file uploads or verification? Send us a message.",
  chatLink = "Get Support",
}: Contact7Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.message) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "Message Sent!",
          description: "Thank you for contacting us. We'll get back to you soon.",
        });
        setFormData({ name: "", email: "", message: "" });
        setIsOpen(false);
      } else {
        const errorData = await response.json();
        console.error("API Error:", errorData);
        throw new Error(errorData.details || errorData.error || "Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <section className="bg-background py-16 px-4">
      <div className="container">
        <div className="mb-8">
          <h1 className="mb-2 text-balance text-3xl font-semibold md:text-4xl">
            {title}
          </h1>
          <p className="text-muted-foreground max-w-xl text-lg">
            {description}
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="bg-muted rounded-lg p-3">
            <span className="bg-blue-600 mb-2 flex size-8 flex-col items-center justify-center rounded-full">
              <Mail className="h-4 w-auto text-white" />
            </span>
            <p className="mb-1 text-lg font-semibold">{emailLabel}</p>
            <p className="text-muted-foreground mb-2 text-sm">{emailDescription}</p>
            <a
              href={`mailto:${email}`}
              className="font-semibold hover:underline text-sm"
            >
              {email}
            </a>
          </div>
          <div className="bg-muted rounded-lg p-3">
            <span className="bg-green-600 mb-2 flex size-8 flex-col items-center justify-center rounded-full">
              <MessageCircle className="h-4 w-auto text-white" />
            </span>
            <p className="mb-1 text-lg font-semibold">{chatLabel}</p>
            <p className="text-muted-foreground mb-2 text-sm">{chatDescription}</p>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <button className="font-semibold hover:underline text-sm">
                  {chatLink}
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Contact EviBlock Support</DialogTitle>
                  <DialogDescription>
                    Have questions about decentralized file storage, verification processes, or technical issues? We're here to help.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-6 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Name
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Your full name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      Email
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">
                      Message
                    </Label>
                    <Textarea
                      id="message"
                      name="message"
                      placeholder="Describe your issue with file uploads, verification, or any other EviBlock-related questions..."
                      className="min-h-[100px] resize-none"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsOpen(false)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Sending..." : "Send to EviBlock Team"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </section>
  );
};

export default function Contact() {
  return (
    <div className="min-h-screen">
      <Contact7 />
    </div>
  );
}
