import React, { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Transaction, SystemProgram, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import type { CreatedTokenInfo } from '../types';

interface CreateLiquidityProps {
  tokenInfo?: CreatedTokenInfo;
  onBack: () => void;
  onSuccess: (poolAddress: string) => void;
}

const PLATFORM_FEE = 0.15; // SOL
const RAYDIUM_FEE = 0.17; // SOL
const TOTAL_FEES = PLATFORM_FEE + RAYDIUM_FEE;

const CreateLiquidity: React.FC<CreateLiquidityProps> = ({ tokenInfo, onBack, onSuccess }) => {
  const { connection } = useConnection();
  const wallet = useWallet();

  const [formData, setFormData] = useState({
    tokenMint: tokenInfo?.address || '',
    tokenSymbol: tokenInfo?.symbol || '',
    baseAmount: '',
    quoteAmount: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Calculate initial price
  const initialPrice = formData.quoteAmount && formData.baseAmount
    ? (Number(formData.quoteAmount) / Number(formData.baseAmount)).toFixed(9)
    : '0';

  const totalCost = TOTAL_FEES + parseFloat(formData.quoteAmount || '0');

  // Liquidity warning component
  const getLiquidityWarning = (amount: number) => {
    if (amount < 0.1) {
      return (
        <div className="bg-red-900/20 border-2 border-red-500 text-red-400 p-4 rounded-lg my-3">
          <strong className="block mb-2">⚠️ EXTREMELY LOW LIQUIDITY</strong>
          <p className="text-sm mb-2">Your pool will be nearly impossible to trade. Expect 90%+ slippage on small trades.</p>
          <p className="text-xs">Minimum viable: 0.5 SOL | Recommended: 1-2 SOL</p>
        </div>
      );
    }

    if (amount < 0.5) {
      return (
        <div className="bg-orange-900/20 border-2 border-orange-500 text-orange-400 p-4 rounded-lg my-3">
          <strong className="block mb-2">⚠️ LOW LIQUIDITY WARNING</strong>
          <p className="text-sm mb-2">Price impact will be high (20-50% on $10 trades). Your token may appear unprofessional.</p>
          <p className="text-xs">Recommended: 0.5-2 SOL for smooth trading</p>
        </div>
      );
    }

    if (amount >= 0.5 && amount < 2) {
      return (
        <div className="bg-purple-900/20 border-2 border-purple-500 text-purple-300 p-4 rounded-lg my-3">
          <strong className="block mb-2">✅ GOOD LIQUIDITY</strong>
          <p className="text-sm mb-2">Sufficient for small trades. Price impact: 5-15% on typical trades.</p>
          <p className="text-xs">Ideal for: New tokens, memecoins, testing</p>
        </div>
      );
    }

    if (amount >= 2) {
      return (
        <div className="bg-green-900/20 border-2 border-green-500 text-green-400 p-4 rounded-lg my-3">
          <strong className="block mb-2">✅ EXCELLENT LIQUIDITY</strong>
          <p className="text-sm mb-2">Professional-grade pool. Low slippage, attracts serious traders.</p>
          <p className="text-xs">Price impact: &lt;5% on most trades</p>
        </div>
      );
    }
  };

  const handleCreatePool = async () => {
    if (!wallet.publicKey) {
      setError('Please connect your wallet');
      return;
    }

    if (!formData.quoteAmount || !formData.baseAmount) {
      setError('Please enter both token and SOL amounts');
      return;
    }

    if (parseFloat(formData.quoteAmount) < 0.01) {
      setError('Minimum liquidity is 0.01 SOL');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Call backend API
      const backendUrl = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/create-liquidity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          walletPublicKey: wallet.publicKey.toString()
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create pool');
      }

      // Deserialize and send transaction
      const transaction = Transaction.from(
        Buffer.from(data.transaction, 'base64')
      );

      const signature = await wallet.sendTransaction(transaction, connection);
      console.log('Transaction sent:', signature);

      await connection.confirmTransaction(signature, 'confirmed');
      console.log('Transaction confirmed!');

      onSuccess(data.poolAddress);

    } catch (err) {
      console.error('Pool creation error:', err);
      setError((err as Error).message || 'Failed to create liquidity pool');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold uppercase text-neon-purple mb-4">CREATE LIQUIDITY POOL</h1>
        <p className="text-brand-text-secondary">Add liquidity to make your token tradeable on Raydium</p>
      </div>

      <div className="bg-brand-surface-transparent p-8 rounded-2xl border border-brand-border shadow-glow-purple">
        {/* Pool Configuration */}
        <h2 className="text-2xl font-bold uppercase text-brand-accent mb-6">POOL CONFIGURATION</h2>

        {/* Token Mint Address */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-brand-text-secondary mb-2 uppercase">Token Mint Address</label>
          <input
            type="text"
            value={formData.tokenMint}
            onChange={(e) => setFormData({...formData, tokenMint: e.target.value})}
            placeholder="Token address"
            disabled={!!tokenInfo}
            className="w-full bg-brand-bg-transparent border border-brand-border rounded-lg p-3 text-brand-text focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none"
          />
          {tokenInfo && (
            <p className="text-xs text-brand-text-secondary mt-1">Symbol: {formData.tokenSymbol}</p>
          )}
        </div>

        {/* Token Amount */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-brand-text-secondary mb-2 uppercase">Token Amount</label>
          <input
            type="number"
            value={formData.baseAmount}
            onChange={(e) => setFormData({...formData, baseAmount: e.target.value})}
            placeholder="Amount of tokens to add"
            className="w-full bg-brand-bg-transparent border border-brand-border rounded-lg p-3 text-brand-text focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none"
          />
          <p className="text-xs text-brand-text-secondary mt-1">Recommended: 95%+ of total supply</p>
        </div>

        {/* SOL Amount */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-brand-text-secondary mb-2 uppercase">SOL Liquidity Amount</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={formData.quoteAmount}
            onChange={(e) => setFormData({...formData, quoteAmount: e.target.value})}
            placeholder="Amount of SOL to pair"
            className="w-full bg-brand-bg-transparent border border-brand-border rounded-lg p-3 text-brand-text focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none"
          />

          {/* Dynamic liquidity warnings */}
          {formData.quoteAmount && getLiquidityWarning(parseFloat(formData.quoteAmount))}
        </div>

        {/* Initial Price Display */}
        <div className="bg-brand-accent/10 border-2 border-brand-accent p-6 rounded-lg text-center mb-6">
          <h3 className="text-sm font-semibold uppercase text-brand-accent mb-2">Initial Price</h3>
          <p className="text-2xl font-bold text-brand-accent">{initialPrice} SOL per token</p>
        </div>

        {/* Cost Breakdown */}
        <div className="bg-brand-bg-transparent border border-brand-border p-6 rounded-lg mb-6">
          <h3 className="text-lg font-semibold uppercase text-brand-text mb-4">Total Cost</h3>
          <div className="space-y-2 text-brand-text-secondary">
            <div className="flex justify-between">
              <span>Raydium CPMM Fee:</span>
              <span>{RAYDIUM_FEE} SOL</span>
            </div>
            <div className="flex justify-between">
              <span>Cobra Launch Fee:</span>
              <span>{PLATFORM_FEE} SOL</span>
            </div>
            <div className="flex justify-between">
              <span>Your Liquidity:</span>
              <span>{formData.quoteAmount || '0'} SOL</span>
            </div>
            <div className="flex justify-between pt-3 border-t-2 border-brand-accent text-lg font-bold text-brand-accent">
              <span>TOTAL:</span>
              <span>{totalCost.toFixed(2)} SOL</span>
            </div>
          </div>
        </div>

        {/* Educational Info */}
        <div className="bg-purple-900/10 border border-purple-500/50 p-6 rounded-lg mb-6">
          <h4 className="font-semibold text-brand-accent mb-3 uppercase">💡 What Is Initial Liquidity?</h4>
          <ul className="space-y-2 text-sm text-brand-text-secondary">
            <li>✓ Your SOL + tokens locked in the trading pool</li>
            <li>✓ NOT a fee - you can withdraw it later via LP tokens</li>
            <li>✓ Earns you 0.25% from every trade</li>
            <li>✓ Higher liquidity = lower slippage = more traders</li>
          </ul>

          <h4 className="font-semibold text-brand-accent mt-4 mb-3 uppercase">📊 Liquidity Examples:</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-brand-text-secondary">
              <span>0.1 SOL</span>
              <span>❌ High slippage, looks unprofessional</span>
            </div>
            <div className="flex justify-between text-brand-text-secondary">
              <span>0.5 SOL</span>
              <span>✅ Viable for small tokens</span>
            </div>
            <div className="flex justify-between text-brand-text-secondary">
              <span>1-2 SOL</span>
              <span>✅✅ Good for serious launches</span>
            </div>
            <div className="flex justify-between text-brand-text-secondary">
              <span>5+ SOL</span>
              <span>🚀 Professional, low slippage</span>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/20 border border-red-500 text-red-400 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            className="flex-1 py-3 px-4 border border-brand-border rounded-lg text-sm font-medium text-brand-text-secondary hover:border-brand-accent transition-colors uppercase"
            onClick={onBack}
            disabled={loading}
          >
            BACK
          </button>
          <button
            className="flex-1 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-brand-accent hover:bg-brand-accent-hover disabled:opacity-50 transition-colors uppercase"
            onClick={handleCreatePool}
            disabled={loading || !wallet.publicKey || !formData.quoteAmount || !formData.baseAmount}
          >
            {loading ? 'CREATING POOL...' : 'CREATE LIQUIDITY POOL'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateLiquidity;
