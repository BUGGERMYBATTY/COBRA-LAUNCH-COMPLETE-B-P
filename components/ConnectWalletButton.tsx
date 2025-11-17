import React from 'react';

interface ConnectWalletButtonProps {
  walletAddress: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
}

const ConnectWalletButton: React.FC<ConnectWalletButtonProps> = ({ walletAddress, onConnect, onDisconnect }) => {
  if (walletAddress) {
    const truncatedAddress = `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`;
    return (
      <div className="relative group">
        <button className="bg-brand-surface-transparent border border-brand-border text-brand-text font-semibold py-2 px-4 rounded-lg shadow-md hover:border-brand-accent transition-all duration-200">
          {truncatedAddress}
        </button>
        <div className="absolute top-full right-0 mt-2 w-40 bg-brand-surface-transparent border border-brand-border rounded-md shadow-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto">
          <button
            onClick={onDisconnect}
            className="w-full text-left px-3 py-2 text-sm text-brand-text-secondary hover:bg-brand-bg-transparent rounded-md"
          >
            Disconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={onConnect}
      className="bg-brand-accent text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-brand-accent-hover transition-all duration-200"
    >
      Connect Wallet
    </button>
  );
};

export default ConnectWalletButton;