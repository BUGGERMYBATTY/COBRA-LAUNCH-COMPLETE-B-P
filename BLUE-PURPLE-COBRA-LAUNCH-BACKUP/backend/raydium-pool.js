import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { Raydium } from '@raydium-io/raydium-sdk-v2';
import BN from 'bn.js';
import Decimal from 'decimal.js';

/**
 * Creates a Raydium CPMM pool using SDK v2
 * Based on: https://github.com/raydium-io/raydium-sdk-V2-demo
 */
export async function createCpmmPoolTransaction({
    tokenMint,
    baseAmount,
    quoteAmount,
    walletPublicKey,
    treasuryAddress,
    connection
}) {
    try {
        const userPublicKey = new PublicKey(walletPublicKey);
        const tokenMintPubkey = new PublicKey(tokenMint);
        const treasuryPubkey = new PublicKey(treasuryAddress);

        // Wrapped SOL mint
        const WSOL_MINT = 'So11111111111111111111111111111111111111112';

        console.log('Initializing Raydium SDK v2...');
        console.log('Creating CPMM pool:', {
            tokenMint,
            baseAmount,
            quoteAmount,
            wallet: walletPublicKey
        });

        // Initialize Raydium SDK v2
        // Note: We pass the user's public key but won't sign transactions here
        // The frontend will sign the returned transaction
        const raydium = await Raydium.load({
            connection,
            owner: userPublicKey,
            disableFeatureCheck: true,
            disableLoadToken: false,
            blockhashCommitment: 'confirmed',
        });

        console.log('Raydium SDK v2 initialized successfully');

        // Get token decimals
        const tokenMintInfo = await connection.getParsedAccountInfo(tokenMintPubkey);
        if (!tokenMintInfo.value || !('parsed' in tokenMintInfo.value.data)) {
            throw new Error('Failed to fetch token mint info');
        }
        const tokenDecimals = tokenMintInfo.value.data.parsed.info.decimals;

        console.log(`Token decimals: ${tokenDecimals}`);

        // Convert amounts to proper format
        // SDK v2 expects Decimal.js or BN for amounts
        const baseAmountDecimal = new Decimal(baseAmount).mul(new Decimal(10).pow(tokenDecimals));
        const quoteAmountDecimal = new Decimal(quoteAmount).mul(new Decimal(10).pow(9)); // SOL = 9 decimals

        console.log('Pool amounts:', {
            baseAmount: baseAmountDecimal.toString(),
            quoteAmount: quoteAmountDecimal.toString()
        });

        // Create CPMM pool using SDK v2
        // Configuration based on Raydium demo: src/cpmm/createPool.ts
        const { execute, extInfo, transactions } = await raydium.cpmm.createPool({
            programId: 'CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C', // CPMM Program ID
            poolFeeAccount: 'DNXgeM9EiiaAbaWvwjHj9fQQLAX5ZsfHyvmYUNRAdNC8', // Raydium fee account
            mintA: {
                mint: tokenMintPubkey.toString(),
                amount: new BN(baseAmountDecimal.toFixed(0))
            },
            mintB: {
                mint: WSOL_MINT,
                amount: new BN(quoteAmountDecimal.toFixed(0))
            },
            mintAUseSOLBalance: false, // Don't use SOL balance for token A
            mintBUseSOLBalance: true,  // Use SOL balance for token B (wrapped SOL)
            startTime: new BN(Math.floor(Date.now() / 1000)), // Start immediately

            // Pool configuration
            config: {
                id: 'AxYHTbRLPZ21VD1JjfkZWfC9bjv6AcWSFKvhDDbg9uc9', // Default CPMM config
                index: 0,
                protocolFeeRate: 1000, // 0.1% protocol fee
                tradeFeeRate: 2500,    // 0.25% trade fee
                fundFeeRate: 40000,    // 4% fund fee
                createPoolFee: '0.15'  // 0.15 SOL creation fee
            },

            // Transaction configuration
            txVersion: 'V0', // Use versioned transaction
            computeBudgetConfig: {
                units: 600000,
                microLamports: 100000
            }
        });

        console.log('Pool creation transaction built successfully');
        console.log('Pool info:', {
            poolId: extInfo.address.poolId.toString(),
            lpMint: extInfo.address.lpMint.toString(),
            configId: extInfo.address.configId.toString(),
            mintA: extInfo.address.mintA.vault.toString(),
            mintB: extInfo.address.mintB.vault.toString()
        });

        // Get the transaction from the builder
        // SDK v2 returns an array of transactions
        if (!transactions || transactions.length === 0) {
            throw new Error('No transactions returned from pool creation');
        }

        // The transaction is already built, we just need to serialize it
        const poolTransaction = transactions[0];

        // Add platform fee transfer as the first instruction
        // This ensures we get paid before the pool creation
        const platformFeeInstruction = SystemProgram.transfer({
            fromPubkey: userPublicKey,
            toPubkey: treasuryPubkey,
            lamports: 0.15 * 1e9 // 0.15 SOL
        });

        // Insert platform fee at the beginning
        poolTransaction.instructions.unshift(platformFeeInstruction);

        // Get recent blockhash
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
        poolTransaction.recentBlockhash = blockhash;
        poolTransaction.feePayer = userPublicKey;

        // Serialize the transaction
        const serializedTransaction = poolTransaction.serialize({
            requireAllSignatures: false,
            verifySignatures: false
        }).toString('base64');

        console.log('Transaction serialized successfully');

        return {
            transaction: poolTransaction,
            serializedTransaction,
            poolId: extInfo.address.poolId.toString(),
            lpMint: extInfo.address.lpMint.toString(),
            blockhash,
            lastValidBlockHeight
        };

    } catch (error) {
        console.error('Error creating CPMM pool with SDK v2:', error);

        // Provide helpful error messages
        if (error.message && error.message.includes('fetch')) {
            throw new Error('Failed to fetch pool data from Raydium API. Please check your RPC connection.');
        }

        throw error;
    }
}

