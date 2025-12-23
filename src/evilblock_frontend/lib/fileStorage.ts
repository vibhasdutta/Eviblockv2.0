/**
 * File Storage for Legal Documents
 * 
 * Provides IndexedDB storage for large file blobs before IPFS upload.
 * Legal documents are stored locally until questions are answered,
 * then uploaded to Pinata/IPFS.
 */

const DB_NAME = 'evilblock-files';
const DB_VERSION = 1;
const STORE_NAME = 'pendingUploads';

/**
 * Open IndexedDB database
 */
function openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error('Failed to open file storage database:', request.error);
            reject(new Error(`Database error: ${request.error?.message || 'Unknown'}`));
        };

        request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };

        request.onsuccess = () => {
            resolve(request.result);
        };
    });
}

/**
 * Store file in IndexedDB for later upload
 * Used for legal documents before questions are answered
 */
export async function storeFileInIndexedDB(file: File): Promise<void> {
    try {
        const db = await openDatabase();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            // Store the entire File object
            const request = store.put(file, 'pendingFile');

            request.onsuccess = () => {
                console.log('✅ File stored in IndexedDB:', file.name, `(${file.size} bytes)`);
                resolve();
            };

            request.onerror = () => {
                console.error('❌ Failed to store file:', request.error);
                reject(new Error('Failed to store file in IndexedDB'));
            };

            transaction.oncomplete = () => {
                db.close();
            };
        });
    } catch (error) {
        console.error('File storage error:', error);
        throw error;
    }
}

/**
 * Retrieve file from IndexedDB after questions answered
 */
export async function getFileFromIndexedDB(): Promise<File> {
    try {
        const db = await openDatabase();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);

            const request = store.get('pendingFile');

            request.onsuccess = () => {
                const file = request.result;
                if (file && file instanceof File) {
                    console.log('✅ Retrieved file from IndexedDB:', file.name);
                    resolve(file);
                } else {
                    reject(new Error('No pending file found in storage'));
                }
            };

            request.onerror = () => {
                console.error('❌ Failed to retrieve file:', request.error);
                reject(new Error('Failed to retrieve file from IndexedDB'));
            };

            transaction.oncomplete = () => {
                db.close();
            };
        });
    } catch (error) {
        console.error('File retrieval error:', error);
        throw error;
    }
}

/**
 * Clear file from IndexedDB after successful upload
 */
export async function clearFileFromIndexedDB(): Promise<void> {
    try {
        const db = await openDatabase();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            const request = store.delete('pendingFile');

            request.onsuccess = () => {
                console.log('✅ Cleared pending file from IndexedDB');
                resolve();
            };

            request.onerror = () => {
                console.error('❌ Failed to clear file:', request.error);
                reject(new Error('Failed to clear file from IndexedDB'));
            };

            transaction.oncomplete = () => {
                db.close();
            };
        });
    } catch (error) {
        console.error('File cleanup error:', error);
        throw error;
    }
}

/**
 * Check if a pending file exists in storage
 */
export async function hasPendingFile(): Promise<boolean> {
    try {
        const file = await getFileFromIndexedDB();
        return !!file;
    } catch {
        return false;
    }
}
