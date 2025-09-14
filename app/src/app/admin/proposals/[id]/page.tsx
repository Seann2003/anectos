"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWallet, useAuth } from "@crossmint/client-sdk-react-ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useProposals, type ProposalRow } from "@/hooks/useProposals";
import { useUserRole } from "@/hooks/useUserRole";

export default function AdminProposalDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const router = useRouter();
  const { user } = useAuth();
  const { wallet } = useWallet();
  const { isAdmin } = useUserRole();
  const { getProposal, approveProposal, rejectProposal } = useProposals();
  const [p, setP] = useState<ProposalRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user || !wallet?.address || !isAdmin || !id) return;
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const data = await getProposal(id);
        if (active) setP(data);
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
  }, [user, wallet?.address, isAdmin, id, getProposal]);

  const onApprove = async () => {
    if (!wallet?.address || !id) return;
    setSaving(true);
    try {
      await approveProposal(id, wallet.address, note);
      router.replace("/admin/proposals");
    } catch (e) {
      console.error(e);
      alert("Failed to approve");
    } finally {
      setSaving(false);
    }
  };
  const onReject = async () => {
    if (!wallet?.address || !id) return;
    setSaving(true);
    try {
      await rejectProposal(id, wallet.address, note);
      router.replace("/admin/proposals");
    } catch (e) {
      console.error(e);
      alert("Failed to reject");
    } finally {
      setSaving(false);
    }
  };

  if (!user || !wallet?.address)
    return <div className="p-6">Log in and connect your wallet.</div>;
  if (!isAdmin) return <div className="p-6">You do not have admin access.</div>;
  if (loading) return <div className="p-6">Loading...</div>;
  if (!p) return <div className="p-6">Proposal not found.</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Review Proposal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-gray-600">Owner: {p.owner_wallet}</div>
          <div className="text-sm text-gray-600">
            Project ID: {p.project_id}
          </div>
          <div className="text-sm text-gray-600">Title: {p.title}</div>
          <div className="text-sm text-gray-600">
            Category: {p.category} | Area: {p.area}
          </div>
          <div className="text-sm text-gray-600">
            Funding Goal: {p.funding_goal} SOL
          </div>
          <div className="text-sm text-gray-600">
            Deadline: {new Date(p.funding_deadline).toLocaleDateString()}
          </div>
          <div className="prose max-w-none border rounded p-3">
            {p.description}
          </div>
          {p.image_url && (
            <img src={p.image_url} alt="proposal" className="rounded border" />
          )}
          <div>
            <label className="block text-sm mb-1">Review note</label>
            <Textarea
              rows={5}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={onApprove} disabled={saving}>
              Approve
            </Button>
            <Button variant="destructive" onClick={onReject} disabled={saving}>
              Reject
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
