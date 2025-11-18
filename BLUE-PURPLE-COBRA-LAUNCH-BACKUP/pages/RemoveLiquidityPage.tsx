import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

export const RemoveLiquidityPage: React.FC = () => {
  const [poolAddress, setPoolAddress] = useState('');
  const [percentage, setPercentage] = useState(100);
  const wallet = useWallet();

  return (
    <div className="min-h-screen text-brand-text flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-2xl bg-brand-surface-transparent p-8 rounded-2xl shadow-lg shadow-glow-purple border border-brand-border">
        <h1 className="text-3xl font-bold mb-2 text-center uppercase flex items-center justify-center gap-2">
          <span>🔄</span>
          Remove Liquidity
        </h1>
        <p className="text-brand-text-secondary mb-8 text-center">
          Remove liquidity from your Raydium pool
        </p>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Pool Address</label>
            <input
              type="text"
              value={poolAddress}
              onChange={(e) => setPoolAddress(e.target.value)}
              placeholder="Enter pool address"
              className="w-full px-4 py-3 bg-brand-bg-transparent border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent text-brand-text"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Amount to Remove: {percentage}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={percentage}
              onChange={(e) => setPercentage(parseInt(e.target.value))}
              className="w-full h-2 bg-brand-bg-transparent rounded-lg appearance-none cursor-pointer accent-brand-accent"
            />
            <div className="flex justify-between text-xs text-brand-text-secondary mt-2">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>

          <div className="flex gap-2">
            {[25, 50, 75, 100].map((value) => (
              <button
                key={value}
                onClick={() => setPercentage(value)}
                className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                  percentage === value
                    ? 'bg-brand-accent text-white'
                    : 'bg-brand-bg-transparent border border-brand-border text-brand-text-secondary hover:border-brand-accent'
                }`}
              >
                {value}%
              </button>
            ))}
          </div>

          <div className="p-4 bg-purple-900/30 border border-purple-500 rounded-lg">
            <p className="text-purple-300 text-sm">
              <strong>Note:</strong> Remove liquidity feature requires integration with Raydium SDK. This feature is coming soon. For now, please remove liquidity manually at <a href="https://raydium.io/liquidity/" target="_blank" rel="noopener noreferrer" className="text-purple-400 underline">Raydium.io</a>
            </p>
          </div>

          <button
            disabled
            className="w-full py-4 bg-brand-accent hover:bg-brand-accent-hover text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase"
          >
            Coming Soon
          </button>
        </div>
      </div>
    </div>
  );
};
