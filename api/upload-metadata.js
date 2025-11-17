// Metadata upload endpoint for Vercel serverless function
import FormData from 'form-data';
import axios from 'axios';

// Helper function to sanitize filenames
function sanitizeForFilename(input) {
    return input.replace(/[^a-zA-Z0-9.-]/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '');
}

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const PINATA_JWT = process.env.PINATA_JWT;
    const DEDICATED_GATEWAY = process.env.PINATA_GATEWAY || "https://yellow-peculiar-cephalopod-560.mypinata.cloud";

    if (!PINATA_JWT) {
        console.error('PINATA_JWT is not configured');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    try {
        const { name, symbol, description, image } = req.body;

        if (!name || !symbol || !description || !image) {
            return res.status(400).json({ error: 'name, symbol, description, and image are required' });
        }

        const metadataJson = {
            name,
            symbol,
            description,
            image,
        };

        const uniqueFileName = `${sanitizeForFilename(symbol)}-metadata.json`;

        console.log(`Uploading metadata: ${uniqueFileName}`);

        // Create FormData for Pinata API
        const formData = new FormData();

        // Convert JSON to buffer and add to form data
        const jsonBuffer = Buffer.from(JSON.stringify(metadataJson));
        formData.append('file', jsonBuffer, {
            filename: uniqueFileName,
            contentType: 'application/json'
        });

        // Add pinataMetadata
        const pinataMetadata = JSON.stringify({
            name: uniqueFileName
        });
        formData.append('pinataMetadata', pinataMetadata);

        // Add pinataOptions
        const pinataOptions = JSON.stringify({
            cidVersion: 0
        });
        formData.append('pinataOptions', pinataOptions);

        // Upload to Pinata
        const response = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
            headers: {
                'Authorization': `Bearer ${PINATA_JWT}`,
                ...formData.getHeaders()
            },
            maxBodyLength: Infinity,
            maxContentLength: Infinity
        });

        const ipfsUrl = `${DEDICATED_GATEWAY}/ipfs/${response.data.IpfsHash}`;

        console.log(`Metadata uploaded successfully: ${ipfsUrl}`);
        res.status(200).json({ success: true, url: ipfsUrl });
    } catch (error) {
        console.error('Metadata upload error:', error);
        if (error.response) {
            console.error('Pinata API Response Error:', error.response.status, error.response.data);
            res.status(error.response.status).json({ error: error.response.data?.error || 'Pinata API error' });
        } else {
            res.status(500).json({ error: error.message || 'Failed to upload metadata' });
        }
    }
}
