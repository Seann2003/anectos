"use client";

import { useEffect, useState } from "react";
import { useWallet, useAuth } from "@crossmint/client-sdk-react-ui";
import { useRouter } from "next/navigation";
import { useProfile } from "@/hooks/useProfile";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EditProfilePage() {
  const { user } = useAuth();
  const { wallet } = useWallet();
  const walletAddress = wallet?.address;
  const router = useRouter();
  const { profile, upsertProfile, ensureProfileExists } =
    useProfile(walletAddress);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? "");
      setEmail(profile.email ?? "");
    }
  }, [profile]);

  useEffect(() => {
    async function guard() {
      if (!user || !walletAddress) return;
      const { exists } = await ensureProfileExists();
      if (!exists) router.replace("/signup");
    }
    guard();
  }, [user, walletAddress, ensureProfileExists, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await upsertProfile({ name, email });
      router.replace("/profile");
    } catch (e) {
      console.error(e);
      alert("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Edit profile</CardTitle>
        </CardHeader>
        <CardContent>
          {!user || !walletAddress ? (
            <p className="text-sm text-gray-600">
              Log in and connect your wallet first.
            </p>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Wallet</label>
                <Input value={walletAddress} readOnly />
              </div>
              <div>
                <label className="block text-sm mb-1">Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
