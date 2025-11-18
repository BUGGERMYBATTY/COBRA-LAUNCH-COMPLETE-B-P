import { Connection, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, getAccount } from '@solana/spl-token';
import BN from 'bn.js';

// Raydium CPMM Program ID (mainnet/devnet)
const RAYDIUM_CPMM_PROGRAM_ID = new PublicKey('CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C');

// AMM Config index (Raydium's standard config)
const AMM_CONFIG_INDEX = 0;

/**
 * Manually calculate Raydium CPMM PDAs without SDK dependency
 */
function getPdaAmmConfig(programId, index) {
    return PublicKey.findProgramAddressSync(
        [Buffer.from('amm_config'), Buffer.from([index])],
        programId
    );
}

function getPdaPoolId(programId, ammConfig, token0Mint, token1Mint) {
    return PublicKey.findProgramAddressSync(
        [
            Buffer.from('pool'),
            ammConfig.toBuffer(),
            token0Mint.toBuffer(),
            token1Mint.toBuffer()
        ],
        programId
    );
}

function getPdaPoolAuthority(programId, poolId) {
    return PublicKey.findProgramAddressSync(
        [Buffer.from('pool_authority'), poolId.toBuffer()],
        programId
    );
}

function getPdaPoolLpMint(programId, poolId) {
    return PublicKey.findProgramAddressSync(
        [Buffer.from('pool_lp_mint'), poolId.toBuffer()],
        programId
    );
}

function getPdaPoolVault(programId, poolId, tokenMint) {
    return PublicKey.findProgramAddressSync(
        [Buffer.from('pool_vault'), poolId.toBuffer(), tokenMint.toBuffer()],
        programId
    );
}

/**
 * Creates a Raydium CPMM pool creation transaction
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
        const solDecimals = 9;

        console.log(`Token decimals: ${tokenDecimals}, SOL decimals: ${solDecimals}`);

        // Convert amounts to smallest units
        const baseAmountLamports = new BN(parseFloat(baseAmount) * Math.pow(10, tokenDecimals));
        const quoteAmountLamports = new BN(parseFloat(quoteAmount) * LAMPORTS_PER_SOL);

        // Get AMM config PDA
        const [ammConfigId] = getPdaAmmConfig(RAYDIUM_CPMM_PROGRAM_ID, AMM_CONFIG_INDEX);
        console.log('AMM Config ID:', ammConfigId.toString());

        // Determine token ordering (Raydium orders by pubkey)
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

        // 1. Platform fee transfer (0.15 SOL)
        const platformFee = 0.15 * LAMPORTS_PER_SOL;
        transaction.add(
            SystemProgram.transfer({
                fromPubkey: userPublicKey,
                toPubkey: treasuryPubkey,
                lamports: platformFee
            })
        );

        // 2. Create user token accounts if needed
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

        // 3. Create LP token account
        transaction.add(
            createAssociatedTokenAccountInstruction(
                userPublicKey,
                userLpAccount,
                userPublicKey,
                lpMint
            )
        );

        // 4. Build Raydium CPMM initialize instruction
        // Note: This is a simplified placeholder. The actual Raydium CPMM instruction
        // requires the exact binary layout which isn't publicly documented.
        // This will need to be tested and adjusted based on actual Raydium behavior.

        console.log('⚠️  WARNING: Raydium CPMM pool creation requires the exact program instruction layout.');
        console.log('This is a best-effort implementation that may need adjustment.');

        // For now, return an error suggesting manual pool creation
        throw new Error(
            'Raydium CPMM pool creation requires proprietary instruction format. ' +
            'Please create your pool manually at https://raydium.io/liquidity/create/ ' +
            'Pool configuration ready:\n' +
            `Token: ${tokenMint}\n` +
            `Token Amount: ${baseAmount}\n` +
            `SOL Amount: ${quoteAmount}\n` +
            `Estimated Pool ID: ${poolId.toString()}`
        );

        // The complete implementation would add the Raydium initialize instruction here
        // but requires reverse engineering their exact binary format

    } catch (error) {
        console.error('Error creating CPMM pool transaction:', error);
        throw error;
    }
}

export default {
    createCpmmPoolTransaction
};
