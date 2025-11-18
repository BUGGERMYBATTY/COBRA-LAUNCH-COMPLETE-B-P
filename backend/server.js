import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import FormData from 'form-data';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from parent directory's .env file
dotenv.config({ path: join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// Configure multer for file uploads (in-memory storage)
const upload = multer({ storage: multer.memoryStorage() });

// Middleware - CORS Configuration
const corsOptions = {
    origin: [
        'https://randygarsh.com',
        'https://www.randygarsh.com',
        'http://localhost:5173',
        'http://localhost:3000',
        'http://localhost:3001'
    ],
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());

// Serve static frontend files (for production VPS deployment)
const frontendPath = join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

// Security: Ensure JWT is configured
const PINATA_JWT = process.env.VITE_PINATA_JWT;
const DEDICATED_GATEWAY = process.env.VITE_PINATA_GATEWAY || "https://yellow-peculiar-cephalopod-560.mypinata.cloud";

if (!PINATA_JWT) {
    console.error('FATAL ERROR: VITE_PINATA_JWT is not configured in environment variables');
    process.exit(1);
}

// Helper functions
function sanitizeForFilename(input) {
    return input.replace(/[^a-zA-Z0-9.-]/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '');
}

function generateFileName(originalFileName, tokenName, tokenSymbol) {
    const extension = originalFileName.split('.').pop() || 'png';

    // Generate 6-digit random number (100000-999999)
    const randomNumber = Math.floor(100000 + Math.random() * 900000);

    // Calculate available space: 50 (max) - extension.length - 1 (dot) - 6 (random) - 2 (hyphens)
    const fixedLength = extension.length + 1 + 6 + 2; // e.g., 4 + 1 + 6 + 2 = 13
    const availableLength = 50 - fixedLength; // e.g., 50 - 13 = 37

    // Sanitize inputs
    let sanitizedName = sanitizeForFilename(tokenName);
    let sanitizedSymbol = sanitizeForFilename(tokenSymbol);

    // Allocate space: 60% for name, 40% for symbol
    const maxNameLength = Math.floor(availableLength * 0.6);
    const maxSymbolLength = availableLength - maxNameLength;

    // Truncate if necessary
    if (sanitizedName.length > maxNameLength) {
        sanitizedName = sanitizedName.substring(0, maxNameLength);
    }
    if (sanitizedSymbol.length > maxSymbolLength) {
        sanitizedSymbol = sanitizedSymbol.substring(0, maxSymbolLength);
    }

    // Build filename
    const filename = `${sanitizedName}-${sanitizedSymbol}-${randomNumber}.${extension}`;

    // Final safety check - ensure it's under 50 chars
    if (filename.length > 50) {
        console.warn(`Filename too long (${filename.length} chars), truncating: ${filename}`);
        // Emergency truncation - just use symbol and random
        return `${sanitizedSymbol.substring(0, 10)}-${randomNumber}.${extension}`;
    }

    return filename;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Cobra Launch Backend API is running' });
});

// Image upload endpoint
app.post('/api/upload-image', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { tokenName, tokenSymbol } = req.body;

        if (!tokenName || !tokenSymbol) {
            return res.status(400).json({ error: 'tokenName and tokenSymbol are required' });
        }

        const uniqueFileName = generateFileName(req.file.originalname, tokenName, tokenSymbol);

        console.log(`Uploading image: ${uniqueFileName} (${req.file.size} bytes, ${req.file.mimetype})`);

        // Create FormData for Pinata API
        const formData = new FormData();

        // Add file buffer - Pinata requires the buffer directly with options object
        formData.append('file', req.file.buffer, {
            filename: uniqueFileName,
            contentType: req.file.mimetype
        });

        // Add pinataMetadata - must be stringified JSON
        const pinataMetadata = JSON.stringify({
            name: uniqueFileName
        });
        formData.append('pinataMetadata', pinataMetadata);

        // Add pinataOptions - must be stringified JSON
        const pinataOptions = JSON.stringify({
            cidVersion: 0
        });
        formData.append('pinataOptions', pinataOptions);

        console.log('Sending request to Pinata with file:', uniqueFileName);

        // Upload to Pinata using axios
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
        res.json({ success: true, url: ipfsUrl });
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

// Metadata upload endpoint
app.post('/api/upload-metadata', async (req, res) => {
    try {
        const { name, symbol, description, image, website, twitter, telegram } = req.body;

        if (!name || !symbol || !description || !image) {
            return res.status(400).json({ error: 'name, symbol, description, and image are required' });
        }

        const metadataJson = {
            name,
            symbol,
            description,
            image,
            // Include optional social/web links if provided
            ...(website && { website }),
            ...(twitter && { twitter }),
            ...(telegram && { telegram }),
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

        // Add pinataMetadata - must be stringified JSON
        const pinataMetadata = JSON.stringify({
            name: uniqueFileName
        });
        formData.append('pinataMetadata', pinataMetadata);

        // Add pinataOptions - must be stringified JSON
        const pinataOptions = JSON.stringify({
            cidVersion: 0
        });
        formData.append('pinataOptions', pinataOptions);

        console.log('Sending metadata request to Pinata');

        // Upload to Pinata using axios
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
        res.json({ success: true, url: ipfsUrl });
    } catch (error) {
        console.error('Metadata upload error:', error);
        if (error.response) {
            console.error('Pinata API Response Error:', error.response.status, error.response.data);
            res.status(error.response.status).json({ error: error.response.data?.error || 'Pinata API error' });
        } else {
            res.status(500).json({ error: error.message || 'Failed to upload metadata' });
        }
    }
});

// Liquidity pool creation endpoint
app.post('/api/create-liquidity', async (req, res) => {
    try {
        const { tokenMint, tokenSymbol, baseAmount, quoteAmount, walletPublicKey } = req.body;

        // Validate inputs
        if (!tokenMint || !baseAmount || !quoteAmount || !walletPublicKey) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: tokenMint, baseAmount, quoteAmount, walletPublicKey'
            });
        }

        // Validate amounts
        const baseAmountNum = parseFloat(baseAmount);
        const quoteAmountNum = parseFloat(quoteAmount);

        if (isNaN(baseAmountNum) || baseAmountNum <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Invalid baseAmount: must be a positive number'
            });
        }

        if (isNaN(quoteAmountNum) || quoteAmountNum < 0.01) {
            return res.status(400).json({
                success: false,
                error: 'Invalid quoteAmount: minimum 0.01 SOL required'
            });
        }

        console.log(`Creating liquidity pool for token: ${tokenMint}`);
        console.log(`Amounts - Base: ${baseAmount} ${tokenSymbol || 'tokens'}, Quote: ${quoteAmount} SOL`);
        console.log(`Wallet: ${walletPublicKey}`);

        // IMPORTANT: This is a placeholder implementation
        // The actual Raydium CPMM SDK integration will be added after installing dependencies
        // For now, we return an error directing users to manual pool creation

        return res.status(501).json({
            success: false,
            error: 'Liquidity pool creation is not yet fully implemented. Please create your pool manually at https://raydium.io/liquidity/create/',
            message: 'Backend integration with Raydium SDK pending. Use manual pool creation for now.',
            details: {
                tokenMint,
                baseAmount,
                quoteAmount,
                estimatedFees: {
                    platformFee: '0.15 SOL',
                    raydiumFee: '0.17 SOL',
                    totalFees: '0.32 SOL'
                }
            }
        });

        // TODO: Implement Raydium CPMM SDK integration
        // 1. Import Raydium SDK
        // 2. Initialize CPMM client
        // 3. Create pool transaction
        // 4. Add platform fee transfer (0.15 SOL to treasury)
        // 5. Serialize transaction
        // 6. Return serialized transaction + pool address

        /*
        // Example structure for when SDK is integrated:
        const transaction = await createCPMMPool({
            tokenMint,
            baseAmount,
            quoteAmount,
            walletPublicKey
        });

        // Add platform fee
        transaction.add(
            SystemProgram.transfer({
                fromPubkey: new PublicKey(walletPublicKey),
                toPubkey: new PublicKey(process.env.VITE_TREASURY_ADDRESS),
                lamports: 0.15 * LAMPORTS_PER_SOL
            })
        );

        const serializedTransaction = transaction.serialize().toString('base64');

        res.json({
            success: true,
            transaction: serializedTransaction,
            poolAddress: 'POOL_ADDRESS_HERE',
            message: 'Pool transaction ready for signing'
        });
        */

    } catch (error) {
        console.error('Liquidity pool creation error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to create liquidity pool transaction'
        });
    }
});

// Catch-all route to serve index.html for client-side routing
app.get('*', (req, res) => {
    res.sendFile(join(frontendPath, 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Cobra Launch Backend API running on port ${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔒 Pinata JWT: ${PINATA_JWT ? 'Configured ✓' : 'Missing ✗'}`);
    console.log(`📁 Serving frontend from: ${frontendPath}`);
});
