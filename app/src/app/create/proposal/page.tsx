"use client";

import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { ImagePlus, Loader2 } from "lucide-react";
import SdgSelector from "@/components/sdg-selector";

export default function BusinessDashboardPage() {
  const { user, authenticated } = usePrivy();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [selectedGoals, setSelectedGoals] = useState<number[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [metadataUri, setMetadataUri] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageGatewayUrl, setImageGatewayUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  // SDG selection is managed by reusable component

  const onImageChange = async (file: File | null) => {
    setImageFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setImagePreview(url);
      setUploadingImage(true);
      setUploadError(null);
      try {
        const fd = new FormData();
        fd.append("file", file);
        const response = await axios.post("/api/pinata/upload", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        console.log("Pinata upload response:", response);
      } catch (err: any) {
        setUploadError(err?.message || "Failed to upload to Pinata");
        setMetadataUri(null);
        setImageUri(null);
        setImageGatewayUrl(null);
      } finally {
        setUploadingImage(false);
      }
    } else {
      setImagePreview(null);
      setMetadataUri(null);
      setImageUri(null);
      setImageGatewayUrl(null);
    }
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
        image_metadata_uri: metadataUri, // ipfs://CID or null
      } as const;

      setSuccess("Proposal submitted successfully.");
      // Reset form
      setTitle("");
      setDescription("");
      setTargetAmount("");
      setSelectedGoals([]);
      setImageFile(null);
      setImagePreview(null);
      setMetadataUri(null);
      setImageUri(null);
      setImageGatewayUrl(null);
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Image
            </label>
            <div className="flex items-center gap-4">
              <label className="inline-flex items-center gap-2 cursor-pointer text-blue-700">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onImageChange(e.target.files?.[0] || null)}
                />
                <span className="inline-flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm hover:bg-blue-100">
                  <ImagePlus className="h-4 w-4" /> Upload image
                </span>
              </label>
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-16 w-16 object-cover rounded-md border"
                />
              )}
              {uploadingImage && (
                <span className="text-sm text-gray-600">
                  Uploading to Pinata...
                </span>
              )}
            </div>
            {metadataUri && (
              <div className="mt-2 text-xs text-gray-700 break-all">
                metadata_uri: {metadataUri}
              </div>
            )}
            {imageUri && (
              <div className="mt-1 text-xs text-gray-700 break-all">
                image_uri: {imageUri}
              </div>
            )}
            {imageGatewayUrl && (
              <div className="mt-1 text-xs text-gray-700 break-all">
                image_gateway:{" "}
                <a
                  className="underline"
                  href={imageGatewayUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {imageGatewayUrl}
                </a>
              </div>
            )}
            {uploadError && (
              <div className="mt-2 text-xs text-red-700">{uploadError}</div>
            )}
          </div>

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
