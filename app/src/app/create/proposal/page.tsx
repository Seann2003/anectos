"use client";

import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useSendTransaction } from "@privy-io/react-auth/solana";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import SdgSelector from "@/components/sdg-selector";
import ImageUploader from "@/components/image-uploader";
import { supabase } from "@/lib/supabaseClient";

import { DateTimePicker } from "@/components/date-time-picker";
import { PublicKey, Transaction, Keypair } from "@solana/web3.js";
import { CONNECTION, umi } from "@/lib/constants";
import { createProjectIx, initializeFundingRoundIx } from "@/lib/instructions";
import {
  projectPdaFromOwner,
  projectMetadataPda,
  fundingRoundMetadataPda,
} from "@/lib/pda";
import { toSdgEnum } from "@/lib/helpers";

export default function BusinessDashboardPage() {
  const { user, authenticated, signTransaction } = usePrivy();
  const { sendTransaction } = useSendTransaction();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [selectedGoals, setSelectedGoals] = useState<number[]>([]);
  const [milestoneCount, setMilestoneCount] = useState("");
  const [imageMetadataUri, setImageMetadataUri] = useState<string | null>(null);
  const [nftMetadataUri, setNftMetadataUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [startAt, setStartAt] = useState<Date | null>(null);
  const [endAt, setEndAt] = useState<Date | null>(null);
  const [token, setToken] = useState<any>(null);

  const handleImageUploaded = (r: {
    cid: string;
    metadataUri: string;
    gatewayUrl: string;
  }) => {
    setImageMetadataUri(r.metadataUri);
  };

  const handleNFTImageUploaded = (r: {
    cid: string;
    metadataUri: string;
    gatewayUrl: string;
  }) => {
    setNftMetadataUri(r.metadataUri);
  };

  const handleImageError = (msg: string) => {
    setImageMetadataUri(null);
  };

  console.log("Submitting proposal for user:", user);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!authenticated || !user || !user.wallet?.address) {
      setError(
        "You must be logged in with a Privy Solana wallet to submit a proposal."
      );
      return;
    }

    if (
      !title.trim() ||
      !description.trim() ||
      !targetAmount.trim() ||
      selectedGoals.length === 0 ||
      !startAt ||
      !endAt
    ) {
      setError(
        "Please fill in title, description, target amount, SDG goals, start and end time."
      );
      return;
    }

    const amount = Number(targetAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      setError("Target amount must be a positive number.");
      return;
    }

    const mCount = Number(milestoneCount);
    if (!Number.isInteger(mCount) || mCount < 1 || mCount > 4) {
      setError("Milestone count must be an integer between 1 and 4.");
      return;
    }

    if (startAt.getTime() >= endAt.getTime()) {
      setError("Start time must be before end time.");
      return;
    }

    setSubmitting(true);
    try {
      const insertPayload = {
        owner_privy_user_id: user.id,
        wallet_address: user.wallet.address,
        title: title.trim(),
        description: description.trim(),
        target_amount: amount,
        sdg_goals: selectedGoals,
        milestone_count: mCount,
        image_metadata_uri: imageMetadataUri,
        nft_metadata_uri: nftMetadataUri,
        start_time: Math.floor(startAt.getTime() / 1000),
        end_time: Math.floor(endAt.getTime() / 1000),
      } as const;

      let proposal: { id: number } | null = null;
      try {
        const { data, error } = await supabase
          .from("proposals")
          .insert(insertPayload as any)
          .select("id")
          .single();
        if (error) throw error;
        proposal = data as any;
      } catch (dbErr: any) {
        throw new Error(
          dbErr?.message || "Failed to save proposal to Supabase"
        );
      }

      const body: Record<string, any> = {};
      body.cid = "bafkreigcjffzx7ob3ryjfx24klabgndzdl3shdo7wug5nhugbvzjrcw7hy";
      body.name = "Anectos";
      body.symbol = "ACTS";
      body.decimals = Number(9);
      body.initialSupply = "100";

      const r = await fetch("/api/create-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const tokenResult = await r.json();
      setToken(tokenResult.mint);

      const ownerAddr = insertPayload.wallet_address;
      if (ownerAddr) {
        try {
          const ownerPk = new PublicKey(ownerAddr);
          // Create a new round (no seeds) and its metadata PDA
          const roundKp = Keypair.generate();
          const roundPk = roundKp.publicKey;

          const [roundMetaPda] = fundingRoundMetadataPda(roundPk);
          const [projectPk] = projectPdaFromOwner(ownerPk);
          const [projectMetaPk] = projectMetadataPda(projectPk);

          const sdgGoals = selectedGoals
            .map((n) => toSdgEnum(n))
            .filter(Boolean) as any[];

          const roundIx = await initializeFundingRoundIx({
            owner: ownerPk,
            fundingRound: roundPk,
            fundingRoundMetadataPda: roundMetaPda,
            matchingPool: 0, // can be funded later
            startTime: insertPayload.start_time,
            endTime: insertPayload.end_time,
            nftMetadataUri: nftMetadataUri || "",
          });

          const projectIx = await createProjectIx({
            owner: ownerPk,
            projectPda: projectPk,
            projectMetadataPda: projectMetaPk,
            title: title.trim(),
            description: description.trim(),
            round: roundPk,
            targetAmount: amount,
            milestoneCount: mCount,
            sdgGoals,
            projectImageMetadataUri: imageMetadataUri || "",
          });
          const tx = new Transaction().add(roundIx, projectIx);

          tx.feePayer = ownerPk;

          const { blockhash } = await CONNECTION.getLatestBlockhash();
          tx.recentBlockhash = blockhash;
          tx.partialSign(roundKp);

          const receipt = await sendTransaction({
            transaction: tx,
            connection: CONNECTION,
            address: ownerAddr,
          });

          const { error } = await supabase.from("projects").insert({
            project_id: projectPk.toBase58(),
            proposal_id: proposal?.id,
            title: title.trim(),
            description: description.trim(),
            wallet_address: ownerAddr,
            target_amount: amount.toString(),
            milestone_count: mCount,
            sdg_goals: sdgGoals.map(Number),
            image_uri: imageMetadataUri || "",
            round_id: roundPk.toBase58(),
            created_at: new Date().toISOString(),
          });

          if (error) {
            console.log("Failed to save project to Supabase:", error);
          }

          const sig = receipt.signature;
          setSuccess(
            proposal?.id
              ? `Proposal saved (ID: ${proposal.id}). On-chain tx: ${sig}`
              : `Proposal saved. On-chain tx: ${sig}`
          );
        } catch (chainErr: any) {
          setSuccess((prev) =>
            prev
              ? prev + " (Chain error captured)"
              : "Proposal saved. (Chain step failed)"
          );
          console.error("createProject on-chain error:", chainErr);
        }
      } else {
        setSuccess(
          proposal?.id
            ? `Proposal saved (ID: ${proposal.id}). On-chain creation skipped (missing wallet).`
            : `Proposal saved. On-chain creation skipped (missing wallet).`
        );
      }

      // Reset form
      setTitle("");
      setDescription("");
      setTargetAmount("");
      setSelectedGoals([]);
      setImageMetadataUri(null);
      setNftMetadataUri(null);
      setStartAt(null);
      setEndAt(null);
    } catch (err: any) {
      setError(err?.message || "Failed to submit proposal. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow p-6 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Submit a Project Proposal</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 text-red-700 px-4 py-2">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-md border border-green-200 bg-green-50 text-green-700 px-4 py-2">
              {success}
              {token && (
                <p className="text-sm text-green-600">Token: {token}</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Project title"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your project, impact, and plan..."
              rows={6}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Amount (SOL)
            </label>
            <input
              type="number"
              min="1"
              step="0.01"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              placeholder="e.g. 50000"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Relevant SDG Goals
          </label>
          <SdgSelector selected={selectedGoals} onChange={setSelectedGoals} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DateTimePicker
              label="Start"
              value={startAt}
              onChange={setStartAt}
            />
            <DateTimePicker label="End" value={endAt} onChange={setEndAt} />
          </div>

          <label className="block text-sm font-medium text-gray-700 mb-1">
            Milestone Count
          </label>
          <input
            type="number"
            min="1"
            max="4"
            value={milestoneCount}
            onChange={(e) => setMilestoneCount(e.target.value)}
            placeholder="Set the number of milestones (1-4). The system will automatically create milestone funds based on your number!"
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          <ImageUploader
            label="Project Image"
            onUploaded={handleImageUploaded}
            onError={handleImageError}
          />

          <ImageUploader
            label="NFT Image"
            onUploaded={handleNFTImageUploaded}
            onError={handleImageError}
          />

          <div className="pt-2">
            <Button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                </span>
              ) : (
                "Submit Proposal"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
