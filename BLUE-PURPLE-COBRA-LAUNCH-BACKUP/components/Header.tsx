import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export const Header: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Create Token', icon: '🪙' },
    { path: '/liquidity', label: 'Add Liquidity', icon: '💧' },
    { path: '/remove-liquidity', label: 'Remove Liquidity', icon: '🔄' },
    { path: '/burn', label: 'Burn Tokens', icon: '🔥' },
  ];

  return (
    <header className="bg-gradient-to-r from-purple-600 via-blue-600 to-purple-700 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-3xl">🐍</span>
            <h1 className="text-2xl font-bold text-white">Cobra Launch</h1>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    px-4 py-2 rounded-lg font-medium transition-all duration-200
                    ${
                      isActive
                        ? 'bg-white text-purple-600 shadow-md'
                        : 'text-white hover:bg-white/20'
                    }
                  `}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Wallet Button */}
          <div className="flex items-center">
            <WalletMultiButton />
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden pb-4 flex overflow-x-auto space-x-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  px-3 py-2 rounded-lg font-medium whitespace-nowrap transition-all duration-200
                  ${
                    isActive
                      ? 'bg-white text-purple-600 shadow-md'
                      : 'text-white bg-white/10'
                  }
                `}
              >
                <span className="mr-1">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
