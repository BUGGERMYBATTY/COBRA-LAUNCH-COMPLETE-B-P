// Image upload endpoint for Vercel serverless function
import formidable from 'formidable';
import FormData from 'form-data';
import axios from 'axios';
import fs from 'fs';

// Disable body parsing, we'll handle it with formidable
export const config = {
    api: {
        bodyParser: false,
    },
};

// Helper function to sanitize filenames
function sanitizeForFilename(input) {
    return input.replace(/[^a-zA-Z0-9.-]/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '');
}

// Helper function to generate unique filename
function generateFileName(originalFileName, tokenName, tokenSymbol) {
    const extension = originalFileName.split('.').pop() || 'png';
    const randomNumber = Math.floor(100000 + Math.random() * 900000);
    const fixedLength = extension.length + 1 + 6 + 2;
    const availableLength = 50 - fixedLength;

    let sanitizedName = sanitizeForFilename(tokenName);
    let sanitizedSymbol = sanitizeForFilename(tokenSymbol);

    const maxNameLength = Math.floor(availableLength * 0.6);
    const maxSymbolLength = availableLength - maxNameLength;

    if (sanitizedName.length > maxNameLength) {
        sanitizedName = sanitizedName.substring(0, maxNameLength);
    }
    if (sanitizedSymbol.length > maxSymbolLength) {
        sanitizedSymbol = sanitizedSymbol.substring(0, maxSymbolLength);
    }

    const filename = `${sanitizedName}-${sanitizedSymbol}-${randomNumber}.${extension}`;

    if (filename.length > 50) {
        return `${sanitizedSymbol.substring(0, 10)}-${randomNumber}.${extension}`;
    }

    return filename;
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

    const form = formidable({});

    form.parse(req, async (err, fields, files) => {
        if (err) {
            console.error('Form parse error:', err);
            return res.status(400).json({ error: 'Failed to parse form data' });
        }

        try {
            const file = files.file?.[0];
            if (!file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            const tokenName = fields.tokenName?.[0];
            const tokenSymbol = fields.tokenSymbol?.[0];

            if (!tokenName || !tokenSymbol) {
                return res.status(400).json({ error: 'tokenName and tokenSymbol are required' });
            }

            const uniqueFileName = generateFileName(file.originalFilename || 'image.png', tokenName, tokenSymbol);

            console.log(`Uploading image: ${uniqueFileName} (${file.size} bytes, ${file.mimetype})`);

            // Read file buffer
            const fileBuffer = fs.readFileSync(file.filepath);

            // Create FormData for Pinata API
            const formData = new FormData();
            formData.append('file', fileBuffer, {
                filename: uniqueFileName,
                contentType: file.mimetype
            });

            const pinataMetadata = JSON.stringify({
                name: uniqueFileName
            });
            formData.append('pinataMetadata', pinataMetadata);

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

            console.log(`Image uploaded successfully: ${ipfsUrl}`);
            res.status(200).json({ success: true, url: ipfsUrl });
        } catch (error) {
            console.error('Image upload error:', error);
            if (error.response) {
                console.error('Pinata API Response Error:', error.response.status, error.response.data);
                res.status(error.response.status).json({ error: error.response.data?.error || 'Pinata API error' });
            } else {
                res.status(500).json({ error: error.message || 'Failed to upload image' });
            }
        }
    });
}
