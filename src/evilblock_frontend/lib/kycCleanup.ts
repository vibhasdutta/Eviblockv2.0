/**
 * KYC Cleanup Utility
 * Securely clears all KYC-related data from storage
 */

import { clearSecure } from './secureStorage';

/**
 * Clear all KYC data from sessionStorage, IndexedDB, and cookies
 */
export async function clearAllKycData(): Promise<void> {
    if (typeof window === 'undefined') return;

    // 1. Clear encrypted secure storage
    await clearSecure();

    // 2. Clear regular sessionStorage items
    KYC_SESSION_KEYS.forEach(key => sessionStorage.removeItem(key));

    // 3. Clear IndexedDB video data
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
        console.error('Failed to clear IndexedDB:', error);
    }

    // 4. Clear KYC step cookies
    const cookiesToClear = ['kyc_step_1', 'kyc_step_2', 'kyc_step_3'];
    cookiesToClear.forEach(cookie => {
        document.cookie = `${cookie}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    });

    console.log('All KYC data cleared securely');
}

/**
 * List of all KYC-related session storage keys
 */
export const KYC_SESSION_KEYS = [
    'documentStored',
    'pendingDocument',
    'videoVerification',
    'verificationAnswers',
    'documentUploaded',
    'allStepsCompleted',
    'documentType',
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
        // Synchronous cleanup for beforeunload
        // Clear ALL session keys including encrypted ones
        const sessionKeys = [
            'documentStored',
            'pendingDocument',
            'videoVerification',
            'verificationAnswers',
            'kycFormData',
            'documentUploaded',
            'allStepsCompleted',
            'documentType',
            // Encrypted storage keys
            '_secure_kycFormData',
            // NOTE: '_secure_last_activity' not included - managed by secureStorage
        ];
        sessionKeys.forEach(key => sessionStorage.removeItem(key));

        // Clear cookies
        const cookiesToClear = ['kyc_step_1', 'kyc_step_2', 'kyc_step_3'];
        cookiesToClear.forEach(cookie => {
            document.cookie = `${cookie}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        });
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
