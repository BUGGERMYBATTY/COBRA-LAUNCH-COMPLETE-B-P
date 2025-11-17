import React from 'react';
import { CloseIcon } from './icons/CloseIcon';

interface WalletSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectWallet: (walletName: 'phantom' | 'solflare') => void;
}

const WalletSelectionModal: React.FC<WalletSelectionModalProps> = ({ isOpen, onClose, onSelectWallet }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-brand-surface-transparent rounded-2xl shadow-2xl p-8 m-4 w-full max-w-sm relative text-center border border-brand-accent/50"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-brand-text-secondary hover:text-white transition-colors"
          aria-label="Close"
        >
          <CloseIcon className="h-6 w-6" />
        </button>

        <h2 className="text-2xl font-bold mb-6 text-brand-text">Connect a Wallet</h2>
        
        <div className="space-y-4">
          <button 
            onClick={() => onSelectWallet('phantom')}
            className="w-full flex items-center p-4 bg-brand-bg-transparent hover:bg-brand-bg-transparent-hover rounded-lg transition-colors duration-200 border border-brand-border hover:border-brand-accent"
          >
            <img src="https://mintcdn.com/phantom-e50e2e68/fkWrmnMWhjoXSGZ9/resources/images/Phantom_SVG_Icon.svg?w=840&fit=max&auto=format&n=fkWrmnMWhjoXSGZ9&q=85&s=7311f84864aeebc085a674acff85ff99" alt="Phantom Wallet" className="h-8 w-8 rounded-full mr-4" />
            <span className="font-semibold text-lg text-brand-text">Phantom</span>
          </button>
          <button 
            onClick={() => onSelectWallet('solflare')}
            className="w-full flex items-center p-4 bg-brand-bg-transparent hover:bg-brand-bg-transparent-hover rounded-lg transition-colors duration-200 border border-brand-border hover:border-brand-accent"
          >
            <img src="https://solflare.com/favicon.ico" alt="Solflare Wallet" className="h-8 w-8 rounded-full mr-4" />
            <span className="font-semibold text-lg text-brand-text">Solflare</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WalletSelectionModal;