"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ProfilePage() {
  const { authenticated, user, ready } = usePrivy();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string>("");

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
        .select("name")
        .eq("privy_user_id", user.id)
        .maybeSingle();

      if (!error && data?.name) setUsername(data.name);
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Profile</h1>
        <div className="space-y-2 text-gray-800">
          <p>
            <span className="font-medium">Username:</span> {username || "—"}
          </p>
          <p>
            <span className="font-medium">Email:</span> {user?.email?.address}
          </p>
          {user?.wallet?.address && (
            <p>
              <span className="font-medium">Wallet:</span> {user.wallet.address}
            </p>
          )}
        </div>
        <div className="mt-6">
          <Link
            href="/profile/edit"
            className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded"
          >
            Edit Username
          </Link>
        </div>
      </div>
    </div>
  );
}
