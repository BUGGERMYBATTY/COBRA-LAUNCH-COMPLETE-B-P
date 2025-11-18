import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

export const LiquidityPage: React.FC = () => {
  const [tokenMint, setTokenMint] = useState('');
  const [tokenAmount, setTokenAmount] = useState('');
  const [solAmount, setSolAmount] = useState('');
  const wallet = useWallet();

  return (
    <div className="min-h-screen text-brand-text flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-2xl bg-brand-surface-transparent p-8 rounded-2xl shadow-lg shadow-glow-purple border border-brand-border">
        <h1 className="text-3xl font-bold mb-2 text-center uppercase flex items-center justify-center gap-2">
          <span>💧</span>
          Add Liquidity
        </h1>
        <p className="text-brand-text-secondary mb-8 text-center">
          Create a liquidity pool on Raydium
        </p>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Token Mint Address</label>
            <input
              type="text"
              value={tokenMint}
              onChange={(e) => setTokenMint(e.target.value)}
              placeholder="Enter token mint address"
              className="w-full px-4 py-3 bg-brand-bg-transparent border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent text-brand-text"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Token Amount</label>
            <input
              type="number"
              value={tokenAmount}
              onChange={(e) => setTokenAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-3 bg-brand-bg-transparent border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent text-brand-text"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">SOL Amount</label>
            <input
              type="number"
              value={solAmount}
              onChange={(e) => setSolAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-3 bg-brand-bg-transparent border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent text-brand-text"
            />
          </div>

          <div className="p-4 bg-purple-900/30 border border-purple-500 rounded-lg">
            <p className="text-purple-300 text-sm">
              <strong>Note:</strong> Liquidity pool creation requires integration with Raydium SDK. This feature is coming soon. For now, please create your pool manually at <a href="https://raydium.io/liquidity/create/" target="_blank" rel="noopener noreferrer" className="text-purple-400 underline">Raydium.io</a>
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
