import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

const LiquidityPage: React.FC = () => {
  const wallet = useWallet();
  const [tokenAddress, setTokenAddress] = useState('');
  const [solAmount, setSolAmount] = useState('');
  const [tokenAmount, setTokenAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAddLiquidity = async () => {
    if (!wallet.connected) {
      alert('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Implement Raydium liquidity pool creation
      console.log('Adding liquidity:', { tokenAddress, solAmount, tokenAmount });
      alert('Liquidity pool creation will be implemented soon!');
    } catch (error) {
      console.error('Error adding liquidity:', error);
      alert('Failed to add liquidity');
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
              <h1 className="text-4xl font-bold mb-3 uppercase bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Add Liquidity
              </h1>
              <p className="text-brand-text-secondary">Create a liquidity pool for your token on Raydium</p>
            </div>

            {!wallet.connected ? (
              <div className="text-center py-12">
                <p className="text-brand-text-secondary text-lg">
                  Please connect your wallet to add liquidity
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-brand-text mb-2">
                    Token Address
                  </label>
                  <input
                    type="text"
                    value={tokenAddress}
                    onChange={(e) => setTokenAddress(e.target.value)}
                    placeholder="Enter token mint address"
                    className="w-full px-4 py-3 bg-brand-bg-transparent border border-brand-border rounded-lg text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-text mb-2">
                    SOL Amount
                  </label>
                  <input
                    type="number"
                    value={solAmount}
                    onChange={(e) => setSolAmount(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 bg-brand-bg-transparent border border-brand-border rounded-lg text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-text mb-2">
                    Token Amount
                  </label>
                  <input
                    type="number"
                    value={tokenAmount}
                    onChange={(e) => setTokenAmount(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 bg-brand-bg-transparent border border-brand-border rounded-lg text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent"
                  />
                </div>

                <div className="bg-purple-900/30 border border-purple-500/50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-brand-text mb-2">Pool Creation Fees</h3>
                  <div className="space-y-1 text-sm text-brand-text-secondary">
                    <div className="flex justify-between">
                      <span>Platform Fee:</span>
                      <span className="text-brand-text">0.15 SOL</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Raydium Fee:</span>
                      <span className="text-brand-text">~0.17 SOL</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t border-purple-500/30 pt-1 mt-1">
                      <span>Total Fees:</span>
                      <span className="text-brand-accent">~0.32 SOL</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleAddLiquidity}
                  disabled={isLoading || !tokenAddress || !solAmount || !tokenAmount}
                  className="w-full py-4 bg-brand-accent hover:bg-brand-accent-hover text-white font-bold rounded-lg uppercase transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Processing...' : 'Add Liquidity'}
                </button>

                <div className="text-xs text-brand-text-secondary text-center">
                  <p>⚠️ Liquidity pool creation feature coming soon!</p>
                  <p className="mt-1">For now, please create your pool manually at <a href="https://raydium.io/liquidity/create/" target="_blank" rel="noopener noreferrer" className="text-brand-accent hover:underline">Raydium.io</a></p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default LiquidityPage;
