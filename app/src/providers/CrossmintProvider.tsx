"use client";

import { Suspense, useMemo } from "react";
import {
  CrossmintProvider,
  CrossmintAuthProvider,
  CrossmintWalletProvider,
} from "@crossmint/client-sdk-react-ui";

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
}

function ProviderContent({ children }: { children: React.ReactNode }) {
  return (
    <CrossmintAuthProvider
      loginMethods={[
        "email",
        "google",
        "twitter",
        "farcaster",
        "web3:solana-only",
      ]}
      authModalTitle="Connect to Anectos"
    >
      <CrossmintWalletProvider
        createOnLogin={{
          chain: "solana",
          signer: {
            type: "email",
          },
        }}
        showPasskeyHelpers={false}
      >
        {children}
      </CrossmintWalletProvider>
    </CrossmintAuthProvider>
  );
}

export function CrossmintProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  const apiKey = process.env.NEXT_PUBLIC_CROSSMINT_CLIENT_API_KEY;

  // Memoize the provider to prevent re-renders
  const memoizedProvider = useMemo(() => {
    if (!apiKey) {
      console.error(
        "Missing NEXT_PUBLIC_CROSSMINT_CLIENT_API_KEY environment variable"
      );
      return <div>Missing Crossmint API Key configuration</div>;
    }

    return (
      <CrossmintProvider apiKey={apiKey}>
        <Suspense fallback={<LoadingFallback />}>
          <ProviderContent>{children}</ProviderContent>
        </Suspense>
      </CrossmintProvider>
    );
  }, [apiKey, children]);

  return memoizedProvider;
}
