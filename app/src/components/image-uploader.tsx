"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import { create, mplCore } from "@metaplex-foundation/mpl-core";
import { usePrivy } from "@privy-io/react-auth";

import {
  generateSigner,
  keypairIdentity,
  signerIdentity,
  sol,
} from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { base58 } from "@metaplex-foundation/umi/serializers";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";

import fs from "fs";

type UploadResult = {
  cid: string;
  metadataUri: string;
  gatewayUrl: string;
};

export interface ImageUploaderProps {
  label?: string;
  onUploaded?: (result: UploadResult) => void;
  onError?: (message: string) => void;
  className?: string;
  setImage?: (file: File) => void;
  showDetails?: boolean;
}

export default function ImageUploader({
  label = "Upload Image",
  onUploaded,
  onError,
  className,
  showDetails = true,
}: ImageUploaderProps) {
  const { authenticated, user } = usePrivy();

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const onImageChange = async (file: File | null) => {
    setResult(null);
    setError(null);
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    if (!file) {
      setImagePreview(null);
      return;
    }

    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setImagePreview(url);

    try {
      setUploading(true);
      const fd = new FormData();
      fd.append("file", file, file.name);
      fd.append("name", file.name);

      const res = await fetch("/api/pinata/upload", {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (!res.ok) throw new Error((json && json.error) || res.statusText);

      const cid: string =
        typeof json === "string"
          ? json
          : json?.cid || json?.IpfsHash || json?.hash || json?.data?.cid;
      if (!cid) throw new Error("Missing CID in response");
      const metadataUri: string =
        (typeof json === "object" && json?.metadataUri) || `ipfs://${cid}`;
      const gatewayUrl =
        (typeof json === "object" && json?.gatewayUrl) ||
        `https://gateway.pinata.cloud/ipfs/${cid}`;

      const umi = createUmi(
        "https://devnet.helius-rpc.com/?api-key=3e441bb8-f92a-4d28-9468-8946faf092b0"
      ).use(mplCore());

      const metadata = JSON.stringify({
        pinataContent: {
          name: "My NFT",
          description: "This is an NFT on Solana",
          image: metadataUri,
        },
        pinataMetadata: {
          name: "metadata.json",
        },
      });

      const wallet = await fetch("/api/get-wallet", {
        method: "GET",
      });
      const walletJson = await wallet.json();

      umi.use(walletAdapterIdentity(walletJson.publicKey));

      const apiKey = "47f4a0b82f6d86de919a";

      const secret =
        "b33f267b4bab775d2ca7299f6d59d4b52cf6620d94aab26cbb7cba073a8a439f";

      const url = "https://api.pinata.cloud/pinning/pinJSONToIPFS";
      const options = {
        method: "POST",
        headers: {
          pinata_api_key: apiKey,
          pinata_secret_api_key: secret,
          "Content-Type": "application/json",
        },
        body: metadata,
      };

      try {
        const response = await fetch(url, options);
        const data = await response.json();
        console.log("data", data);
        console.log("Pinata JSON upload response:", data);
        console.log("Creating NFT...");
        const asset = generateSigner(umi);
        const tx = await create(umi, {
          asset,
          name: "My NFT",
          uri: `ipfs://${data.IpfsHash}`,
        }).sendAndConfirm(umi);
        console.log("tx: " + tx);
        const signature = base58.deserialize(tx.signature)[0];
        console.log(signature);

        console.log("\nNFT Created");
        console.log("View Transaction on Solana Explorer");

        const uploadResult: UploadResult = { cid, metadataUri, gatewayUrl };
        setResult(uploadResult);
        onUploaded?.(uploadResult);
        console.log(data);
      } catch (error) {
        console.error(error);
      }
    } catch (e: any) {
      const msg = e?.message || "Failed to upload to Pinata";
      setError(msg);
      onError?.(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
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
        {uploading && (
          <span className="text-sm text-gray-600">Uploading to Pinata...</span>
        )}
      </div>
      {showDetails && (
        <>
          {result?.cid && (
            <div className="mt-2 text-xs text-gray-700 break-all">
              image link:{" "}
              <a
                href={`https://ipfs.io/ipfs/${result.cid}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-700 underline hover:text-blue-900"
              >
                {`https://ipfs.io/ipfs/${result.cid}`}
              </a>
            </div>
          )}
          {error && <div className="mt-2 text-xs text-red-700">{error}</div>}
        </>
      )}
    </div>
  );
}
