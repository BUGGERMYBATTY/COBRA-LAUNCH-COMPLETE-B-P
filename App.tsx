import React, { useState, useCallback } from 'react';
// FIX: Import Buffer for browser environments to fix 'Cannot find name Buffer' error.
import { Buffer } from 'buffer';
import TokenForm from './components/TokenForm';
import TokenResult from './components/TokenResult';
import CreateLiquidity from './components/CreateLiquidity';
import type { TokenData, CreatedTokenInfo } from './types';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton, useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Keypair, SystemProgram, Transaction, PublicKey, LAMPORTS_PER_SOL, Connection, clusterApiUrl } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, createInitializeMintInstruction, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, createMintToInstruction, createSetAuthorityInstruction, AuthorityType } from '@solana/spl-token';
import { createCreateMetadataAccountV3Instruction, PROGRAM_ID as METADATA_PROGRAM_ID } from '@metaplex-foundation/mpl-token-metadata';
import { uploadMetadataToPinata } from './lib/pinata';

const TOKEN_DECIMALS = 9;
const TOKEN_SUPPLY = 1_000_000_000;
const CREATION_FEE_SOL = 0.1;

const App: React.FC = () => {
  const [view, setView] = useState<'form' | 'result' | 'liquidity'>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [createdTokenInfo, setCreatedTokenInfo] = useState<CreatedTokenInfo | null>(null);
  const [poolAddress, setPoolAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [tokenDataToConfirm, setTokenDataToConfirm] = useState<TokenData | null>(null);
  
  const wallet = useWallet();
  const { connection } = useConnection();
  const { visible: isWalletModalVisible } = useWalletModal();

  const handleCreateToken = useCallback(async (data: TokenData) => {
    if (!wallet.publicKey || !wallet.sendTransaction) {
      setError("Wallet not connected. Please connect your wallet to continue.");
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      console.log('Token Creation Data:', data);
      console.log('Data types:', {
        name: typeof data.name,
        symbol: typeof data.symbol,
        treasuryAddress: typeof data.treasuryAddress
      });

      // Validate treasury address is set
      if (!data.treasuryAddress || data.treasuryAddress.trim() === '') {
        throw new Error("Treasury address is not configured. Please check your environment settings.");
      }

      // SAFEGUARD: Explicitly block transactions to the known incorrect address.
      const FORBIDDEN_ADDRESS = "CobrA111111111111111111111111111111111111111";
      if (data.treasuryAddress.trim() === FORBIDDEN_ADDRESS) {
          throw new Error("CRITICAL ERROR: Attempted to send fee to a hardcoded incorrect address. Aborting transaction.");
      }

      // 0. Set fee recipient
      const feeRecipient = new PublicKey(data.treasuryAddress);

      // 1. Upload metadata to Pinata
      const metadataUri = await uploadMetadataToPinata(data);
      
      // 2. Create new mint keypair
      const mintKeypair = Keypair.generate();

      // CRITICAL FIX: Bypass getMinimumBalanceForRentExemption entirely
      // Hardcode the rent-exempt lamports for an 82-byte mint account
      // Standard token mint (82 bytes) requires ~1.46 SOL rent exemption
      const mintLen = 82;
      const lamports = 1461600; // Hardcoded rent-exempt minimum for 82-byte account

      console.log('Using hardcoded values - mintLen:', mintLen, 'lamports:', lamports);

      // 3. Get Associated Token Account address
      const associatedTokenAddress = await getAssociatedTokenAddress(
        mintKeypair.publicKey,
        wallet.publicKey
      );

      // 4. Get Metadata PDA
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

      // MANUAL TRANSACTION SIGNING AND SENDING
      // This bypasses wallet.sendTransaction() which has blockhash issues
      console.log('Manually building and signing transaction...');
      console.log('Using RPC:', connection.rpcEndpoint);

      // Fetch blockhash using RPC call directly to avoid SDK type issues
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
      console.log('Got blockhash:', blockhash.slice(0, 8) + '...');

      // Set transaction properties
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = wallet.publicKey;

      // Partially sign with mint keypair
      transaction.partialSign(mintKeypair);

      // Sign with wallet
      console.log('Requesting wallet signature...');
      const signedTransaction = await wallet.signTransaction!(transaction);

      // Serialize and send raw transaction immediately
      // IMPORTANT: Cannot change blockhash after signing - it would invalidate signatures!
      console.log('Sending raw transaction...');
      const rawTransaction = signedTransaction.serialize();
      const signature = await connection.sendRawTransaction(rawTransaction, {
        skipPreflight: true,
        maxRetries: 5
      });

      console.log('Transaction sent, signature:', signature);
      console.log('Confirming transaction...');

      // Confirm the transaction using the original blockhash
      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      }, 'confirmed');

      console.log('Transaction confirmed!');

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
    // You could add a success view or navigate back to result with pool info
    alert(`Liquidity pool created successfully! Pool Address: ${poolAddr}`);
    setView('result');
  }, []);

  const handleBackFromLiquidity = useCallback(() => {
    setView('result');
  }, []);

  // Get network name from environment variable for display
  const networkName = (import.meta.env.VITE_SOLANA_NETWORK || 'mainnet-beta').toUpperCase();
  const isMainnet = networkName === 'MAINNET-BETA';

  return (
    <div className="min-h-screen text-brand-text flex flex-col p-8 font-sans bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      {/* Header Box */}
      <header className="w-full mb-8">
        <div className="bg-brand-surface-transparent backdrop-blur-sm p-6 rounded-2xl shadow-lg shadow-glow-purple border border-brand-border">
          <div className="flex justify-between items-center">
            <img
              src="https://yellow-peculiar-cephalopod-560.mypinata.cloud/ipfs/bafybeid5l5jhuqjgwhbrs7a4fe6ilgqh37t6nlvmsx6v5uflfl3hcnnvrm"
              alt="Cobra Launch"
              className="h-32"
            />
            <div className="flex items-center gap-4">
              <div className={`text-sm font-semibold rounded-full px-4 py-1.5 ${
                isMainnet
                  ? 'text-fuchsia-300 bg-fuchsia-900/50 border border-fuchsia-500'
                  : 'text-purple-300 bg-purple-900/50 border border-purple-500'
              }`}>
                {isMainnet ? 'Mainnet' : networkName}
              </div>
              <WalletMultiButton />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center">
        {!wallet.connected ? (
          !isWalletModalVisible && (
            <div className="bg-brand-surface-transparent backdrop-blur-sm p-12 rounded-2xl shadow-2xl shadow-glow-purple border border-brand-border max-w-2xl w-full">
              <div className="text-center space-y-6">
                <h1 className="text-5xl font-bold uppercase bg-gradient-to-r from-purple-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  Create a Solana Token
                </h1>
                <p className="text-brand-text-secondary text-lg">No coding required. Launch your token in minutes.</p>
                <div className="py-4">
                  <p className="text-3xl font-bold uppercase tracking-wider">
                    <span className="text-neon-purple">CREATE </span>
                    <span style={{color: '#42d6d8'}}>LAUNCH </span>
                    <span className="text-neon-purple">STRIKE</span>
                  </p>
                </div>
                <div className="pt-6">
                  <WalletMultiButton>CONNECT WALLET TO GET STARTED</WalletMultiButton>
                </div>
              </div>
            </div>
          )
        ) : (
          <div className="w-full max-w-3xl">
            {/* Main Creation Box */}
            <div className="bg-gradient-to-br from-purple-900/30 via-gray-900/50 to-cyan-900/30 backdrop-blur-md p-1 rounded-3xl shadow-2xl shadow-glow-purple">
              <div className="bg-gray-900/90 p-10 rounded-3xl border border-purple-500/30">
                {view === 'form' && (
                  <>
                    <div className="text-center mb-8">
                      <h1 className="text-4xl font-bold mb-3 uppercase bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                        Create a New Solana Token
                      </h1>
                      <p className="text-brand-text-secondary mb-2">Fill in the details below to mint your new token.</p>
                      <p className="text-sm text-brand-text-secondary/70">
                        Note: Token Supply, Decimals, and Authority settings are fixed.
                      </p>
                    </div>
                    <TokenForm
                      onSubmit={handleFormSubmit}
                      isLoading={isLoading}
                      isConfirmModalOpen={isConfirmModalOpen}
                    />
                     {error && (
                      <div className="mt-6 p-4 bg-red-900/50 border border-red-500 text-red-300 rounded-xl text-sm shadow-lg">
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
            </div>
          </div>
        )}
      </main>

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

export default App;