/**
 * Add liquidity to an existing CPMM pool
 */
export async function depositLiquidityTransaction({
    poolId,
    baseAmount,
    quoteAmount,
    walletPublicKey,
    connection
}) {
    try {
        const userPublicKey = new PublicKey(walletPublicKey);

        console.log('Initializing Raydium SDK v2 for liquidity deposit...');

        const raydium = await Raydium.load({
            connection,
            owner: userPublicKey,
            disableFeatureCheck: true,
            disableLoadToken: false,
            blockhashCommitment: 'confirmed',
        });

        // Fetch pool info
        console.log('Fetching pool info for:', poolId);
        const poolInfo = await raydium.api.fetchPoolById({ ids: poolId });

        if (!poolInfo || poolInfo.length === 0) {
            throw new Error('Pool not found');
        }

        const pool = poolInfo[0]; // ApiV3PoolInfoStandardItem type

        // Build deposit transaction
        const { execute, extInfo, transactions } = await raydium.cpmm.deposit({
            poolInfo: pool,
            inputAmount: new BN(baseAmount),
            slippage: 0.01, // 1% slippage tolerance
            txVersion: 'V0',
            computeBudgetConfig: {
                units: 600000,
                microLamports: 100000
            }
        });

        if (!transactions || transactions.length === 0) {
            throw new Error('No transactions returned from deposit');
        }

        const depositTransaction = transactions[0];

        // Get recent blockhash
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
        depositTransaction.recentBlockhash = blockhash;
        depositTransaction.feePayer = userPublicKey;

        const serializedTransaction = depositTransaction.serialize({
            requireAllSignatures: false,
            verifySignatures: false
        }).toString('base64');

        return {
            transaction: depositTransaction,
            serializedTransaction,
            lpAmount: extInfo.liquidity.toString(),
            blockhash,
            lastValidBlockHeight
        };

    } catch (error) {
        console.error('Error depositing liquidity:', error);
        throw error;
    }
}

export default {
    createCpmmPoolTransaction,
    depositLiquidityTransaction
};
