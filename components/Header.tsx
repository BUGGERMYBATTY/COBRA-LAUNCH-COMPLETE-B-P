import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

const Header: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Create Token', icon: '🪙' },
    { path: '/liquidity', label: 'Add Liquidity', icon: '💧' },
    { path: '/remove-liquidity', label: 'Remove Liquidity', icon: '🔄' },
    { path: '/burn', label: 'Burn Tokens', icon: '🔥' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="w-full mb-8">
      <div className="bg-brand-surface-transparent backdrop-blur-sm rounded-2xl shadow-lg shadow-glow-purple border border-brand-border">
        {/* Top Section - Logo and Wallet */}
        <div className="flex justify-between items-center p-6 border-b border-brand-border">
          <div className="flex items-center space-x-4">
            <div className="text-3xl">🐍</div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                COBRA LAUNCH
              </h1>
              <p className="text-sm text-brand-text-secondary">Solana Token Creation Suite</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <WalletMultiButton />
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex justify-center items-center p-4">
          <div className="flex space-x-2 bg-gray-900/50 rounded-xl p-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center space-x-2 px-6 py-3 rounded-lg font-medium
                  transition-all duration-200
                  ${
                    isActive(item.path)
                      ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow-lg shadow-purple-500/50'
                      : 'text-brand-text-secondary hover:text-brand-text hover:bg-gray-800/50'
                  }
                `}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
