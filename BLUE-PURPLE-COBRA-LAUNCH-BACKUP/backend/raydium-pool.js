import { Connection, PublicKey, Keypair, SystemProgram, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, getAccount } from '@solana/spl-token';
import { CpmmPoolInfoLayout, getPdaPoolId, getPdaPoolAuthority, getPdaPoolLpMint, getPdaPoolVault, getPdaAmmConfigId } from '@raydium-io/raydium-sdk';
import BN from 'bn.js';

// Raydium CPMM Program ID (mainnet/devnet)
const RAYDIUM_CPMM_PROGRAM_ID = new PublicKey('CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C');

// AMM Config (this is Raydium's standard config for CPMM pools)
const AMM_CONFIG_INDEX = 0; // Standard config index

/**
 * Creates a Raydium CPMM pool creation transaction
 * @param {Object} params - Pool creation parameters
 * @param {string} params.tokenMint - Token mint address
 * @param {string} params.baseAmount - Amount of tokens to add
 * @param {string} params.quoteAmount - Amount of SOL to add
 * @param {string} params.walletPublicKey - User's wallet address
 * @param {string} params.treasuryAddress - Platform fee recipient
 * @param {Connection} connection - Solana connection
 * @returns {Promise<{transaction: Transaction, poolId: PublicKey}>}
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

        // Native SOL mint (wrapped SOL)
        const quoteMint = new PublicKey('So11111111111111111111111111111111111111112');

        console.log('Creating CPMM pool with params:', {
            tokenMint,
            baseAmount,
            quoteAmount,
            wallet: walletPublicKey
        });

        // Get token decimals
        const tokenMintInfo = await connection.getParsedAccountInfo(tokenMintPubkey);
        if (!tokenMintInfo.value || !('parsed' in tokenMintInfo.value.data)) {
            throw new Error('Failed to fetch token mint info');
        }
        const tokenDecimals = tokenMintInfo.value.data.parsed.info.decimals;
        const solDecimals = 9; // SOL always has 9 decimals

        console.log(`Token decimals: ${tokenDecimals}, SOL decimals: ${solDecimals}`);

        // Convert amounts to lamports/smallest units
        const baseAmountLamports = new BN(parseFloat(baseAmount) * Math.pow(10, tokenDecimals));
        const quoteAmountLamports = new BN(parseFloat(quoteAmount) * LAMPORTS_PER_SOL);

        // Get AMM config PDA
        const [ammConfigId] = getPdaAmmConfigId(RAYDIUM_CPMM_PROGRAM_ID, new BN(AMM_CONFIG_INDEX));
        console.log('AMM Config ID:', ammConfigId.toString());

        // Determine which is token0 and token1 (Raydium orders by pubkey)
        const [token0Mint, token1Mint] = tokenMintPubkey.toBuffer() < quoteMint.toBuffer()
            ? [tokenMintPubkey, quoteMint]
            : [quoteMint, tokenMintPubkey];

        const [token0Amount, token1Amount] = tokenMintPubkey.toBuffer() < quoteMint.toBuffer()
            ? [baseAmountLamports, quoteAmountLamports]
            : [quoteAmountLamports, baseAmountLamports];

        console.log('Token ordering:', {
            token0: token0Mint.toString(),
            token1: token1Mint.toString(),
            token0Amount: token0Amount.toString(),
            token1Amount: token1Amount.toString()
        });

        // Generate pool PDAs
        const [poolId] = getPdaPoolId(RAYDIUM_CPMM_PROGRAM_ID, ammConfigId, token0Mint, token1Mint);
        const [poolAuthority] = getPdaPoolAuthority(RAYDIUM_CPMM_PROGRAM_ID, poolId);
        const [lpMint] = getPdaPoolLpMint(RAYDIUM_CPMM_PROGRAM_ID, poolId);
        const [token0Vault] = getPdaPoolVault(RAYDIUM_CPMM_PROGRAM_ID, poolId, token0Mint);
        const [token1Vault] = getPdaPoolVault(RAYDIUM_CPMM_PROGRAM_ID, poolId, token1Mint);

        console.log('Pool PDAs:', {
            poolId: poolId.toString(),
            poolAuthority: poolAuthority.toString(),
            lpMint: lpMint.toString(),
            token0Vault: token0Vault.toString(),
            token1Vault: token1Vault.toString()
        });

        // Get user's token accounts
        const userToken0Account = await getAssociatedTokenAddress(token0Mint, userPublicKey);
        const userToken1Account = await getAssociatedTokenAddress(token1Mint, userPublicKey);
        const userLpAccount = await getAssociatedTokenAddress(lpMint, userPublicKey);

        console.log('User token accounts:', {
            userToken0: userToken0Account.toString(),
            userToken1: userToken1Account.toString(),
            userLp: userLpAccount.toString()
        });

        // Build transaction
        const transaction = new Transaction();

        // 1. Add platform fee transfer (0.15 SOL to treasury)
        const platformFee = 0.15 * LAMPORTS_PER_SOL;
        transaction.add(
            SystemProgram.transfer({
                fromPubkey: userPublicKey,
                toPubkey: treasuryPubkey,
                lamports: platformFee
            })
        );

        // 2. Create associated token accounts if they don't exist
        try {
            await getAccount(connection, userToken0Account);
        } catch {
            transaction.add(
                createAssociatedTokenAccountInstruction(
                    userPublicKey,
                    userToken0Account,
                    userPublicKey,
                    token0Mint
                )
            );
        }

        try {
            await getAccount(connection, userToken1Account);
        } catch {
            transaction.add(
                createAssociatedTokenAccountInstruction(
                    userPublicKey,
                    userToken1Account,
                    userPublicKey,
                    token1Mint
                )
            );
        }

        // 3. Create user's LP token account (will receive LP tokens)
        transaction.add(
            createAssociatedTokenAccountInstruction(
                userPublicKey,
                userLpAccount,
                userPublicKey,
                lpMint
            )
        );

        // 4. Build Raydium CPMM pool initialization instruction
        // This is the core instruction that creates the pool
        const createPoolInstruction = await buildCpmmInitializeInstruction({
            programId: RAYDIUM_CPMM_PROGRAM_ID,
            creator: userPublicKey,
            ammConfig: ammConfigId,
            poolId,
            poolAuthority,
            token0Mint,
            token1Mint,
            lpMint,
            token0Vault,
            token1Vault,
            userToken0Account,
            userToken1Account,
            userLpAccount,
            token0Amount,
            token1Amount,
            openTime: new BN(0) // 0 = open immediately
        });

        transaction.add(createPoolInstruction);

        console.log('Transaction built with', transaction.instructions.length, 'instructions');

        return {
            transaction,
            poolId,
            lpMint,
            token0Vault,
            token1Vault
        };

    } catch (error) {
        console.error('Error creating CPMM pool transaction:', error);
        throw error;
    }
}

/**
 * Builds the Raydium CPMM pool initialization instruction
 * This is based on Raydium's CPMM program instruction layout
 */
