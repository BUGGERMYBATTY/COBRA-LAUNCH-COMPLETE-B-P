import React, { useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction } from '@solana/web3.js';
import { getAssociatedTokenAddress, createBurnInstruction, TOKEN_PROGRAM_ID } from '@solana/spl-token';

const BurnPage: React.FC = () => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const [tokenAddress, setTokenAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tokenBalance, setTokenBalance] = useState<string | null>(null);
  const [tokenDecimals, setTokenDecimals] = useState(9);

  const handleFetchBalance = async () => {
    if (!wallet.publicKey || !tokenAddress) return;

    setIsLoading(true);
    try {
      const mintPubkey = new PublicKey(tokenAddress);
      const associatedTokenAddress = await getAssociatedTokenAddress(
        mintPubkey,
        wallet.publicKey
      );

      const accountInfo = await connection.getTokenAccountBalance(associatedTokenAddress);
      setTokenBalance(accountInfo.value.uiAmountString || '0');
      setTokenDecimals(accountInfo.value.decimals);
    } catch (error) {
      console.error('Error fetching balance:', error);
      alert('Failed to fetch token balance. Make sure the token address is correct.');
      setTokenBalance(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBurn = async () => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      alert('Please connect your wallet first');
      return;
    }

    if (!tokenAddress || !amount) {
      alert('Please enter token address and amount');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setIsLoading(true);
    try {
      const mintPubkey = new PublicKey(tokenAddress);
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

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = wallet.publicKey;

      const signedTransaction = await wallet.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());

      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      });

      alert(`Successfully burned ${amount} tokens!\nTransaction: ${signature}`);
      setAmount('');
      handleFetchBalance(); // Refresh balance
    } catch (error) {
      console.error('Error burning tokens:', error);
      alert('Failed to burn tokens: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex-grow flex items-center justify-center">
      <div className="w-full max-w-2xl">
        <div className="bg-gradient-to-br from-purple-900/30 via-gray-900/50 to-cyan-900/30 backdrop-blur-md p-1 rounded-3xl shadow-2xl shadow-glow-purple">
          <div className="bg-gray-900/90 p-10 rounded-3xl border border-purple-500/30">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-3 uppercase bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                🔥 Burn Tokens
              </h1>
              <p className="text-brand-text-secondary">Permanently destroy tokens from circulation</p>
            </div>

            {!wallet.connected ? (
              <div className="text-center py-12">
                <p className="text-brand-text-secondary text-lg">
                  Please connect your wallet to burn tokens
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-brand-text mb-2">
                    Token Address
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tokenAddress}
                      onChange={(e) => setTokenAddress(e.target.value)}
                      placeholder="Enter token mint address"
                      className="flex-1 px-4 py-3 bg-brand-bg-transparent border border-brand-border rounded-lg text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent"
                    />
                    <button
                      onClick={handleFetchBalance}
                      disabled={!tokenAddress || isLoading}
                      className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isLoading ? 'Loading...' : 'Check'}
                    </button>
                  </div>
                </div>

                {tokenBalance !== null && (
                  <div className="bg-gray-800/50 border border-brand-border rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-brand-text-secondary">Your Balance:</span>
                      <span className="text-brand-text font-bold text-lg">{tokenBalance}</span>
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-brand-text">
                      Amount to Burn
                    </label>
                    {tokenBalance && (
                      <button
                        onClick={() => setAmount(tokenBalance)}
                        className="text-xs text-brand-accent hover:underline"
                      >
                        MAX
                      </button>
                    )}
                  </div>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.000000001"
                    className="w-full px-4 py-3 bg-brand-bg-transparent border border-brand-border rounded-lg text-brand-text focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <span className="text-2xl">⚠️</span>
                    <div className="text-sm text-red-200">
                      <p className="font-semibold mb-2">CRITICAL WARNING</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Burning tokens is <strong>IRREVERSIBLE</strong></li>
                        <li>Burned tokens are <strong>PERMANENTLY DESTROYED</strong></li>
                        <li>This action <strong>CANNOT BE UNDONE</strong></li>
                        <li>Double-check the amount before proceeding</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleBurn}
                  disabled={isLoading || !tokenAddress || !amount}
                  className="w-full py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold rounded-lg uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/50"
                >
                  {isLoading ? 'Processing...' : '🔥 Burn Tokens'}
                </button>

                <div className="text-xs text-center text-brand-text-secondary space-y-1">
                  <p>💡 Tip: Burning tokens can help reduce supply and potentially increase scarcity</p>
                  <p>Always verify the token address and amount before confirming</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default BurnPage;
