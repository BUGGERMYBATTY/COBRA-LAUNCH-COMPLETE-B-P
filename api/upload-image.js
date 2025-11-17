// Image upload endpoint for Vercel serverless function
import FormData from 'form-data';
import axios from 'axios';
import Busboy from 'busboy';

// Disable body parsing so we can manually parse multipart data
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

// Parse multipart form data using busboy
function parseMultipartForm(req) {
    return new Promise((resolve, reject) => {
        const busboy = Busboy({ headers: req.headers });
        const fields = {};
        let fileData = null;

        busboy.on('file', (fieldname, file, info) => {
            const { filename, mimeType } = info;
            const chunks = [];

            console.log(`Receiving file: ${filename}, mime: ${mimeType}`);

            file.on('data', (chunk) => {
                chunks.push(chunk);
            });

            file.on('end', () => {
                const buffer = Buffer.concat(chunks);
                console.log(`File received: ${buffer.length} bytes`);
                fileData = {
                    buffer,
                    originalFilename: filename,
                    mimetype: mimeType
                };
            });
        });

        busboy.on('field', (fieldname, value) => {
            console.log(`Field received: ${fieldname} = ${value}`);
            fields[fieldname] = value;
        });

        busboy.on('finish', () => {
            console.log('Busboy finished parsing');
            resolve({ fields, file: fileData });
        });

        busboy.on('error', (error) => {
            console.error('Busboy error:', error);
            reject(error);
        });

        req.pipe(busboy);
    });
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
        console.log('Starting multipart parse...');
        const { fields, file } = await parseMultipartForm(req);

        console.log('Parsed form data:', {
            hasFile: !!file,
            fields: Object.keys(fields),
            fileSize: file?.buffer?.length
        });

        if (!file) {
            console.error('No file in parsed data');
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const tokenName = fields.tokenName;
        const tokenSymbol = fields.tokenSymbol;

        if (!tokenName || !tokenSymbol) {
            console.error('Missing required fields:', { tokenName, tokenSymbol, allFields: fields });
            return res.status(400).json({ error: 'tokenName and tokenSymbol are required' });
        }

        const uniqueFileName = generateFileName(file.originalFilename, tokenName, tokenSymbol);

        console.log(`Uploading image: ${uniqueFileName} (${file.buffer.length} bytes, ${file.mimetype})`);

        // Create FormData for Pinata API
        const formData = new FormData();
        formData.append('file', file.buffer, {
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
}
