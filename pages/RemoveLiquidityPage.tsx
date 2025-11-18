import React, { useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';

const RemoveLiquidityPage: React.FC = () => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const [poolAddress, setPoolAddress] = useState('');
  const [percentage, setPercentage] = useState('100');
  const [isLoading, setIsLoading] = useState(false);
  const [poolInfo, setPoolInfo] = useState<any>(null);

  const handleFetchPoolInfo = async () => {
    if (!poolAddress) return;

    setIsLoading(true);
    try {
      // TODO: Fetch pool information from Raydium
      console.log('Fetching pool info for:', poolAddress);

      // Placeholder data
      setPoolInfo({
        tokenA: 'SOL',
        tokenB: 'TOKEN',
        lpBalance: '1000',
        sharePercentage: '0.5',
      });
    } catch (error) {
      console.error('Error fetching pool info:', error);
      alert('Failed to fetch pool information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveLiquidity = async () => {
    if (!wallet.connected) {
      alert('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Implement Raydium liquidity removal
      console.log('Removing liquidity:', { poolAddress, percentage });
      alert('Liquidity removal will be implemented soon!');
    } catch (error) {
      console.error('Error removing liquidity:', error);
      alert('Failed to remove liquidity');
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
                Remove Liquidity
              </h1>
              <p className="text-brand-text-secondary">Withdraw your tokens from a liquidity pool</p>
            </div>

            {!wallet.connected ? (
              <div className="text-center py-12">
                <p className="text-brand-text-secondary text-lg">
                  Please connect your wallet to remove liquidity
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-brand-text mb-2">
                    Pool Address
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={poolAddress}
                      onChange={(e) => setPoolAddress(e.target.value)}
                      placeholder="Enter pool address"
                      className="flex-1 px-4 py-3 bg-brand-bg-transparent border border-brand-border rounded-lg text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent"
                    />
                    <button
                      onClick={handleFetchPoolInfo}
                      disabled={!poolAddress || isLoading}
                      className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      Fetch
                    </button>
                  </div>
                </div>

                {poolInfo && (
                  <div className="bg-gray-800/50 border border-brand-border rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-brand-text mb-4">Pool Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-brand-text-secondary">Token Pair:</span>
                        <span className="text-brand-text">{poolInfo.tokenA} / {poolInfo.tokenB}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-brand-text-secondary">Your LP Balance:</span>
                        <span className="text-brand-text">{poolInfo.lpBalance}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-brand-text-secondary">Pool Share:</span>
                        <span className="text-brand-text">{poolInfo.sharePercentage}%</span>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-brand-text">
                      Amount to Remove
                    </label>
                    <span className="text-sm text-brand-accent font-semibold">{percentage}%</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={percentage}
                    onChange={(e) => setPercentage(e.target.value)}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-accent"
                  />
                  <div className="flex justify-between mt-2">
                    {['25', '50', '75', '100'].map((val) => (
                      <button
                        key={val}
                        onClick={() => setPercentage(val)}
                        className={`px-4 py-1 rounded text-sm font-medium transition-colors ${
                          percentage === val
                            ? 'bg-brand-accent text-white'
                            : 'bg-gray-800 text-brand-text-secondary hover:bg-gray-700'
                        }`}
                      >
                        {val}%
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-yellow-900/30 border border-yellow-500/50 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <span className="text-xl">⚠️</span>
                    <div className="text-sm text-yellow-200">
                      <p className="font-semibold mb-1">Important Notice</p>
                      <p>Removing liquidity will withdraw your tokens from the pool. Make sure you understand the implications before proceeding.</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleRemoveLiquidity}
                  disabled={isLoading || !poolAddress}
                  className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg uppercase transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Processing...' : 'Remove Liquidity'}
                </button>

                <div className="text-xs text-brand-text-secondary text-center">
                  <p>⚠️ Liquidity removal feature coming soon!</p>
                  <p className="mt-1">For now, please remove liquidity manually at <a href="https://raydium.io/liquidity/" target="_blank" rel="noopener noreferrer" className="text-brand-accent hover:underline">Raydium.io</a></p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default RemoveLiquidityPage;
