// Secure backend API client for Pinata uploads
// This file now calls our secure backend API endpoint instead of Pinata directly
// The JWT is NEVER exposed to the frontend - it stays on the backend server

import type { TokenData } from '../types';

// Get backend API URL from environment variables
const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3001';

/**
 * Uploads an image file to IPFS via our secure backend API
 * @param file The image file to upload
 * @param tokenName The name of the token
 * @param tokenSymbol The symbol of the token
 * @returns A promise that resolves to the full IPFS URL of the uploaded image
 */
async function handleImageUpload(file: File, tokenName: string, tokenSymbol: string): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('tokenName', tokenName);
    formData.append('tokenSymbol', tokenSymbol);

    const response = await fetch(`${BACKEND_API_URL}/api/upload-image`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(`Upload failed: ${errorData.error || response.statusText}`);
    }

    const result = await response.json();
    return result.url;
}

/**
 * Uploads token metadata to IPFS via our secure backend API
 * @param metadata The token metadata object
 * @returns A promise that resolves to the full IPFS URL of the metadata JSON file
 */
async function handleMetadataUpload(metadata: TokenData): Promise<string> {
    const response = await fetch(`${BACKEND_API_URL}/api/upload-metadata`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name: metadata.name,
            symbol: metadata.symbol,
            description: metadata.description,
            image: metadata.image,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(`Upload failed: ${errorData.error || response.statusText}`);
    }

    const result = await response.json();
    return result.url;
}

/**
 * Main upload function that routes to the appropriate backend endpoint
 * This is the exported API that the frontend components use
 */
export const uploadToPinata = async (
    type: 'image' | 'metadata',
    data: File | TokenData,
    tokenName?: string,
    tokenSymbol?: string
): Promise<string> => {
    if (type === 'image') {
        if (!(data instanceof File) || !tokenName || !tokenSymbol) {
            throw new Error('Invalid data for image upload.');
        }
        return handleImageUpload(data, tokenName, tokenSymbol);
    } else if (type === 'metadata') {
        if (data instanceof File) {
            throw new Error('Invalid data for metadata upload.');
        }
        return handleMetadataUpload(data as TokenData);
    } else {
        throw new Error('Invalid upload type specified.');
    }
};
