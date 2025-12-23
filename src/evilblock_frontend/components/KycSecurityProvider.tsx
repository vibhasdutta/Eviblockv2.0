"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isSessionExpired, clearSecure } from "@/lib/secureStorage";
import { clearAllKycData, KYC_SESSION_KEYS } from "@/lib/kycCleanup";
import { useToast } from "@/hooks/use-toast";

// KYC-related paths where we should check for timeout
const KYC_PATHS = [
    '/kyc',
    '/kyc/simple',
    '/upload',
    '/kyc/video-verification',
    '/kyc/questions',
];

/**
 * KYC Security Provider
 * Handles session timeout checks and cleanup on page unload
 * Add this to your layout or wrap KYC pages with it
 */
export default function KycSecurityProvider({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { toast } = useToast();

    // Check if we're on a KYC-related page
    const isKycPage = KYC_PATHS.some(path => pathname?.startsWith(path));

    useEffect(() => {
        // Only run checks on KYC pages
        if (!isKycPage) return;

        // Check for session timeout on mount and navigation
        const checkTimeout = async () => {
            // Only check timeout if there's actually KYC data in progress
            // Don't redirect fresh sessions (user just starting KYC)
            const hasKycInProgress = sessionStorage.getItem('_secure_kycFormData') !== null ||
                sessionStorage.getItem('_secure_last_activity') !== null ||
                sessionStorage.getItem('documentStored') !== null;

            if (hasKycInProgress && isSessionExpired()) {
                toast({
                    title: "Session Expired",
                    description: "Your session has timed out for security. Please start the KYC process again.",
                    variant: "destructive",
                });

                // Clear all data
                await clearAllKycData();

                // Redirect to home
                router.push('/');
            }
        };

        checkTimeout();

        // Setup periodic timeout check (every minute)
        const intervalId = setInterval(checkTimeout, 60000);

        // Cleanup on page unload/close
        const handleBeforeUnload = () => {
            // Clear KYC cookies synchronously (can't do async in beforeunload)
            const cookiesToClear = ['kyc_step_1', 'kyc_step_2', 'kyc_step_3'];
            cookiesToClear.forEach(cookie => {
                document.cookie = `${cookie}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
            });

            // Clear ALL session storage items including encrypted ones
            KYC_SESSION_KEYS.forEach(key => sessionStorage.removeItem(key));

            // Clear IndexedDB video blob (synchronous attempt)
            try {
                const indexedDB = window.indexedDB || (window as any).webkitIndexedDB;
                const request = indexedDB.open('evilblock-kyc', 1);
                request.onsuccess = () => {
                    const db = request.result;
                    if (db.objectStoreNames.contains('videoVerification')) {
                        const transaction = db.transaction('videoVerification', 'readwrite');
                        const store = transaction.objectStore('videoVerification');
                        store.delete('current');
                    }
                    db.close();
                };
            } catch (error) {
                console.error('Failed to clear IndexedDB on unload:', error);
            }
        };

        // Add event listener for page close/reload
        window.addEventListener('beforeunload', handleBeforeUnload);

        // Cleanup
        return () => {
            clearInterval(intervalId);
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [isKycPage, pathname, router, toast]);

    return <>{children}</>;
}