async function buildCpmmInitializeInstruction({
    programId,
    creator,
    ammConfig,
    poolId,
    poolAuthority,
    token0Mint,
    token1Mint,
    lpMint,
    token0Vault,
    token1Vault,
    userToken0Account,
    userToken1Account,
    userLpAccount,
    token0Amount,
    token1Amount,
    openTime
}) {
    // Instruction discriminator for initialize pool (this is Raydium CPMM specific)
    const INITIALIZE_DISCRIMINATOR = Buffer.from([175, 175, 109, 31, 13, 152, 155, 237]);

    // Build instruction data
    const data = Buffer.alloc(24); // 8 bytes discriminator + 8 bytes each for amounts + openTime
    INITIALIZE_DISCRIMINATOR.copy(data, 0);

    // Note: This is a simplified version. The actual instruction data layout
    // depends on Raydium's specific program implementation
    // You may need to adjust based on Raydium's latest SDK

    const keys = [
        { pubkey: creator, isSigner: true, isWritable: true },
        { pubkey: ammConfig, isSigner: false, isWritable: false },
        { pubkey: poolId, isSigner: false, isWritable: true },
        { pubkey: poolAuthority, isSigner: false, isWritable: false },
        { pubkey: token0Mint, isSigner: false, isWritable: false },
        { pubkey: token1Mint, isSigner: false, isWritable: false },
        { pubkey: lpMint, isSigner: false, isWritable: true },
        { pubkey: token0Vault, isSigner: false, isWritable: true },
        { pubkey: token1Vault, isSigner: false, isWritable: true },
        { pubkey: userToken0Account, isSigner: false, isWritable: true },
        { pubkey: userToken1Account, isSigner: false, isWritable: true },
        { pubkey: userLpAccount, isSigner: false, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ];

    return {
        keys,
        programId,
        data
    };
}

export default {
    createCpmmPoolTransaction
};
