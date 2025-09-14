"use client";

import { useEffect } from "react";
import { useWallet, useAuth } from "@crossmint/client-sdk-react-ui";
import { useRouter } from "next/navigation";
import { useProfile } from "@/hooks/useProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ProfilePage() {
  const { user } = useAuth();
  const { wallet } = useWallet();
  const walletAddress = wallet?.address;
  const router = useRouter();
  const { profile, loading, ensureProfileExists } = useProfile(walletAddress);

  useEffect(() => {
    async function guard() {
      if (!user || !walletAddress) return;
      const { exists } = await ensureProfileExists();
      if (!exists) router.replace("/signup");
    }
    guard();
  }, [user, walletAddress, ensureProfileExists, router]);

  if (!user || !walletAddress)
    return <div className="p-6">Log in and connect your wallet.</div>;
  if (loading) return <div className="p-6">Loading profile...</div>;

  return (
    <div className="container mx-auto px-4 py-10">
      <Card className="max-w-xl mx-auto">
        <CardHeader>
          <CardTitle>Your Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="text-sm text-gray-500">Wallet</div>
            <div className="font-mono text-sm">{walletAddress}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Name</div>
            <div>{profile?.name ?? "-"}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Email</div>
            <div>{profile?.email ?? "-"}</div>
          </div>
          <Link href="/profile/edit">
            <Button variant="outline">Edit Profile</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
