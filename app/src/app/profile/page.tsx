"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Mail, Wallet, Building2, IdCard } from "lucide-react";

export default function ProfilePage() {
  const { authenticated, user, ready } = usePrivy();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string>("");
  const [company, setCompany] = useState<string>("");
  const [role, setRole] = useState<0 | 1 | 2 | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!authenticated || !user) {
      router.replace("/signup");
      return;
    }

    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("name, company, user_role")
        .eq("privy_user_id", user.id)
        .maybeSingle();

      if (!error && data?.name) setUsername(data.name);
      if (data?.company) setCompany(data.company);
      if (typeof data?.user_role === "number")
        setRole(data.user_role as 0 | 1 | 2);
      setLoading(false);
    };

    load();
  }, [ready, authenticated, user, router]);

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
      <div className="w-full max-w-xl">
        <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-xl">
          <div className="h-28 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400" />
          <div className="px-6 pb-6 -mt-10">
            <div className="flex items-end gap-4">
              <div className="h-20 w-20 rounded-full border-4 border-white bg-blue-200 text-blue-800 flex items-center justify-center text-3xl font-bold shadow">
                {initial}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-extrabold text-black">
                    {username || "—"}
                  </h1>
                  <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    {displayRole}
                  </span>
                </div>
                {company && (
                  <div className="mt-1 flex items-center gap-2 text-blue-800/80">
                    <Building2 className="h-4 w-4" />
                    <span className="text-sm">{company}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3">
              <div className="flex items-center gap-3 rounded-lg border border-blue-100 bg-blue-50/50 px-3 py-2">
                <Mail className="h-4 w-4 text-blue-700" />
                <span className="text-sm text-blue-900">
                  {user?.email?.address || "—"}
                </span>
              </div>
              {user?.wallet?.address && (
                <div className="flex items-center gap-3 rounded-lg border border-blue-100 bg-blue-50/50 px-3 py-2">
                  <Wallet className="h-4 w-4 text-blue-700" />
                  <span className="text-sm text-blue-900">
                    {formatAddress(user.wallet.address)}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-6">
              <Link
                href="/profile/edit"
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-white font-semibold shadow hover:bg-blue-700"
              >
                Edit Profile
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
