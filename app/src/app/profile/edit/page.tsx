"use client";

import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";

export default function ProfileEditPage() {
  const { authenticated, user, ready } = usePrivy();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!authenticated || !user) {
      router.replace("/signup");
      return;
    }

    const load = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("name")
        .eq("privy_user_id", user.id)
        .maybeSingle();
      if (data?.name) setUsername(data.name);
      setLoading(false);
    };

    load();
  }, [ready, authenticated, user, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setSaving(true);

    // Upsert profile row keyed by privy_user_id
    const { error } = await supabase.from("profiles").upsert(
      {
        privy_user_id: user.id,
        name: username,
        email: user.email?.address ?? null,
        wallet_address: user.wallet?.address ?? null,
      },
      { onConflict: "privy_user_id" }
    );

    setSaving(false);
    if (!error) {
      router.replace("/profile");
    }
  };

  if (!ready || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow p-6 max-w-md">
        <h1 className="text-2xl font-bold mb-4">Edit Username</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={saving || !username.trim()}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </Button>
            <Button
              type="button"
              onClick={() => router.back()}
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
