"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isSessionExpired, refreshActivity } from "@/lib/secureStorage";
import { clearKycBrowserStateSync, restartKycFlow } from "@/lib/kycCleanup";
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
                await restartKycFlow(router);
            }
        };

        checkTimeout();

        // Setup periodic timeout check (every minute)
        const intervalId = setInterval(checkTimeout, 60000);

        // Keep activity heartbeat fresh only when user is interacting.
        const trackActivity = () => refreshActivity();
        const activityEvents: Array<keyof WindowEventMap> = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
        activityEvents.forEach((eventName) => {
            window.addEventListener(eventName, trackActivity, { passive: true });
        });

        // Re-check timeout when tab becomes visible/focused.
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                checkTimeout();
            }
        };
        const handleFocus = () => checkTimeout();
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);

        // Cleanup on page unload/close
        const handleBeforeUnload = () => {
            clearKycBrowserStateSync();

            // Clear IndexedDB video blob (synchronous attempt)
            try {
                const indexedDB = window.indexedDB || (window as any).webkitIndexedDB;
                indexedDB.deleteDatabase('evilblock-kyc');
                indexedDB.deleteDatabase('evilblock-files');
            } catch (error) {
                console.error('Failed to clear IndexedDB on unload:', error);
            }
        };

        // pagehide improves reliability on mobile Safari where beforeunload can be skipped.
        const handlePageHide = () => {
            handleBeforeUnload();
        };

        // Add event listener for page close/reload
        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('pagehide', handlePageHide);

        // Cleanup
        return () => {
            clearInterval(intervalId);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('pagehide', handlePageHide);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
            activityEvents.forEach((eventName) => {
                window.removeEventListener(eventName, trackActivity);
            });
        };
    }, [isKycPage, pathname, router, toast]);

    return <>{children}</>;
}
