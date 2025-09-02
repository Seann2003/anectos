"use client";

// This component is now deprecated in favor of Crossmint wallet integration
// See CrossmintProvider.tsx and WalletDashboard.tsx for the new implementation

import { useAuth, useWallet } from "@crossmint/client-sdk-react-ui";

export function WalletStatus() {
  const { user } = useAuth();
  const { wallet, status } = useWallet();

  if (!user) {
    return (
      <div className="text-center p-4">
        <p>Please log in to access your wallet</p>
      </div>
    );
  }

  if (status === "in-progress") {
    return (
      <div className="text-center p-4">
        <p>Creating your wallet...</p>
      </div>
    );
  }

  if (wallet) {
    return (
      <div className="text-center p-4">
        <p>
          Wallet connected: {wallet.address.slice(0, 8)}...
          {wallet.address.slice(-8)}
        </p>
      </div>
    );
  }

  return (
    <div className="text-center p-4">
      <p>Wallet not available</p>
    </div>
  );
}

// Legacy Solana wallet adapter components (kept for reference)
export const WalletMultiButtonDynamic = null;
export const SolanaProvider = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
);

// Export the new component as the default
export default WalletStatus;
