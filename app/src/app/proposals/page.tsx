"use client";

import { useEffect, useMemo, useState } from "react";
import { useWallet, useAuth } from "@crossmint/client-sdk-react-ui";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProposals, type ProposalRow } from "@/hooks/useProposals";
// All client-side Solana integrations removed; proposals are DB-only.

export default function ProposalsListPage() {
  const { user } = useAuth();
  const { wallet } = useWallet();
  const { listMyProposals, markFinalized } = useProposals();
  const [items, setItems] = useState<ProposalRow[]>([]);
  const [loading, setLoading] = useState(false);
  // Finalization on-chain is disabled in the client; track nothing here.

  const canSee = !!(user && wallet?.address);

  useEffect(() => {
    if (!canSee) return;
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const data = await listMyProposals(wallet!.address!);
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
  }, [canSee, wallet?.address, listMyProposals]);

  if (!canSee)
    return <div className="p-6">Log in and connect your wallet.</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">My Proposals</h1>
        <Link href="/proposals/new">
          <Button>New Proposal</Button>
        </Link>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : items.length === 0 ? (
        <div>No proposals yet.</div>
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
                  Project ID: {p.project_id}
                </div>
                <div className="text-sm text-gray-600">
                  Category: {p.category}
                </div>
                <div className="text-sm text-gray-600">
                  Funding Goal: {p.funding_goal} SOL
                </div>
                <div className="text-sm text-gray-600">
                  Deadline: {new Date(p.funding_deadline).toLocaleDateString()}
                </div>
                {p.status === "approved" && (
                  <div className="text-sm text-amber-700">
                    Approved by admin. On-chain finalization is disabled.
                  </div>
                )}
                {p.status === "finalized" && (
                  <div className="text-sm text-green-700">Finalized.</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
