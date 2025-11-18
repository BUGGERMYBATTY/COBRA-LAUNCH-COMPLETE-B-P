import React, { useState, useCallback } from 'react';
import { Buffer } from 'buffer';
import TokenForm from '../components/TokenForm';
import TokenResult from '../components/TokenResult';
import CreateLiquidity from '../components/CreateLiquidity';
import type { TokenData, CreatedTokenInfo } from '../types';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Keypair, SystemProgram, Transaction, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, createInitializeMintInstruction, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, createMintToInstruction, createSetAuthorityInstruction, AuthorityType } from '@solana/spl-token';
import { createCreateMetadataAccountV3Instruction, PROGRAM_ID as METADATA_PROGRAM_ID } from '@metaplex-foundation/mpl-token-metadata';
import { uploadMetadataToPinata } from '../lib/pinata';

const TOKEN_DECIMALS = 9;
const TOKEN_SUPPLY = 1_000_000_000;
const CREATION_FEE_SOL = 0.1;

export const HomePage: React.FC = () => {
  const [view, setView] = useState<'form' | 'result' | 'liquidity'>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [createdTokenInfo, setCreatedTokenInfo] = useState<CreatedTokenInfo | null>(null);
  const [poolAddress, setPoolAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [tokenDataToConfirm, setTokenDataToConfirm] = useState<TokenData | null>(null);

  const wallet = useWallet();
  const { connection } = useConnection();

  const handleCreateToken = useCallback(async (data: TokenData) => {
    if (!wallet.publicKey || !wallet.sendTransaction) {
      setError("Wallet not connected. Please connect your wallet to continue.");
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      console.log('Token Creation Data:', data);

      if (!data.treasuryAddress || data.treasuryAddress.trim() === '') {
        throw new Error("Treasury address is not configured. Please check your environment settings.");
      }

      const FORBIDDEN_ADDRESS = "CobrA111111111111111111111111111111111111111";
      if (data.treasuryAddress.trim() === FORBIDDEN_ADDRESS) {
          throw new Error("CRITICAL ERROR: Attempted to send fee to a hardcoded incorrect address. Aborting transaction.");
      }

      const feeRecipient = new PublicKey(data.treasuryAddress);
      const metadataUri = await uploadMetadataToPinata(data);
      const mintKeypair = Keypair.generate();

      const mintLen = 82;
      const lamports = 1461600;

      const associatedTokenAddress = await getAssociatedTokenAddress(
        mintKeypair.publicKey,
        wallet.publicKey
      );

      const [metadataPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('metadata'),
          METADATA_PROGRAM_ID.toBuffer(),
          mintKeypair.publicKey.toBuffer(),
        ],
        METADATA_PROGRAM_ID
      );

      const transaction = new Transaction().add(
        SystemProgram.transfer({
            fromPubkey: wallet.publicKey,
            toPubkey: feeRecipient,
            lamports: CREATION_FEE_SOL * LAMPORTS_PER_SOL,
        }),
        SystemProgram.createAccount({
          fromPubkey: wallet.publicKey,
          newAccountPubkey: mintKeypair.publicKey,
          space: mintLen,
          lamports,
          programId: TOKEN_PROGRAM_ID,
        }),
        createInitializeMintInstruction(
          mintKeypair.publicKey,
          TOKEN_DECIMALS,
          wallet.publicKey,
          wallet.publicKey
        ),
        createCreateMetadataAccountV3Instruction(
          {
            metadata: metadataPda,
            mint: mintKeypair.publicKey,
            mintAuthority: wallet.publicKey,
            payer: wallet.publicKey,
            updateAuthority: wallet.publicKey,
          },
          {
            createMetadataAccountArgsV3: {
              data: {
                name: data.name,
                symbol: data.symbol,
                uri: metadataUri,
                sellerFeeBasisPoints: 0,
                creators: null,
                collection: null,
                uses: null,
              },
              isMutable: true,
              collectionDetails: null,
            },
          }
        ),
        createAssociatedTokenAccountInstruction(
          wallet.publicKey,
          associatedTokenAddress,
          wallet.publicKey,
          mintKeypair.publicKey
        ),
        createMintToInstruction(
          mintKeypair.publicKey,
          associatedTokenAddress,
          wallet.publicKey,
          TOKEN_SUPPLY * Math.pow(10, TOKEN_DECIMALS)
        ),
        createSetAuthorityInstruction(
            mintKeypair.publicKey,
            wallet.publicKey,
            AuthorityType.MintTokens,
            null
        ),
        createSetAuthorityInstruction(
            mintKeypair.publicKey,
            wallet.publicKey,
            AuthorityType.FreezeAccount,
            null
        )
      );

      console.log('Fetching blockhash via RPC...');
      const blockhashResponse = await fetch(connection.rpcEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getLatestBlockhash',
          params: [{ commitment: 'confirmed' }]
        })
      });

      const blockhashData = await blockhashResponse.json();
      if (blockhashData.error) {
        throw new Error(`RPC Error: ${blockhashData.error.message}`);
      }

      const { blockhash, lastValidBlockHeight } = blockhashData.result.value;

      transaction.recentBlockhash = blockhash;
      transaction.feePayer = wallet.publicKey;
      transaction.partialSign(mintKeypair);

      const signedTransaction = await wallet.signTransaction!(transaction);
      const rawTransaction = signedTransaction.serialize();
      const signature = await connection.sendRawTransaction(rawTransaction, {
        skipPreflight: true,
        maxRetries: 5
      });

      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      }, 'confirmed');

      setCreatedTokenInfo({
        ...data,
        address: mintKeypair.publicKey.toBase58(),
        ownerAddress: wallet.publicKey.toBase58(),
        transactionSignature: signature,
      });
      setView('result');

    } catch (err) {
      console.error(err);
      setError((err as Error).message || 'An unknown error occurred during token creation.');
    } finally {
      setIsLoading(false);
    }
  }, [wallet, connection]);

  const handleFormSubmit = (data: TokenData) => {
    setTokenDataToConfirm(data);
    setIsConfirmModalOpen(true);
  };

  const confirmAndCreateToken = async () => {
    if (tokenDataToConfirm) {
      setIsConfirmModalOpen(false);
      await handleCreateToken(tokenDataToConfirm);
      setTokenDataToConfirm(null);
    }
  };

  const handleReset = useCallback(() => {
    setView('form');
    setCreatedTokenInfo(null);
    setPoolAddress(null);
    setError(null);
  }, []);

  const handleCreateLiquidity = useCallback(() => {
    setView('liquidity');
  }, []);

  const handleLiquiditySuccess = useCallback((poolAddr: string) => {
    setPoolAddress(poolAddr);
    alert(`Liquidity pool created successfully! Pool Address: ${poolAddr}`);
    setView('result');
  }, []);

  const handleBackFromLiquidity = useCallback(() => {
    setView('result');
  }, []);

  return (
    <div className="min-h-screen text-brand-text flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-2xl bg-brand-surface-transparent p-8 rounded-2xl shadow-lg shadow-glow-purple border border-brand-border">
        {view === 'form' && (
          <>
            <h1 className="text-3xl font-bold mb-2 text-center uppercase">Create a New Solana Token</h1>
            <p className="text-brand-text-secondary mb-4 text-center">Fill in the details below to mint your new token.</p>
            <p className="text-sm text-brand-text-secondary/80 mb-8 text-center">
              Note: Token Supply, Decimals, and Authority settings are fixed.
            </p>
            <TokenForm
              onSubmit={handleFormSubmit}
              isLoading={isLoading}
              isConfirmModalOpen={isConfirmModalOpen}
            />
             {error && (
              <div className="mt-4 p-4 bg-red-900/50 border border-red-500 text-red-300 rounded-lg text-sm">
                <strong>Error:</strong> {error}
              </div>
            )}
          </>
        )}
        {view === 'result' && createdTokenInfo && (
          <TokenResult
            tokenInfo={createdTokenInfo}
            onReset={handleReset}
            onCreateLiquidity={handleCreateLiquidity}
          />
        )}
        {view === 'liquidity' && createdTokenInfo && (
          <CreateLiquidity
            tokenInfo={createdTokenInfo}
            onBack={handleBackFromLiquidity}
            onSuccess={handleLiquiditySuccess}
          />
        )}
      </div>

      {isConfirmModalOpen && tokenDataToConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center animate-fade-in p-4">
          <div className="bg-brand-surface rounded-2xl shadow-2xl p-8 m-4 w-full max-w-lg relative border border-brand-accent/50">
            <h2 className="text-2xl font-bold mb-4 text-brand-text uppercase">Confirm Transaction</h2>
            <p className="text-brand-text-secondary mb-6">Please review the details below before proceeding.</p>

            <div className="space-y-4 text-left bg-brand-bg-transparent p-4 rounded-lg border border-brand-border mb-6">
              <div>
                <label className="text-xs font-mono text-brand-text-secondary">TOKEN NAME</label>
                <p className="text-brand-text">{tokenDataToConfirm.name}</p>
              </div>
              <div>
                <label className="text-xs font-mono text-brand-text-secondary">TOKEN SYMBOL</label>
                <p className="text-brand-text">{tokenDataToConfirm.symbol}</p>
              </div>
              <div>
                <label className="text-xs font-mono text-red-400 font-bold">FEE AMOUNT</label>
                <p className="font-bold text-brand-accent">0.1 SOL</p>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <button onClick={() => setIsConfirmModalOpen(false)} disabled={isLoading} className="py-2 px-4 border border-brand-border rounded-lg text-sm font-medium text-brand-text-secondary hover:border-brand-accent transition-colors disabled:opacity-50 uppercase">CANCEL</button>
              <button onClick={confirmAndCreateToken} disabled={isLoading} className="w-40 flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-brand-accent hover:bg-brand-accent-hover disabled:opacity-50 uppercase">
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : 'CONFIRM & CREATE'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
