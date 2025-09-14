"use client";

import { PrivyProvider, usePrivy } from "@privy-io/react-auth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function AuthRedirectHandler() {
  const router = useRouter();
  const pathname = usePathname();
  const { authenticated, ready, user } = usePrivy();
  const checkingRef = useRef(false);

  useEffect(() => {
    if (!ready) return;
    if (!authenticated || !user) return;
    if (checkingRef.current) return;

    const run = async () => {
      checkingRef.current = true;
      try {
        const { data, error } = await supabase
          .from("users")
          .select("id")
          .eq("privy_user_id", user.id)
          .maybeSingle();

        if (error) {
          console.warn("Supabase redirect check error:", error);
        }

        if (data) {
          if (pathname === "/signup") {
            router.replace("/profile");
          }
        }
      } finally {
        checkingRef.current = false;
      }
    };

    run();
  }, [ready, authenticated, user, router, pathname]);

  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        embeddedWallets: {
          solana: {
            createOnLogin: "users-without-wallets",
          },
        },
        appearance: {
          theme: "light",
          accentColor: "#3B82F6",
        },
      }}
    >
      <AuthRedirectHandler />
      {children}
    </PrivyProvider>
  );
}
