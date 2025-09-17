"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Mail, Wallet, Building2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CONNECTION } from "@/lib/constants";
import { PublicKey } from "@solana/web3.js";

export default function ProfilePage() {
  const { authenticated, user, ready, getAccessToken } = usePrivy();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string>("");
  const [company, setCompany] = useState<string>("");
  const [role, setRole] = useState<0 | 1 | 2 | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [balance, setBalance] = useState<string>("-");

  useEffect(() => {
    if (!ready) return;
    if (!authenticated || !user) {
      router.replace("/signup");
      return;
    }

    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("profiles")
        .select("name, company, user_role")
        .eq("privy_user_id", user.id)
        .maybeSingle();

      if (data?.name) setUsername(data.name);
      if (data?.company) setCompany(data.company);
      if (typeof data?.user_role === "number")
        setRole(data.user_role as 0 | 1 | 2);
      setLoading(false);
    };

    load();
  }, [ready, authenticated, user, router]);

  const fetchBalance = async () => {
    try {
      if (!user?.wallet?.address) return setBalance("-");
      const lamports = await CONNECTION.getBalance(
        new PublicKey(user.wallet.address)
      );
      setBalance((lamports / 1e9).toFixed(4));
    } catch {
      setBalance("-");
    }
  };

  if (!ready || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  const displayRole =
    role === 1 ? "Business Owner" : role === 2 ? "Admin" : "User";
  const initial = (username || user?.email?.address || "U")
    .charAt(0)
    .toUpperCase();
  const formatAddress = (addr?: string) =>
    addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "—";

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="relative h-[340px] w-full [perspective:1000px]">
          <div
            className={`absolute inset-0 w-full h-full transition-transform duration-700 [transform-style:preserve-3d] ${
              flipped ? "[transform:rotateY(180deg)]" : ""
            }`}
          >
            <div className="absolute inset-0 w-full h-full rounded-2xl border border-[#bfcfd6]  shadow-2xl flex flex-col justify-between p-6 [backface-visibility:hidden]">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-white/80 flex items-center justify-center text-2xl font-bold text-[#0097a7] border-2 border-white shadow">
                    {initial}
                  </div>
                  <div>
                    <h1 className="text-xl font-extrabold text-[#0097a7]">
                      {username || "—"}
                    </h1>
                    <span className="rounded-full border border-[#0097a7]/30 bg-[#0097a7]/10 px-2 py-0.5 text-xs font-semibold text-[#0097a7]">
                      {displayRole}
                    </span>
                  </div>
                </div>
              </div>
              {company && (
                <div className="mt-2 flex items-center gap-2 text-[#0097a7]/80">
                  <Building2 className="h-4 w-4" />
                  <span className="text-sm">{company}</span>
                </div>
              )}
              <div className="mt-4 grid grid-cols-1 gap-2">
                <div className="flex items-center gap-2 rounded-lg border border-[#0097a7]/20 bg-[#0097a7]/10 px-2 py-1">
                  <Mail className="h-4 w-4 text-[#0097a7]" />
                  <span className="text-sm text-[#0097a7]">
                    {user?.email?.address || "—"}
                  </span>
                </div>
                {user?.wallet?.address && (
                  <div className="flex items-center gap-2 rounded-lg border border-[#0097a7]/20 bg-[#0097a7]/10 px-2 py-1">
                    <Wallet className="h-4 w-4 text-[#0097a7]" />
                    <span className="text-sm text-[#0097a7]">
                      {user.wallet.address}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center mt-6">
                <Link
                  href="/profile/edit"
                  className="inline-flex items-center justify-center rounded-lg bg-[#0097a7] px-4 py-2 text-white font-semibold shadow hover:bg-[#00bcd4]"
                >
                  Edit Profile
                </Link>
                <Button
                  type="button"
                  variant="outline"
                  className="border-[#0097a7] text-[#0097a7] hover:bg-[#0097a7]/10"
                  onClick={() => {
                    setFlipped(true);
                    fetchBalance();
                  }}
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Wallet Balance
                </Button>
              </div>
            </div>

            {/* Back Side: Wallet balance (Amex style) */}
            <div className="absolute inset-0 w-full h-full rounded-2xl border border-[#bfcfd6] bg-gradient-to-br from-[#00bcd4] via-[#0097a7] to-[#e0e7ef] shadow-2xl flex flex-col justify-center items-center p-6 [transform:rotateY(180deg)] [backface-visibility:hidden]">
              <div className="flex flex-col items-center gap-4">
                <Wallet className="h-10 w-10 text-white" />
                <div className="text-3xl font-bold text-white">
                  {balance} SOL
                </div>
                <div className="text-sm text-white/80">
                  {user?.wallet?.address
                    ? formatAddress(user.wallet.address)
                    : "No wallet"}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10 mt-4"
                  onClick={() => setFlipped(false)}
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Back to Profile
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
