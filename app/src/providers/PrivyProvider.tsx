"use client";

import { PrivyProvider, usePrivy } from "@privy-io/react-auth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

function AuthRedirectHandler() {
  const router = useRouter();
  const pathname = usePathname();
  const { authenticated, ready, user } = usePrivy();
  const checkingRef = useRef(false);

  useEffect(() => {
    if (!ready) return;
    if (!authenticated || !user) {
      document.cookie = `anectos_uid=; Path=/; Max-Age=0; SameSite=Lax`;
      document.cookie = `anectos_role=; Path=/; Max-Age=0; SameSite=Lax`;
      return;
    }
    if (checkingRef.current) return;

    const run = async () => {
      checkingRef.current = true;
      try {
        document.cookie = `anectos_uid=${user.id}; Path=/; Max-Age=${
          60 * 60 * 24 * 30
        }; SameSite=Lax`;

        const { data, error } = await supabase
          .from("profiles")
          .select("id, user_role")
          .eq("privy_user_id", user.id)
          .maybeSingle();

        if (error) {
          console.warn("Supabase redirect check error:", error);
        }

        const role = (data?.user_role ?? 0) as number;
        document.cookie = `anectos_role=${role}; Path=/; Max-Age=${
          60 * 60 * 24 * 30
        }; SameSite=Lax`;

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
