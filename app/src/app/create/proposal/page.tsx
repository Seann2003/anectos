"use client";

import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import SdgSelector from "@/components/sdg-selector";
import ImageUploader from "@/components/image-uploader";

export default function BusinessDashboardPage() {
  const { user, authenticated } = usePrivy();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [selectedGoals, setSelectedGoals] = useState<number[]>([]);
  const [imageMetadataUri, setImageMetadataUri] = useState<string | null>(null);
  const [nftMetadataUri, setNftMetadataUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!authenticated || !user) {
      setError("You must be logged in to submit a proposal.");
      return;
    }

    if (
      !title.trim() ||
      !description.trim() ||
      !targetAmount.trim() ||
      selectedGoals.length === 0
    ) {
      setError(
        "Please fill in title, description, target amount, and select at least one SDG goal."
      );
      return;
    }

    const amount = Number(targetAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      setError("Target amount must be a positive number.");
      return;
    }

    setSubmitting(true);
    try {
      const insertPayload = {
        owner_privy_user_id: user.id,
        title: title.trim(),
        description: description.trim(),
        target_amount: amount,
        sdg_goals: selectedGoals,
        image_metadata_uri: imageMetadataUri,
        nft_metadata_uri: nftMetadataUri,
      } as const;

      setSuccess("Proposal submitted successfully.");
      // Reset form
      setTitle("");
      setDescription("");
      setTargetAmount("");
      setSelectedGoals([]);
      setImageMetadataUri(null);
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

          <SdgSelector selected={selectedGoals} onChange={setSelectedGoals} />

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
