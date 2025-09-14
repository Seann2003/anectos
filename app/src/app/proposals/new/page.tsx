"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet, useAuth } from "@crossmint/client-sdk-react-ui";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProposals } from "@/hooks/useProposals";

export default function NewProposalPage() {
  const { user } = useAuth();
  const { wallet } = useWallet();
  const router = useRouter();
  const { createProposal } = useProposals();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [category, setCategory] = useState("General");
  const [area, setArea] = useState("General");
  const [fundingGoal, setFundingGoal] = useState<number>(10);
  const [fundingDeadline, setFundingDeadline] = useState<string>("");
  const [fundingRoundSeed, setFundingRoundSeed] =
    useState<string>("default-round");
  const [projectId, setProjectId] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !wallet?.address)
      return alert("Please log in and connect wallet");
    if (!projectId) return alert("Please provide a unique project ID");
    if (!fundingDeadline) return alert("Please select a funding deadline");
    setSaving(true);
    try {
      const proposal = await createProposal({
        owner_wallet: wallet.address,
        project_id: projectId,
        area,
        title,
        description,
        image_url: imageUrl,
        category,
        funding_goal: fundingGoal,
        funding_deadline: new Date(fundingDeadline).toISOString(),
        funding_round_seed: fundingRoundSeed,
      } as any);
      router.replace(`/proposals`);
    } catch (e) {
      console.error(e);
      alert("Failed to submit proposal");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Submit a Project Proposal</CardTitle>
        </CardHeader>
        <CardContent>
          {!user || !wallet?.address ? (
            <p className="text-sm text-gray-600">
              Log in and connect your wallet first.
            </p>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">
                  Project ID (unique)
                </label>
                <Input
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Description</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={8}
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Image URL</label>
                <Input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Category</label>
                <Input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Area</label>
                <Input value={area} onChange={(e) => setArea(e.target.value)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">
                    Funding Goal (SOL)
                  </label>
                  <Input
                    type="number"
                    value={fundingGoal}
                    onChange={(e) => setFundingGoal(parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Funding Deadline</label>
                  <Input
                    type="date"
                    value={fundingDeadline}
                    onChange={(e) => setFundingDeadline(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">
                    Funding Round Seed
                  </label>
                  <Input
                    value={fundingRoundSeed}
                    onChange={(e) => setFundingRoundSeed(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Owner Wallet</label>
                  <Input value={wallet.address} readOnly />
                </div>
              </div>
              <Button type="submit" disabled={saving}>
                {saving ? "Submitting..." : "Submit Proposal"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
