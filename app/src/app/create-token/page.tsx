"use client";

import React, { useMemo, useState } from "react";

type CreateTokenResponse = {
  ok: boolean;
  error?: string;
  mint?: string;
  metadata?: string;
  name?: string;
  symbol?: string;
  uri?: string;
  decimals?: number;
  authority?: string;
  airdropSig?: string;
  metadataSig?: any;
  ata?: string | null;
  mintSig?: string | null;
};

export default function CreateTokenPage() {
  const [cid, setCid] = useState("");
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [decimals, setDecimals] = useState<string>("9");
  const [initialSupplyUi, setInitialSupplyUi] = useState<string>("0");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CreateTokenResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initialSupplyBaseUnits = useMemo(() => {
    const d = Number.isFinite(Number(decimals)) ? Number(decimals) : 9;
    const ui = initialSupplyUi.trim();
    if (!ui) return "0";
    // Convert a UI number string to base units by shifting decimal point `d` places.
    // Accepts integers or decimals like "123.45".
    const neg = ui.startsWith("-");
    const clean = (neg ? ui.slice(1) : ui).replace(/_/g, "");
    if (!/^\d*(?:\.\d*)?$/.test(clean)) return "0";
    const [intPart, fracPartRaw] = clean.split(".");
    const fracPart = (fracPartRaw || "").padEnd(d, "0").slice(0, d);
    const joined = `${intPart || "0"}${fracPart}`.replace(/^0+(?=\d)/, "");
    const base = joined.length ? joined : "0";
    return (neg ? "-" : "") + base;
  }, [initialSupplyUi, decimals]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const body: Record<string, any> = {};
      if (cid.trim()) body.cid = cid.trim();
      if (name.trim()) body.name = name.trim();
      if (symbol.trim()) body.symbol = symbol.trim();
      if (decimals.trim()) body.decimals = Number(decimals.trim());
      if (initialSupplyBaseUnits && initialSupplyBaseUnits !== "0")
        body.initialSupply = initialSupplyBaseUnits; // send as string

      const r = await fetch("/api/create-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = (await r.json()) as CreateTokenResponse;
      if (!r.ok || !j.ok) {
        throw new Error(j.error || `Request failed (${r.status})`);
      }
      setResult(j);
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold mb-4">
        Create SPL Token (Localnet)
      </h1>
      <p className="text-sm text-gray-600 mb-6">
        This form calls{" "}
        <code className="px-1 py-0.5 bg-gray-100 rounded">
          /api/create-token
        </code>{" "}
        to create a new mint and set Metaplex metadata. Defaults: decimals 9,
        zero initial supply.
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            IPFS CID (metadata JSON)
          </label>
          <input
            className="w-full rounded border px-3 py-2"
            type="text"
            placeholder="bafkrei..."
            value={cid}
            onChange={(e) => setCid(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">
            If empty, a sample CID will be used.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              className="w-full rounded border px-3 py-2"
              type="text"
              placeholder="Anectos Token"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Symbol</label>
            <input
              className="w-full rounded border px-3 py-2"
              type="text"
              placeholder="ANECT"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Decimals</label>
            <input
              className="w-full rounded border px-3 py-2"
              type="number"
              min={0}
              max={12}
              value={decimals}
              onChange={(e) => setDecimals(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Initial Supply (UI units)
            </label>
            <input
              className="w-full rounded border px-3 py-2"
              type="text"
              placeholder="0"
              value={initialSupplyUi}
              onChange={(e) => setInitialSupplyUi(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              Sent as base units:{" "}
              <span className="font-mono">{initialSupplyBaseUnits}</span>
            </p>
          </div>
        </div>

        <button
          type="submit"
          className="rounded bg-black text-white px-4 py-2 disabled:opacity-50"
          disabled={submitting}
        >
          {submitting ? "Creating..." : "Create Token"}
        </button>
      </form>

      {error && (
        <div className="mt-6 rounded border border-red-300 bg-red-50 p-4 text-red-700">
          <div className="font-semibold mb-1">Error</div>
          <pre className="whitespace-pre-wrap break-words">{error}</pre>
        </div>
      )}

      {result && (
        <div className="mt-6 rounded border p-4">
          <div className="font-semibold mb-2">Result</div>
          <dl className="grid grid-cols-3 gap-2 text-sm">
            <dt className="font-medium">Mint</dt>
            <dd className="col-span-2 break-all font-mono">
              {formatValue(result.mint)}
            </dd>

            <dt className="font-medium">Metadata</dt>
            <dd className="col-span-2 break-all font-mono">
              {formatValue(result.metadata)}
            </dd>

            <dt className="font-medium">Name</dt>
            <dd className="col-span-2">{formatValue(result.name)}</dd>

            <dt className="font-medium">Symbol</dt>
            <dd className="col-span-2">{formatValue(result.symbol)}</dd>

            <dt className="font-medium">URI</dt>
            <dd className="col-span-2 break-all font-mono">
              {formatValue(result.uri)}
            </dd>

            <dt className="font-medium">Decimals</dt>
            <dd className="col-span-2">{formatValue(result.decimals)}</dd>

            <dt className="font-medium">Authority</dt>
            <dd className="col-span-2 break-all font-mono">
              {formatValue(result.authority)}
            </dd>

            <dt className="font-medium">Airdrop Sig</dt>
            <dd className="col-span-2 break-all font-mono">
              {formatValue(result.airdropSig)}
            </dd>

            <dt className="font-medium">Metadata Sig</dt>
            <dd className="col-span-2 break-all font-mono">
              {formatValue(result.metadataSig)}
            </dd>

            <dt className="font-medium">ATA</dt>
            <dd className="col-span-2 break-all font-mono">
              {formatValue(result.ata) || "(none)"}
            </dd>

            <dt className="font-medium">Mint Sig</dt>
            <dd className="col-span-2 break-all font-mono">
              {formatValue(result.mintSig) || "(none)"}
            </dd>
          </dl>
        </div>
      )}
    </div>
  );
}

function formatValue(v: any): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  // Detect Uint8Array (e.g., Umi signature)
  if (
    typeof v === "object" &&
    v != null &&
    typeof (v as any).length === "number" &&
    typeof (v as any).BYTES_PER_ELEMENT === "number"
  ) {
    try {
      // Convert to hex for readability without extra deps
      const arr = Array.from(v as Uint8Array) as number[];
      return arr.map((b) => b.toString(16).padStart(2, "0")).join("");
    } catch {}
  }
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}
// "use client";

// import { useState } from "react";
// import {
//   Keypair,
//   PublicKey,
//   SystemProgram,
//   Transaction,
// } from "@solana/web3.js";
// import { CONNECTION, TOKEN_METADATA_PROGRAM_ID } from "@/lib/constants";
// import {
//   createInitializeMintInstruction,
//   getAssociatedTokenAddress,
//   createAssociatedTokenAccountInstruction,
//   MINT_SIZE,
//   TOKEN_PROGRAM_ID,
// } from "@solana/spl-token";
// import {
//   createMetadataAccountV3Instruction,
//   PROGRAM_ID as METADATA_PROGRAM_ID,
// } from "@metaplex-foundation/mpl-token-metadata";

// export default function CreateTokenPage() {
//   const [mintAddr, setMintAddr] = useState<string | null>(null);
//   const [status, setStatus] = useState("");

//   const createToken = async () => {
//     try {
//       setStatus("Creating token...");

//       // Generate a new keypair for the mint
//       const mint = Keypair.generate();

//       // Get fee payer (replace with your wallet adapter in real app)
//       const payer = Keypair.generate();
//       const airdropSig = await CONNECTION.requestAirdrop(payer.publicKey, 1e9);
//       await CONNECTION.confirmTransaction(airdropSig, "confirmed");

//       const lamports = await CONNECTION.getMinimumBalanceForRentExemption(
//         MINT_SIZE
//       );

//       // Create mint account
//       const tx = new Transaction().add(
//         SystemProgram.createAccount({
//           fromPubkey: payer.publicKey,
//           newAccountPubkey: mint.publicKey,
//           space: MINT_SIZE,
//           lamports,
//           programId: TOKEN_PROGRAM_ID,
//         }),
//         createInitializeMintInstruction(
//           mint.publicKey,
//           9, // decimals
//           payer.publicKey, // mint authority
//           payer.publicKey // freeze authority
//         )
//       );

//       // Derive metadata PDA
//       const [metadataPda] = PublicKey.findProgramAddressSync(
//         [
//           Buffer.from("metadata"),
//           METADATA_PROGRAM_ID.toBuffer(),
//           mint.publicKey.toBuffer(),
//         ],
//         METADATA_PROGRAM_ID
//       );

//       // Add metadata instruction
//       tx.add(
//         createMetadataAccountV3Instruction(
//           {
//             metadata: metadataPda,
//             mint: mint.publicKey,
//             mintAuthority: payer.publicKey,
//             payer: payer.publicKey,
//             updateAuthority: payer.publicKey,
//           },
//           {
//             createMetadataAccountArgsV3: {
//               data: {
//                 name: "MyToken",
//                 symbol: "MTK",
//                 uri: "https://arweave.net/your_metadata.json", // must be JSON metadata
//                 sellerFeeBasisPoints: 0,
//                 creators: null,
//                 collection: null,
//                 uses: null,
//               },
//               isMutable: true,
//               collectionDetails: null,
//             },
//           }
//         )
//       );

//       // Send tx
//       const sig = await CONNECTION.sendTransaction(tx, [payer, mint], {
//         skipPreflight: false,
//       });
//       await CONNECTION.confirmTransaction(sig, "confirmed");

//       setMintAddr(mint.publicKey.toBase58());
//       setStatus(`✅ Token created! Signature: ${sig}`);
//     } catch (e: any) {
//       setStatus(`❌ Error: ${e.message}`);
//     }
//   };

//   return (
//     <div className="max-w-xl mx-auto p-6 space-y-4">
//       <h1 className="text-xl font-semibold">Create SPL Token with Metadata</h1>
//       <button
//         onClick={createToken}
//         className="bg-blue-600 text-white px-4 py-2 rounded"
//       >
//         Create Token
//       </button>
//       {status && <p className="mt-4">{status}</p>}
//       {mintAddr && (
//         <p className="break-all">
//           Mint Address: <span className="font-mono">{mintAddr}</span>
//         </p>
//       )}
//     </div>
//   );
// }
