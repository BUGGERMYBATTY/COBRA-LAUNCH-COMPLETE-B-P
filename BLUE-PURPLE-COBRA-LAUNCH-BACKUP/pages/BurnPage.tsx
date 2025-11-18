import React, { useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction } from '@solana/web3.js';
import { getAssociatedTokenAddress, createBurnInstruction, TOKEN_PROGRAM_ID, getAccount } from '@solana/spl-token';

export const BurnPage: React.FC = () => {
  const [tokenMint, setTokenMint] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);
  const [tokenDecimals, setTokenDecimals] = useState<number>(9);

  const wallet = useWallet();
  const { connection } = useConnection();

  const checkBalance = async () => {
    if (!wallet.publicKey || !tokenMint) return;

    try {
      setError(null);
      const mintPubkey = new PublicKey(tokenMint);
      const associatedTokenAddress = await getAssociatedTokenAddress(
        mintPubkey,
        wallet.publicKey
      );

      const tokenAccount = await getAccount(connection, associatedTokenAddress);
      const mintInfo = await connection.getParsedAccountInfo(mintPubkey);

      if (mintInfo.value && 'parsed' in mintInfo.value.data) {
        const decimals = mintInfo.value.data.parsed.info.decimals;
        setTokenDecimals(decimals);
        const balance = Number(tokenAccount.amount) / Math.pow(10, decimals);
        setTokenBalance(balance);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch token balance. Make sure you own this token.');
      setTokenBalance(null);
    }
  };

  const handleBurn = async () => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      setError('Please connect your wallet');
      return;
    }

    if (!tokenMint || !amount) {
      setError('Please enter token mint address and amount');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const mintPubkey = new PublicKey(tokenMint);
      const amountNum = parseFloat(amount);

      if (isNaN(amountNum) || amountNum <= 0) {
        throw new Error('Invalid amount');
      }

      const associatedTokenAddress = await getAssociatedTokenAddress(
        mintPubkey,
        wallet.publicKey
      );

      const burnAmount = Math.floor(amountNum * Math.pow(10, tokenDecimals));

      const transaction = new Transaction().add(
        createBurnInstruction(
          associatedTokenAddress,
          mintPubkey,
          wallet.publicKey,
          burnAmount,
          [],
          TOKEN_PROGRAM_ID
        )
      );

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

      const signedTransaction = await wallet.signTransaction(transaction);
      const rawTransaction = signedTransaction.serialize();
      const signature = await connection.sendRawTransaction(rawTransaction, {
        skipPreflight: false,
        maxRetries: 3
      });

      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      }, 'confirmed');

      setSuccess(`Successfully burned ${amount} tokens! Signature: ${signature}`);
      setAmount('');
      await checkBalance();
    } catch (err) {
      console.error(err);
      setError((err as Error).message || 'Failed to burn tokens');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-brand-text flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-2xl bg-brand-surface-transparent p-8 rounded-2xl shadow-lg shadow-glow-purple border border-brand-border">
        <h1 className="text-3xl font-bold mb-2 text-center uppercase flex items-center justify-center gap-2">
          <span>🔥</span>
          Burn Tokens
        </h1>
        <p className="text-brand-text-secondary mb-8 text-center">
          Permanently remove tokens from circulation
        </p>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Token Mint Address</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tokenMint}
                onChange={(e) => setTokenMint(e.target.value)}
                placeholder="Enter token mint address"
                className="flex-1 px-4 py-3 bg-brand-bg-transparent border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent text-brand-text"
              />
              <button
                onClick={checkBalance}
                disabled={!tokenMint || !wallet.connected}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Check Balance
              </button>
            </div>
          </div>

          {tokenBalance !== null && (
            <div className="p-4 bg-green-900/30 border border-green-500 rounded-lg">
              <p className="text-green-300 font-medium">
                Your Balance: {tokenBalance.toLocaleString()} tokens
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Amount to Burn</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-3 bg-brand-bg-transparent border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent text-brand-text"
            />
          </div>

          <div className="p-4 bg-red-900/20 border border-red-500 rounded-lg">
            <p className="text-red-300 text-sm flex items-start gap-2">
              <span>⚠️</span>
              <span>
                <strong>Warning:</strong> Burning tokens is permanent and cannot be undone. The tokens will be removed from circulation forever.
              </span>
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-900/50 border border-red-500 text-red-300 rounded-lg text-sm">
              <strong>Error:</strong> {error}
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-900/50 border border-green-500 text-green-300 rounded-lg text-sm">
              <strong>Success:</strong> {success}
            </div>
          )}

          <button
            onClick={handleBurn}
            disabled={!wallet.connected || !tokenMint || !amount || isLoading}
            className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Burning...
              </>
            ) : (
              <>
                <span>🔥</span>
                Burn Tokens
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
