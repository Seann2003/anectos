"use client";

import { useEffect, useState } from "react";
import { useWallet, useAuth } from "@crossmint/client-sdk-react-ui";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProposals, type ProposalRow } from "@/hooks/useProposals";
import { useUserRole } from "@/hooks/useUserRole";

export default function AdminProposalsListPage() {
  const { user } = useAuth();
  const { wallet } = useWallet();
  const { isAdmin } = useUserRole();
  const { listAllProposals } = useProposals();
  const [items, setItems] = useState<ProposalRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !wallet?.address || !isAdmin) return;
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const data = await listAllProposals();
        if (active) setItems(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [user, wallet?.address, isAdmin, listAllProposals]);

  if (!user || !wallet?.address)
    return <div className="p-6">Log in and connect your wallet.</div>;
  if (!isAdmin) return <div className="p-6">You do not have admin access.</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">All Proposals</h1>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : items.length === 0 ? (
        <div>No proposals.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((p) => (
            <Card key={p.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{p.title}</span>
                  <span className="text-sm px-2 py-1 rounded border">
                    {p.status}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm text-gray-600">
                  Owner: {p.owner_wallet}
                </div>
                <div className="text-sm text-gray-600">
                  Project ID: {p.project_id}
                </div>
                <div className="text-sm text-gray-600">
                  Funding Goal: {p.funding_goal} SOL
                </div>
                <Link href={`/admin/proposals/${p.id}`}>
                  <Button variant="outline">Review</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
