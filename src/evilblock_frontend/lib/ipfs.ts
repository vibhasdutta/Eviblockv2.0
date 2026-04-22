import { create } from '@web3-storage/w3up-client';
import { perf, PerfCategory } from './perf';

/**
 * Upload file to IPFS using Web3.Storage
 * Returns the CID (Content Identifier)
 */
export async function uploadToIPFS(file: File): Promise<string> {
  return perf.track('Upload to Web3.Storage', PerfCategory.IPFS, async () => {
    const client = await create();
    const cid = await client.uploadFile(file);
    return cid.toString();
  }, { fileName: file.name, fileSize: file.size });
}

/**
 * Alternative: Upload to Pinata (simpler for quick setup)
 * You need PINATA_API_KEY and PINATA_SECRET_KEY
 */
export async function uploadToPinata(file: File): Promise<{ success: boolean; hash: string; error?: string }> {
  const end = perf.start('Upload to Pinata (IPFS)', PerfCategory.IPFS, { fileName: file.name, fileSize: file.size });

  const formData = new FormData();
  formData.append('file', file);

  const pinataMetadata = JSON.stringify({
    name: file.name,
  });
  formData.append('pinataMetadata', pinataMetadata);

  const pinataOptions = JSON.stringify({
    cidVersion: 1,
  });
  formData.append('pinataOptions', pinataOptions);

  try {
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      end('error');
      return {
        success: false,
        hash: '',
        error: errorData.message || 'Pinata upload failed',
      };
    }

    const data = await response.json();
    end('success');
    return {
      success: true,
      hash: data.IpfsHash,
    };
  } catch (error) {
    console.error('Pinata upload error:', error);
    end('error');
    return {
      success: false,
      hash: '',
      error: error instanceof Error ? error.message : 'Failed to upload file to Pinata',
    };
  }
}

/**
 * Generate CID from file locally (for verification)
 * Uses simple hash generation compatible with all browsers
 */
export async function generateCIDFromFile(file: File): Promise<string> {
  return perf.track('Generate CID from File', PerfCategory.ENCRYPTION, async () => {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    
    let hash = 5381;
    for (let i = 0; i < bytes.length; i++) {
      hash = ((hash << 5) + hash) + bytes[i];
      hash = hash & hash;
    }
    
    const hashStr = (hash >>> 0).toString(16).padStart(8, '0');
    const pseudoCID = `${hashStr}-${file.size}-${file.name.replace(/[^a-zA-Z0-9]/g, '')}`;
    
    return pseudoCID;
  }, { fileName: file.name, fileSize: file.size });
}

/**
 * Verify file integrity by comparing local CID with stored CID
 */
export async function verifyFileIntegrity(file: File, storedCID: string): Promise<boolean> {
  return perf.track('Verify File Integrity', PerfCategory.ENCRYPTION, async () => {
    const generatedCID = await generateCIDFromFile(file);
    return generatedCID === storedCID;
  });
}

/**
 * Get IPFS gateway URL for viewing/downloading file
 * Uses multiple gateways for better reliability
 */
export function getIPFSUrl(cid: string, gateway?: string): string {
  // If specific gateway provided, use it
  if (gateway) {
    return `${gateway}/ipfs/${cid}`;
  }
  
  // Default to Pinata gateway (faster and more reliable)
  return `https://turquoise-electronic-camel-324.mypinata.cloud/ipfs/${cid}`;
}

/**
 * Get multiple IPFS gateway URLs for fallback options
 */
export function getIPFSGateways(cid: string): string[] {
  return [
    `https://turquoise-electronic-camel-324.mypinata.cloud/ipfs/${cid}`,
    `https://ipfs.io/ipfs/${cid}`,
    `https://cloudflare-ipfs.com/ipfs/${cid}`,
    `https://dweb.link/ipfs/${cid}`,
  ];
}
