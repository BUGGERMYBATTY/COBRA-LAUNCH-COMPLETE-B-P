// This file now acts as a client-side interface to our secure backend endpoint.
// It abstracts away the API call, making it easy to use in our components,
// but it does NOT contain any sensitive keys.

import type { TokenData } from '../types';
// In a real project, the frontend would fetch an API endpoint like '/api/uploadToPinata'.
// To simulate this separation of concerns, we import the "backend" handler directly.
import { uploadToPinata } from '../api/uploadToPinata';

/**
 * Uploads an image file by calling our secure backend endpoint.
 * @param file The image file to upload.
 * @param tokenName The name of the token.
 * @param tokenSymbol The symbol of the token.
 * @returns A promise that resolves to the full IPFS URL of the uploaded image.
 */
export async function uploadImageToPinata(file: File, tokenName: string, tokenSymbol: string): Promise<string> {
    try {
        // Call the backend handler to perform the secure upload.
        return await uploadToPinata('image', file, tokenName, tokenSymbol);
    } catch (error) {
        console.error("Error during image upload:", error);
        // Re-throw the error so it can be caught by the component and displayed to the user.
        throw error;
    }
}


/**
 * Uploads the token metadata by calling our secure backend endpoint.
 * @param metadata The token metadata object.
 * @returns A promise that resolves to the full IPFS URL of the metadata JSON file.
 */
export async function uploadMetadataToPinata(metadata: TokenData): Promise<string> {
    try {
        // Call the backend handler to perform the secure upload.
        return await uploadToPinata('metadata', metadata);
    } catch (error) {
        console.error("Error during metadata upload:", error);
        // Re-throw the error so it can be caught by the component and displayed to the user.
        throw error;
    }
}
