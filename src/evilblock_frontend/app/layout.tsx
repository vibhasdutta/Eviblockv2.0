import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Toaster } from "@/components/ui/toaster";
import KycSecurityProvider from "@/components/KycSecurityProvider";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Eviblock - Blockchain Platform",
  description: "Building the future of blockchain technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${outfit.variable} antialiased flex flex-col min-h-screen font-sans`}
      >
        <Navbar />
        <main className="flex-grow">
          <KycSecurityProvider>
            {children}
          </KycSecurityProvider>
        </main>
        <Footer />
        <Toaster />
      </body>
    </html>
  );
}
