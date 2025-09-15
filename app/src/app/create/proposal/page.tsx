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
import { CONNECTION } from "@/lib/constants";
import { createProjectIx, initializeFundingRoundIx } from "@/lib/instructions";
import {
  projectPdaFromOwner,
  projectMetadataPda,
  fundingRoundMetadataPda,
} from "@/lib/pda";

export default function BusinessDashboardPage() {
  const { user, authenticated } = usePrivy();
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

    if (!authenticated && !user) {
      setError("You must be logged in to submit a proposal.");
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
        wallet_address: user.wallet?.address ?? null,
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

      // 1) Persist proposal to Supabase first
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

      // 2) Try to submit on-chain: initialize funding round, then create project (best-effort)
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

          // Map SDG numeric ids to enum-like objects that Anchor expects
          const sdgGoals = selectedGoals
            .map((n) => toSdgEnum(n))
            .filter(Boolean) as any[];

          // Build round initialization instruction from form times and NFT metadata
          const roundIx = await initializeFundingRoundIx({
            owner: ownerPk,
            fundingRound: roundPk,
            fundingRoundMetadataPda: roundMetaPda,
            matchingPool: 0, // can be funded later
            startTime: insertPayload.start_time,
            endTime: insertPayload.end_time,
            nftMetadataUri: nftMetadataUri || "",
          });

          // Build project creation instruction linked to the new round
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
          // round account must sign because it's being initialized
          tx.partialSign(roundKp);

          // Use Privy's embedded wallet to send the transaction
          const receipt = await sendTransaction({
            transaction: tx,
            connection: CONNECTION,
            // optionally: transactionOptions: { skipPreflight: false },
            address: ownerAddr,
          });

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

  // Map numeric SDG goal id (1-17) to Anchor enum object expected by the program
  function toSdgEnum(n: number): any | null {
    switch (n) {
      case 1:
        return { noPoverty: {} };
      case 2:
        return { zeroHunger: {} };
      case 3:
        return { goodHealthAndWellBeing: {} };
      case 4:
        return { qualityEducation: {} };
      case 5:
        return { genderEquality: {} };
      case 6:
        return { cleanWaterAndSanitation: {} };
      case 7:
        return { affordableAndCleanEnergy: {} };
      case 8:
        return { decentWorkAndEconomicGrowth: {} };
      case 9:
        return { industryInnovationAndInfrastructure: {} };
      case 10:
        return { reducedInequalities: {} };
      case 11:
        return { sustainableCitiesAndCommunities: {} };
      case 12:
        return { responsibleConsumptionAndProduction: {} };
      case 13:
        return { climateAction: {} };
      case 14:
        return { lifeBelowWater: {} };
      case 15:
        return { lifeOnLand: {} };
      case 16:
        return { peaceJusticeAndStrongInstitutions: {} };
      case 17:
        return { partnershipsForTheGoals: {} };
      default:
        return null;
    }
  }

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
              Target Amount (USD)
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
            placeholder="Set the number of milestones (1-4)"
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
