"use client";

import {
  CrossmintProvider,
  CrossmintAuthProvider,
  CrossmintWalletProvider,
} from "@crossmint/client-sdk-react-ui";

export function CrossmintProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  const apiKey = process.env.NEXT_PUBLIC_CROSSMINT_CLIENT_API_KEY;

  if (!apiKey) {
    console.error(
      "Missing NEXT_PUBLIC_CROSSMINT_CLIENT_API_KEY environment variable"
    );
    return <div>Missing Crossmint API Key configuration</div>;
  }

  return (
    <CrossmintProvider apiKey={apiKey}>
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
    </CrossmintProvider>
  );
}
