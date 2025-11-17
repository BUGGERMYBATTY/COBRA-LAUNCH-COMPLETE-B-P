// Image upload endpoint for Vercel serverless function
import FormData from 'form-data';
import axios from 'axios';

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

// Parse multipart form data manually
async function parseMultipartForm(req) {
    return new Promise((resolve, reject) => {
        const boundary = req.headers['content-type']?.split('boundary=')[1];
        if (!boundary) {
            reject(new Error('No boundary found in content-type'));
            return;
        }

        const chunks = [];
        req.on('data', chunk => chunks.push(chunk));
        req.on('end', () => {
            try {
                const buffer = Buffer.concat(chunks);
                const parts = buffer.toString('binary').split(`--${boundary}`);

                const fields = {};
                let fileBuffer = null;
                let fileName = '';
                let mimeType = '';

                for (const part of parts) {
                    if (part.includes('Content-Disposition')) {
                        const nameMatch = part.match(/name="([^"]+)"/);
                        if (!nameMatch) continue;

                        const fieldName = nameMatch[1];

                        if (part.includes('filename=')) {
                            // This is a file
                            const fileNameMatch = part.match(/filename="([^"]+)"/);
                            const contentTypeMatch = part.match(/Content-Type: ([^\r\n]+)/);

                            fileName = fileNameMatch ? fileNameMatch[1] : 'file';
                            mimeType = contentTypeMatch ? contentTypeMatch[1].trim() : 'application/octet-stream';

                            // Extract file data (after double CRLF)
                            const dataStart = part.indexOf('\r\n\r\n') + 4;
                            const dataEnd = part.lastIndexOf('\r\n');
                            const binaryData = part.substring(dataStart, dataEnd);
                            fileBuffer = Buffer.from(binaryData, 'binary');
                        } else {
                            // This is a text field
                            const valueStart = part.indexOf('\r\n\r\n') + 4;
                            const valueEnd = part.lastIndexOf('\r\n');
                            fields[fieldName] = part.substring(valueStart, valueEnd);
                        }
                    }
                }

                resolve({ fields, file: fileBuffer ? { buffer: fileBuffer, originalFilename: fileName, mimetype: mimeType } : null });
            } catch (error) {
                reject(error);
            }
        });
        req.on('error', reject);
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
