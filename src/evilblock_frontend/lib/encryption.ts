/**
 * Encryption utility for KYC data
 * Uses AES-256-GCM with PBKDF2 key derivation
 * Key is derived from UID + CID
 */
import { perf, PerfCategory } from './perf';

// Salt for PBKDF2 (should be consistent for reproducible keys)
const SALT = new TextEncoder().encode('evilblock-kyc-salt-v1');
const ITERATIONS = 100000;
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for GCM
const TAG_LENGTH = 128; // 128 bits auth tag

/**
 * Derive an AES-256 key from UID and CID using PBKDF2
 */
async function deriveKey(uid: string, cid: string): Promise<CryptoKey> {
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(uid + cid),
        'PBKDF2',
        false,
        ['deriveKey']
    );

    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: SALT,
            iterations: ITERATIONS,
            hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: KEY_LENGTH },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * Encrypt KYC data using AES-256-GCM
 * Returns Base64-encoded string containing IV + ciphertext + auth tag
 */
export async function encryptKycData(
    data: KYCFormData,
    uid: string,
    cid: string
): Promise<string> {
    return perf.track('Encrypt KYC Data (AES-256-GCM)', PerfCategory.ENCRYPTION, async () => {
        // Validate inputs
        if (!data || !data.name) {
            throw new Error('Invalid KYC data');
        }
        if (!uid || !cid) {
            throw new Error('UID and CID are required for encryption');
        }

        // Convert data to JSON string
        const jsonString = JSON.stringify(data);
        const plaintext = new TextEncoder().encode(jsonString);

        // Derive encryption key
        const key = await deriveKey(uid, cid);

        // Generate random IV
        const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

        // Encrypt using AES-256-GCM
        const ciphertext = await crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv: iv,
                tagLength: TAG_LENGTH,
            },
            key,
            plaintext
        );

        // Combine IV + ciphertext (auth tag is appended by AES-GCM)
        const combined = new Uint8Array(iv.length + ciphertext.byteLength);
        combined.set(iv);
        combined.set(new Uint8Array(ciphertext), iv.length);

        // Encode to Base64
        return btoa(String.fromCharCode(...combined));
    }, { dataSize: JSON.stringify(data).length });
}

/**
 * Decrypt KYC data using AES-256-GCM
 * Takes Base64-encoded string and returns decrypted object
 */
export async function decryptKycData(
    encryptedData: string,
    uid: string,
    cid: string
): Promise<KYCFormData> {
    return perf.track('Decrypt KYC Data (AES-256-GCM)', PerfCategory.ENCRYPTION, async () => {
        // Validate inputs
        if (!encryptedData) {
            throw new Error('Encrypted data is required');
        }
        if (!uid || !cid) {
            throw new Error('UID and CID are required for decryption');
        }

        // Decode from Base64
        const combined = new Uint8Array(
            atob(encryptedData)
                .split('')
                .map((c) => c.charCodeAt(0))
        );

        // Extract IV and ciphertext
        const iv = combined.slice(0, IV_LENGTH);
        const ciphertext = combined.slice(IV_LENGTH);

        // Derive encryption key
        const key = await deriveKey(uid, cid);

        // Decrypt using AES-256-GCM
        const plaintextBuffer = await crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: iv,
                tagLength: TAG_LENGTH,
            },
            key,
            ciphertext
        );

        // Decode and parse JSON
        const jsonString = new TextDecoder().decode(plaintextBuffer);
        return JSON.parse(jsonString);
    });
}

/**
 * KYC Form Data interface
 */
export interface KYCFormData {
    name: string;
    email: string;
    phone: string;
    address1: string;
    address2: string;
    panCard: string;
    aadhaarCard: string;
}

/**
 * Get KYC data from secure encrypted storage
 * This is an async function now due to decryption
 */
export async function getKycDataFromSession(): Promise<KYCFormData | null> {
    if (typeof window === 'undefined') return null;

    try {
        const { getSecure } = await import('@/lib/secureStorage');
        return await getSecure<KYCFormData>('kycFormData');
    } catch {
        return null;
    }
}

/**
 * Legacy sync version - checks if data exists without decrypting
 * Use getKycDataFromSession() for actual data retrieval
 */
export function hasKycDataInSession(): boolean {
    if (typeof window === 'undefined') return false;
    // Check for legacy plain storage
    if (sessionStorage.getItem('kycFormData')) return true;
    // Check for encrypted storage
    return sessionStorage.getItem('_secure_kycFormData') !== null;
}
