import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { base, mainnet, polygon, sepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'SafetyNet DAO',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'your-project-id',
  chains: [
    mainnet,
    polygon,
    base,
    ...(process.env.NODE_ENV === 'development' ? [sepolia] : []),
  ],
  ssr: true, // If your dApp uses server side rendering (SSR)
});