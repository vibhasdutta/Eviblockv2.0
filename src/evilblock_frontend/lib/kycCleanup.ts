/**
 * KYC Cleanup Utility
 * Securely clears all KYC-related data from storage
 */

import { clearSecure } from './secureStorage';

export const DOCUMENT_SELECTION_ROUTE = '/document-type-selection';

export function isValidDocumentType(value: string | null | undefined): value is 'legal' | 'evidence' | 'simple' {
    return value === 'legal' || value === 'evidence' || value === 'simple';
}

const KYC_COOKIE_KEYS = ['kyc_step_1', 'kyc_step_2', 'kyc_step_3'] as const;
const KYC_INDEXED_DB_NAMES = ['evilblock-kyc', 'evilblock-files'] as const;
const KYC_LOCAL_STORAGE_KEYS = [
    'documentType',
    'generatedQuestions',
    'qaSessionId',
    'perfSessionId',
    'pendingDocument',
    'pendingFileUpload',
    'videoVerification',
] as const;
const KYC_LOCAL_STORAGE_PREFIXES = ['evilblock:kyc:', 'evilblock:session:', 'evilblock:perf:'] as const;

function clearKycCookies(): void {
    KYC_COOKIE_KEYS.forEach((cookie) => {
        document.cookie = `${cookie}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    });
}

function clearKycLocalStorage(): void {
    if (typeof window === 'undefined') return;

    KYC_LOCAL_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));

    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;

        if (KYC_LOCAL_STORAGE_PREFIXES.some((prefix) => key.startsWith(prefix))) {
            keysToRemove.push(key);
        }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));
}

function clearKycSessionStorage(): void {
    KYC_SESSION_KEYS.forEach((key) => sessionStorage.removeItem(key));
}

function deleteIndexedDbDatabase(name: string): Promise<void> {
    return new Promise((resolve) => {
        try {
            const indexedDB = window.indexedDB || (window as any).webkitIndexedDB;
            const request = indexedDB.deleteDatabase(name);

            request.onsuccess = () => resolve();
            request.onerror = () => {
                console.error(`Failed to delete IndexedDB database: ${name}`, request.error);
                resolve();
            };
            request.onblocked = () => resolve();
        } catch (error) {
            console.error(`Failed to delete IndexedDB database: ${name}`, error);
            resolve();
        }
    });
}

async function clearKycIndexedDb(): Promise<void> {
    await Promise.all(KYC_INDEXED_DB_NAMES.map((dbName) => deleteIndexedDbDatabase(dbName)));
}

async function clearKycCacheStorage(): Promise<void> {
    if (typeof window === 'undefined' || !('caches' in window)) return;

    try {
        const cacheNames = await caches.keys();
        const appCaches = cacheNames.filter((cacheName) => cacheName.toLowerCase().includes('evilblock'));
        await Promise.all(appCaches.map((cacheName) => caches.delete(cacheName)));
    } catch (error) {
        console.error('Failed to clear Cache Storage:', error);
    }
}

export function clearKycBrowserStateSync(): void {
    if (typeof window === 'undefined') return;

    clearKycSessionStorage();
    clearKycLocalStorage();
    clearKycCookies();
}

/**
 * Clear all KYC data from browser storage, IndexedDB, cache storage, and cookies
 */
export async function clearAllKycData(): Promise<void> {
    if (typeof window === 'undefined') return;

    // 1. Clear encrypted secure storage
    await clearSecure();

    // 2. Clear browser-side storage synchronously
    clearKycBrowserStateSync();

    // 3. Clear IndexedDB databases
    await clearKycIndexedDb();

    // 4. Clear Cache Storage buckets owned by this app
    await clearKycCacheStorage();

    console.log('All KYC data cleared securely');
}

/**
 * List of all KYC-related session storage keys
 */
export const KYC_SESSION_KEYS = [
    'documentStored',
    'pendingDocument',
    'pendingFileUpload', // File metadata for deferred IPFS upload
    'videoVerification',
    'verificationAnswers',
    'documentUploaded',
    'allStepsCompleted',
    'documentType',
    'generatedQuestions', // Q&A API generated questions
    'qaSessionId',
    'perfSessionId',
    'kycFormData', // Legacy plain storage
    // Encrypted storage keys
    '_secure_kycFormData',
    // NOTE: DO NOT include '_secure_last_activity' here
    // Clearing it causes KycSecurityProvider to think session expired
];

/**
 * Setup cleanup on page unload (for security)
 * Call this in your app's root layout or main component
 */
export function setupUnloadCleanup(): () => void {
    if (typeof window === 'undefined') return () => { };

    const handleUnload = () => {
        clearKycBrowserStateSync();
    };

    window.addEventListener('beforeunload', handleUnload);

    // Return cleanup function
    return () => window.removeEventListener('beforeunload', handleUnload);
}

/**
 * Clear KYC data on successful completion
 * Call this after all verification steps are complete
 */
export async function clearKycDataOnSuccess(): Promise<void> {
    await clearAllKycData();
    console.log('KYC data cleared after successful completion');
}

type NavigationRouter = {
    replace: (href: string) => void;
};

export async function restartKycFlow(router?: NavigationRouter): Promise<void> {
    await clearAllKycData();

    if (router) {
        router.replace(DOCUMENT_SELECTION_ROUTE);
        return;
    }

    if (typeof window !== 'undefined') {
        window.location.replace(DOCUMENT_SELECTION_ROUTE);
    }
}
