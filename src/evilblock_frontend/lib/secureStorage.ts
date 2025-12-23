/**
 * Secure Storage Utility
 * Provides encrypted sessionStorage with in-memory key management
 * Key is generated once per session and stored only in memory (dies when tab closes)
 * Auto-expires after 30 minutes of inactivity
 */

// Session key stored ONLY in memory - not persisted anywhere
let sessionKey: CryptoKey | null = null;
let lastActivity: number = Date.now();
const TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const IV_LENGTH = 12; // 96 bits for GCM
const STORAGE_PREFIX = '_secure_';
const ACTIVITY_KEY = '_secure_last_activity';

/**
 * Initialize or get the session encryption key
 */
async function getSessionKey(): Promise<CryptoKey> {
    // Check for timeout
    const storedActivity = sessionStorage.getItem(ACTIVITY_KEY);
    if (storedActivity) {
        const lastActivityTime = parseInt(storedActivity, 10);
        if (Date.now() - lastActivityTime > TIMEOUT_MS) {
            // Session expired, clear everything
            await clearSecure();
            sessionKey = null;
        }
    }

    if (!sessionKey) {
        // Generate new key
        sessionKey = await crypto.subtle.generateKey(
            { name: 'AES-GCM', length: 256 },
            false, // not extractable - can't be exported
            ['encrypt', 'decrypt']
        );
    }

    // Update activity timestamp
    lastActivity = Date.now();
    sessionStorage.setItem(ACTIVITY_KEY, lastActivity.toString());

    return sessionKey;
}

/**
 * Encrypt and store data in sessionStorage
 */
export async function setSecure<T>(key: string, value: T): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
        const cryptoKey = await getSessionKey();
        const jsonString = JSON.stringify(value);
        const plaintext = new TextEncoder().encode(jsonString);

        // Generate random IV
        const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

        // Encrypt
        const ciphertext = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            cryptoKey,
            plaintext
        );

        // Combine IV + ciphertext and encode to base64
        const combined = new Uint8Array(iv.length + ciphertext.byteLength);
        combined.set(iv);
        combined.set(new Uint8Array(ciphertext), iv.length);

        const base64 = btoa(String.fromCharCode(...combined));
        sessionStorage.setItem(STORAGE_PREFIX + key, base64);
    } catch (error) {
        console.error('Secure storage write error:', error);
        throw new Error('Failed to securely store data');
    }
}

/**
 * Retrieve and decrypt data from sessionStorage
 */
export async function getSecure<T>(key: string): Promise<T | null> {
    if (typeof window === 'undefined') return null;

    try {
        const base64 = sessionStorage.getItem(STORAGE_PREFIX + key);
        if (!base64) return null;

        const cryptoKey = await getSessionKey();

        // Decode from base64
        const combined = new Uint8Array(
            atob(base64).split('').map(c => c.charCodeAt(0))
        );

        // Extract IV and ciphertext
        const iv = combined.slice(0, IV_LENGTH);
        const ciphertext = combined.slice(IV_LENGTH);

        // Decrypt
        const plaintext = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            cryptoKey,
            ciphertext
        );

        const jsonString = new TextDecoder().decode(plaintext);
        return JSON.parse(jsonString) as T;
    } catch (error) {
        console.error('Secure storage read error:', error);
        // If decryption fails (key changed/expired), remove the item
        sessionStorage.removeItem(STORAGE_PREFIX + key);
        return null;
    }
}

/**
 * Remove a specific item from secure storage
 */
export function removeSecure(key: string): void {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(STORAGE_PREFIX + key);
}

/**
 * Clear all secure storage items
 */
export async function clearSecure(): Promise<void> {
    if (typeof window === 'undefined') return;

    // Get all keys that start with our prefix
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key?.startsWith(STORAGE_PREFIX) || key === ACTIVITY_KEY) {
            keysToRemove.push(key);
        }
    }

    // Remove them
    keysToRemove.forEach(key => sessionStorage.removeItem(key));

    // Clear the session key
    sessionKey = null;
}

/**
 * Check if a secure storage key exists
 */
export function hasSecure(key: string): boolean {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(STORAGE_PREFIX + key) !== null;
}

/**
 * Refresh activity timestamp (call this on user interaction)
 */
export function refreshActivity(): void {
    if (typeof window === 'undefined') return;
    lastActivity = Date.now();
    sessionStorage.setItem(ACTIVITY_KEY, lastActivity.toString());
}

/**
 * Check if session has expired
 */
export function isSessionExpired(): boolean {
    if (typeof window === 'undefined') return true;

    const storedActivity = sessionStorage.getItem(ACTIVITY_KEY);
    if (!storedActivity) return true;

    const lastActivityTime = parseInt(storedActivity, 10);
    return Date.now() - lastActivityTime > TIMEOUT_MS;
}

// Legacy compatibility: Export functions that work like regular sessionStorage
// but with encryption. Use these as drop-in replacements.
export const secureStorage = {
    setItem: setSecure,
    getItem: getSecure,
    removeItem: removeSecure,
    clear: clearSecure,
    has: hasSecure,
    refresh: refreshActivity,
    isExpired: isSessionExpired,
};
