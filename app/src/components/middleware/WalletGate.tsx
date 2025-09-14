"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useWallet } from "@crossmint/client-sdk-react-ui";
import { useProfile } from "@/hooks/useProfile";

export function WalletGate({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { wallet } = useWallet();
  const router = useRouter();
  const walletAddress = wallet?.address ?? null;
  const { ensureProfileExists } = useProfile(walletAddress);

  useEffect(() => {
    async function run() {
      if (!user || !walletAddress) return;
      const { exists } = await ensureProfileExists();
      if (!exists) router.replace("/signup");
    }
    run();
  }, [user, walletAddress, ensureProfileExists, router]);

  return <>{children}</>;
}
