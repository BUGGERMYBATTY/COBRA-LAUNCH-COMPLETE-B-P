import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Header } from './components/Header';
import { HomePage } from './pages/HomePage';
import { LiquidityPage } from './pages/LiquidityPage';
import { RemoveLiquidityPage } from './pages/RemoveLiquidityPage';
import { BurnPage } from './pages/BurnPage';

const App: React.FC = () => {
  const wallet = useWallet();

  // Get network name from environment variable for display
  const networkName = (import.meta.env.VITE_SOLANA_NETWORK || 'mainnet-beta').toUpperCase();
  const isMainnet = networkName === 'MAINNET-BETA';

  return (
    <div className="min-h-screen text-brand-text flex flex-col font-sans">
      {/* Show header only when wallet is connected */}
      {wallet.connected && <Header />}

      {/* Main content area */}
      {!wallet.connected ? (
        // Wallet not connected - show landing page
        <div className="flex-grow flex flex-col p-8">
            <header className="w-full flex justify-between items-center mb-4">
              <img
                src="https://yellow-peculiar-cephalopod-560.mypinata.cloud/ipfs/bafybeid5l5jhuqjgwhbrs7a4fe6ilgqh37t6nlvmsx6v5uflfl3hcnnvrm"
                alt="Cobra Launch"
                className="h-48"
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
            </header>
            <main className="flex-grow flex items-center justify-center">
              <div className="text-center space-y-6">
                <h1 className="text-4xl font-bold uppercase">Create a Solana Token</h1>
                <p className="text-brand-text-secondary">No coding required. Launch your token in minutes.</p>
                <p className="text-2xl font-bold uppercase tracking-wider">
                  <span className="text-neon-purple">CREATE </span>
                  <span style={{color: '#42d6d8'}}>LAUNCH </span>
                  <span className="text-neon-purple">STRIKE</span>
                </p>
                <div className="pt-4">
                  <WalletMultiButton>CONNECT WALLET TO GET STARTED</WalletMultiButton>
                </div>
              </div>
            </main>
        </div>
      ) : (
        // Wallet connected - show routes
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/liquidity" element={<LiquidityPage />} />
          <Route path="/remove-liquidity" element={<RemoveLiquidityPage />} />
          <Route path="/burn" element={<BurnPage />} />
        </Routes>
      )}
    </div>
  );
};

export default App;
