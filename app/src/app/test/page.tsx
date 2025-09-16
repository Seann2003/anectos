"use client";

import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useSendTransaction } from "@privy-io/react-auth/solana";
import { CONNECTION, SPL_GOVERNANCE } from "@/lib/constants";
import { PublicKey, Transaction } from "@solana/web3.js";
import { SplGovernance } from "governance-idl-sdk";

export default function GovernanceTestPage() {
  const { user, authenticated } = usePrivy();
  const { sendTransaction } = useSendTransaction();

  const [name, setName] = useState("Example Proposal");
  const [description, setDescription] = useState("This is a test proposal.");
  const [realmStr, setRealmStr] = useState("");
  const [governanceStr, setGovernanceStr] = useState("");
  const [torStr, setTorStr] = useState("");
  const [councilMintStr, setCouncilMintStr] = useState("");
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createProposal = async () => {
    setError(null);
    setResult(null);
    if (!authenticated || !user?.wallet?.address) {
      setError("Login with a Privy Solana wallet first.");
      return;
    }
    try {
      setCreating(true);
      const realm = new PublicKey(realmStr);
      const governance = new PublicKey(governanceStr);
      const tokenOwnerRecord = new PublicKey(torStr);
      const councilMint = new PublicKey(councilMintStr);
      const walletPk = new PublicKey(user.wallet.address);

      const ix = await SPL_GOVERNANCE.createProposalInstruction(
        name,
        description,
        { choiceType: "single", multiChoiceOptions: null },
        ["test"],
        false,
        realm,
        governance,
        tokenOwnerRecord,
        councilMint,
        walletPk,
        walletPk
      );

      const tx = new Transaction().add(ix);
      tx.feePayer = walletPk;
      const { blockhash } = await CONNECTION.getLatestBlockhash();
      tx.recentBlockhash = blockhash;

      const receipt = await sendTransaction({
        transaction: tx,
        connection: CONNECTION,
        address: user.wallet.address,
      });
      setResult(`Signature: ${receipt.signature}`);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">Create Realms Proposal (Test)</h1>

      <label className="block">
        <span className="text-sm">Realm Pubkey</span>
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="Enter Realm address"
          value={realmStr}
          onChange={(e) => setRealmStr(e.target.value)}
        />
      </label>
      <label className="block">
        <span className="text-sm">Governance Pubkey</span>
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="Enter Governance address"
          value={governanceStr}
          onChange={(e) => setGovernanceStr(e.target.value)}
        />
      </label>
      <label className="block">
        <span className="text-sm">Token Owner Record (TOR)</span>
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="Enter TOR address"
          value={torStr}
          onChange={(e) => setTorStr(e.target.value)}
        />
      </label>
      <label className="block">
        <span className="text-sm">Council Mint</span>
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="Enter Council Mint"
          value={councilMintStr}
          onChange={(e) => setCouncilMintStr(e.target.value)}
        />
      </label>

      <label className="block">
        <span className="text-sm">Proposal Name</span>
        <input
          className="w-full border rounded px-3 py-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <label className="block">
        <span className="text-sm">Proposal Description</span>
        <textarea
          className="w-full border rounded px-3 py-2"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>

      <button
        onClick={createProposal}
        disabled={creating}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {creating ? "Creating..." : "Create Proposal"}
      </button>

      {result && <p className="text-green-700 break-all">{result}</p>}
      {error && <p className="text-red-600">{error}</p>}
    </div>
  );
}
