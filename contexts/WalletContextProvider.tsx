import React, { FC, ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
    PhantomWalletAdapter,
    SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl, Connection } from '@solana/web3.js';

export const WalletContextProvider: FC<{ children: ReactNode }> = ({ children }) => {
    // Load network configuration from environment variables
    // Default to mainnet-beta for production deployments
    const networkEnv = import.meta.env.VITE_SOLANA_NETWORK || 'mainnet-beta';
    const network = networkEnv === 'mainnet-beta'
        ? WalletAdapterNetwork.Mainnet
        : networkEnv === 'testnet'
        ? WalletAdapterNetwork.Testnet
        : WalletAdapterNetwork.Devnet;

    // Use custom RPC endpoint if provided, otherwise use default Solana RPC
    const endpoint = useMemo(() => {
        const customEndpoint = import.meta.env.VITE_SOLANA_RPC_ENDPOINT;

        // For mainnet, use a reliable public RPC endpoint
        if (!customEndpoint && network === WalletAdapterNetwork.Mainnet) {
            return 'https://api.mainnet-beta.solana.com';
        }

        return customEndpoint || clusterApiUrl(network);
    }, [network]);

    const wallets = useMemo(
        () => [
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter(),
        ],
        [network]
    );

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>{children}</WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};
