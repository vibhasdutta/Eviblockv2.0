import { create } from '@web3-storage/w3up-client';

/**
 * Upload file to IPFS using Web3.Storage
 * Returns the CID (Content Identifier)
 */
export async function uploadToIPFS(file: File): Promise<string> {
  try {
    // Create Web3.Storage client
    const client = await create();
    
    // Authorize the client (you'll need to set up authentication)
    // For now, using direct upload without account
    // Note: You'll need to set up proper authentication in production
    
    const cid = await client.uploadFile(file);
    return cid.toString();
  } catch (error) {
    console.error('IPFS upload error:', error);
    throw new Error('Failed to upload file to IPFS');
  }
}

/**
 * Alternative: Upload to Pinata (simpler for quick setup)
 * You need PINATA_API_KEY and PINATA_SECRET_KEY
 */
export async function uploadToPinata(file: File): Promise<{ success: boolean; hash: string; error?: string }> {
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
      return {
        success: false,
        hash: '',
        error: errorData.message || 'Pinata upload failed',
      };
    }

    const data = await response.json();
    return {
      success: true,
      hash: data.IpfsHash, // Returns CID
    };
  } catch (error) {
    console.error('Pinata upload error:', error);
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
  try {
    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    
    // Simple hash function (djb2)
    let hash = 5381;
    for (let i = 0; i < bytes.length; i++) {
      hash = ((hash << 5) + hash) + bytes[i];
      hash = hash & hash; // Convert to 32bit integer
    }
    
    // Convert to positive number and hex
    const hashStr = (hash >>> 0).toString(16).padStart(8, '0');
    
    // Create a pseudo-CID with file info
    const pseudoCID = `${hashStr}-${file.size}-${file.name.replace(/[^a-zA-Z0-9]/g, '')}`;
    
    return pseudoCID;
  } catch (error) {
    console.error('CID generation error:', error);
    throw new Error('Failed to generate CID');
  }
}

/**
 * Verify file integrity by comparing local CID with stored CID
 */
export async function verifyFileIntegrity(file: File, storedCID: string): Promise<boolean> {
  try {
    const generatedCID = await generateCIDFromFile(file);
    return generatedCID === storedCID;
  } catch (error) {
    console.error('File verification error:', error);
    return false;
  }
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
