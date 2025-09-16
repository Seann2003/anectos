"use client";

import React, { useCallback, useState } from "react";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  generateSigner,
  percentAmount,
  signerIdentity,
  publicKey,
} from "@metaplex-foundation/umi";
import {
  mplTokenMetadata,
  createProgrammableNft,
} from "@metaplex-foundation/mpl-token-metadata";
import { base58 } from "@metaplex-foundation/umi/serializers";
import { DEVNET_RPC } from "../../lib/constants";

type UploadResponse = {
  ok: boolean;
  error?: string;
  metadataUri?: string;
  imageUri?: string;
  name?: string;
  description?: string;
};

type MintResult = {
  mint: string;
  signature: string;
  explorerTx: string;
  explorerMint: string;
};

// Helper to convert ArrayBuffer to base64 without Node Buffer.
function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(
      null,
      bytes.subarray(i, i + chunk) as unknown as number[]
    );
  }
  return typeof btoa !== "undefined" ? btoa(binary) : "";
}

export default function CreateNftPage() {
  const [name, setName] = useState("My NFT");
  const [description, setDescription] = useState("Programmable NFT");
  const [sellerFee, setSellerFee] = useState("5.5"); // percent
  const [image, setImage] = useState<File | null>(null);
  const [attributes, setAttributes] = useState<
    { trait: string; value: string }[]
  >([{ trait: "", value: "" }]);
  const [submitting, setSubmitting] = useState(false);
  const [uploadResp, setUploadResp] = useState<UploadResponse | null>(null);
  const [minting, setMinting] = useState(false);
  const [mintResult, setMintResult] = useState<MintResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onAttrChange(idx: number, key: "trait" | "value", val: string) {
    setAttributes((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [key]: val };
      return next;
    });
  }
  function addAttr() {
    setAttributes((p) => [...p, { trait: "", value: "" }]);
  }
  function removeAttr(i: number) {
    setAttributes((p) => p.filter((_, idx) => idx !== i));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setUploadResp(null);
    setMintResult(null);
    try {
      let imageBase64: string | undefined;
      let imageMime: string | undefined;
      if (image) {
        const arrayBuf = await image.arrayBuffer();
        imageBase64 = arrayBufferToBase64(arrayBuf);
        imageMime = image.type || "image/png";
      }
      const sellerFeeBps = Math.round(parseFloat(sellerFee || "0") * 100); // percent to bps
      const body = {
        name,
        description,
        imageBase64,
        imageMime,
        attributes: attributes
          .filter((a) => a.trait && a.value)
          .map((a) => ({ trait_type: a.trait, value: a.value })),
      };
      const r = await fetch("/api/upload-nft-metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = (await r.json()) as UploadResponse;
      if (!r.ok || !j.ok) throw new Error(j.error || `Status ${r.status}`);
      setUploadResp(j);
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setSubmitting(false);
    }
  }

  // Placeholder: in real integration, pull from Privy context
  const getUserPubkey = useCallback(async (): Promise<string> => {
    // TODO: Replace with Privy wallet public key (e.g., privy.solana.publicKey.toBase58())
    throw new Error(
      "Privy wallet integration not wired yet: replace getUserPubkey()"
    );
  }, []);

  async function onMint() {
    if (!uploadResp?.metadataUri) return;
    setMinting(true);
    setError(null);
    setMintResult(null);
    try {
      // Acquire user's public key (to be replaced with real Privy wallet)
      const userPkStr = await getUserPubkey();

      const umi = createUmi(DEVNET_RPC).use(mplTokenMetadata());

      // For now we do not have a true signer for the user (throws above). In real code,
      // you'd implement a Umi signer wrapper around the Privy provider.

      const mint = generateSigner(umi);

      // TEMP: Use mint as identity until Privy integration; this will not prompt user.
      // Replace with: umi.use(signerIdentity(privySigner)) once implemented.
      umi.use(signerIdentity(mint));

      const sellerFeePercent = parseFloat(sellerFee || "0");
      const b = createProgrammableNft(umi, {
        mint,
        name: name || "My NFT",
        uri: uploadResp.metadataUri,
        sellerFeeBasisPoints: percentAmount(sellerFeePercent),
        ruleSet: null,
        // authorities default to identity signer
      });

      const sent = await b.sendAndConfirm(umi);
      const signature = base58.deserialize(sent.signature)[0];
      const mintAddr = mint.publicKey.toString();
      const explorerTx = `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
      const explorerMint = `https://explorer.solana.com/address/${mintAddr}?cluster=devnet`;
      setMintResult({ mint: mintAddr, signature, explorerTx, explorerMint });
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setMinting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          Create Programmable NFT (Devnet)
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Upload (or use placeholder) image, metadata, then mint a pNFT via
          Metaplex Umi.
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            className="w-full border rounded px-3 py-2"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Seller Fee (%)
            </label>
            <input
              type="number"
              min={0}
              step={0.01}
              className="w-full border rounded px-3 py-2"
              value={sellerFee}
              onChange={(e) => setSellerFee(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files?.[0] || null)}
            />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium">Attributes</label>
            <button
              type="button"
              onClick={addAttr}
              className="text-xs px-2 py-1 bg-gray-200 rounded"
            >
              Add
            </button>
          </div>
          <div className="space-y-2">
            {attributes.map((a, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  placeholder="trait_type"
                  className="flex-1 border rounded px-2 py-1"
                  value={a.trait}
                  onChange={(e) => onAttrChange(i, "trait", e.target.value)}
                />
                <input
                  placeholder="value"
                  className="flex-1 border rounded px-2 py-1"
                  value={a.value}
                  onChange={(e) => onAttrChange(i, "value", e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => removeAttr(i)}
                  className="text-xs text-red-600"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {submitting ? "Uploading..." : "Upload Metadata"}
        </button>
      </form>

      {error && (
        <div className="border border-red-300 bg-red-50 rounded p-4 text-sm text-red-700">
          <strong>Error:</strong> {error}
        </div>
      )}

      {uploadResp && (
        <div className="border rounded p-4 text-sm space-y-2">
          <h2 className="font-semibold">Uploaded Metadata</h2>
          <div>
            <span className="font-medium">Metadata URI:</span>{" "}
            <code className="break-all">{uploadResp.metadataUri}</code>
          </div>
          <div>
            <span className="font-medium">Image URI:</span>{" "}
            <code className="break-all">{uploadResp.imageUri}</code>
          </div>
          <button
            onClick={onMint}
            disabled={minting}
            className="bg-indigo-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {minting ? "Minting pNFT..." : "Mint pNFT (Client Sign)"}
          </button>
        </div>
      )}

      {mintResult && (
        <div className="border rounded p-4 text-sm space-y-2">
          <h2 className="font-semibold">Mint Result</h2>
          <div>
            <span className="font-medium">Mint:</span>{" "}
            <code className="break-all">{mintResult.mint}</code>
          </div>
          <div>
            <span className="font-medium">Signature:</span>{" "}
            <code className="break-all">{mintResult.signature}</code>
          </div>
          <div>
            <span className="font-medium">Explorer (Tx):</span>{" "}
            <a
              href={mintResult.explorerTx}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              Open
            </a>
          </div>
          <div>
            <span className="font-medium">Explorer (Mint):</span>{" "}
            <a
              href={mintResult.explorerMint}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              Open
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
