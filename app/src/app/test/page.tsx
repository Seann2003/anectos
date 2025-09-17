"use client";

import { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useSendTransaction } from "@privy-io/react-auth/solana";
import { PublicKey, Transaction, Keypair } from "@solana/web3.js";
import { CONNECTION, SPL_GOVERNANCE } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// TODO: Replace these placeholder public keys with real ones from your environment.
// These values MUST match your on-chain realm setup.
const REALM_PK = new PublicKey("11111111111111111111111111111111"); // placeholder
const GOVERNANCE_PK = new PublicKey("11111111111111111111111111111111"); // placeholder
const TOKEN_OWNER_RECORD_PK = new PublicKey("11111111111111111111111111111111"); // placeholder
const GOVERNING_TOKEN_MINT_PK = new PublicKey("11111111111111111111111111111111"); // placeholder

// Vote type structure for SPL Governance SDK
const SINGLE_CHOICE_VOTE_TYPE = {
  choiceType: "single",
};

export default function TestCreateProposalPage() {
  const { user, authenticated } = usePrivy();
  const { sendTransaction } = useSendTransaction();

  // Create proposal state
  const [name, setName] = useState("Activate Funding Stage");
  const [description, setDescription] = useState(
    "Proposal to mark selected project(s) funding stage as Active."
  );
  const [optionLabel, setOptionLabel] = useState("Activate");
  const [submitting, setSubmitting] = useState(false);
  const [sig, setSig] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // View proposals state
  const [proposals, setProposals] = useState<any[]>([]);
  const [loadingProposals, setLoadingProposals] = useState(false);
  const [proposalsError, setProposalsError] = useState<string | null>(null);

  // Fetch all proposals on component mount
  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    setLoadingProposals(true);
    setProposalsError(null);
    try {
      // Fetch all realms first
      const realms = await SPL_GOVERNANCE.getAllRealms();
      console.log("Found realms:", realms.length);

      // If you have a specific realm, you can fetch proposals for that realm
      // For now, let's try to fetch proposals from all realms
      let allProposals: any[] = [];
      
      for (const realm of realms.slice(0, 5)) { // Limit to first 5 realms to avoid too many requests
        try {
          // Get governances for this realm
          const governances = await SPL_GOVERNANCE.getGovernancesByRealm(realm.publicKey);
          
          for (const governance of governances.slice(0, 3)) { // Limit governances too
            try {
              const governanceProposals = await SPL_GOVERNANCE.getProposalsByGovernance(governance.publicKey);
              allProposals = [...allProposals, ...governanceProposals];
            } catch (e) {
              console.warn("Failed to fetch proposals for governance:", governance.publicKey.toBase58(), e);
            }
          }
        } catch (e) {
          console.warn("Failed to fetch governances for realm:", realm.publicKey.toBase58(), e);
        }
      }

      setProposals(allProposals);
    } catch (e: any) {
      console.error("Failed to fetch proposals:", e);
      setProposalsError(e?.message || "Failed to fetch proposals");
    } finally {
      setLoadingProposals(false);
    }
  };

  const createProposal = async () => {
    setError(null);
    setSig(null);
    if (!authenticated || !user?.wallet?.address) {
      setError("Connect a Privy Solana wallet first.");
      return;
    }
    try {
      setSubmitting(true);
      const walletPk = new PublicKey(user.wallet.address);

      // Create the proposal instruction
      const createProposalIx = await SPL_GOVERNANCE.createProposalInstruction(
        name.trim(),
        description.trim(),
        SINGLE_CHOICE_VOTE_TYPE,
        [optionLabel.trim() || "Activate"],
        false, // useDenyOption
        REALM_PK,
        GOVERNANCE_PK,
        TOKEN_OWNER_RECORD_PK,
        GOVERNING_TOKEN_MINT_PK,
        walletPk, // governanceAuthority
        walletPk, // payer
        Keypair.generate().publicKey // proposalSeed
      );

      const tx = new Transaction();
      
      // Handle different possible return structures from the SDK
      if (createProposalIx && Array.isArray(createProposalIx.instructions)) {
        createProposalIx.instructions.forEach((instruction: any) => tx.add(instruction));
      } else if (createProposalIx && createProposalIx.ix) {
        tx.add(createProposalIx.ix);
      } else if (createProposalIx) {
        tx.add(createProposalIx);
      } else {
        throw new Error("No instruction returned from createProposalInstruction");
      }

      tx.feePayer = walletPk;
      const { blockhash } = await CONNECTION.getLatestBlockhash();
      tx.recentBlockhash = blockhash;

      const receipt = await sendTransaction({
        transaction: tx,
        connection: CONNECTION,
        address: user.wallet.address,
      });
      
      setSig(receipt.signature);
      
      // Refresh proposals after creating a new one
      setTimeout(() => {
        fetchProposals();
      }, 2000);
      
    } catch (e: any) {
      console.error("createProposal failed", e);
      setError(e?.message || "Failed to create proposal");
    } finally {
      setSubmitting(false);
    }
  };

  const getProposalState = (proposal: any) => {
    if (proposal.state.draft !== undefined) return "Draft";
    if (proposal.state.signingOff !== undefined) return "Signing Off";
    if (proposal.state.voting !== undefined) return "Voting";
    if (proposal.state.succeeded !== undefined) return "Succeeded";
    if (proposal.state.executing !== undefined) return "Executing";
    if (proposal.state.completed !== undefined) return "Completed";
    if (proposal.state.cancelled !== undefined) return "Cancelled";
    if (proposal.state.defeated !== undefined) return "Defeated";
    if (proposal.state.executingWithErrors !== undefined) return "Executing with Errors";
    return "Unknown";
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold">Governance Proposals</h1>
      
      {/* Create Proposal Section */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4">Create New Proposal</h2>
        <p className="text-sm text-gray-600 mb-6">
          Create a proposal using existing Realm / Governance / TokenOwnerRecord. 
          Replace placeholder public keys in the file with real ones before using on-chain.
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Proposal Name
            </label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <Textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Option Label
            </label>
            <Input
              value={optionLabel}
              onChange={(e) => setOptionLabel(e.target.value)}
            />
          </div>
          
          <Button
            disabled={submitting}
            onClick={createProposal}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {submitting ? "Creating..." : "Create Proposal"}
          </Button>
          
          {sig && (
            <div className="text-sm text-green-700 break-all bg-green-50 p-3 rounded">
              ✅ Success! Transaction Signature: {sig}
            </div>
          )}
          
          {error && (
            <div className="text-sm text-red-600 break-all bg-red-50 p-3 rounded">
              ❌ Error: {error}
            </div>
          )}
        </div>
      </div>

      {/* View Proposals Section */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">All Proposals</h2>
          <Button
            onClick={fetchProposals}
            disabled={loadingProposals}
            variant="outline"
          >
            {loadingProposals ? "Loading..." : "Refresh"}
          </Button>
        </div>

        {proposalsError && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded mb-4">
            ❌ Error loading proposals: {proposalsError}
          </div>
        )}

        {loadingProposals ? (
          <div className="text-center py-8">
            <div className="text-gray-500">Loading proposals...</div>
          </div>
        ) : proposals.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-500">No proposals found</div>
          </div>
        ) : (
          <div className="space-y-4">
            {proposals.map((proposal, index) => (
              <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg">{proposal.name || "Unnamed Proposal"}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    getProposalState(proposal) === "Voting" ? "bg-blue-100 text-blue-800" :
                    getProposalState(proposal) === "Succeeded" ? "bg-green-100 text-green-800" :
                    getProposalState(proposal) === "Completed" ? "bg-gray-100 text-gray-800" :
                    getProposalState(proposal) === "Draft" ? "bg-yellow-100 text-yellow-800" :
                    "bg-gray-100 text-gray-800"
                  }`}>
                    {getProposalState(proposal)}
                  </span>
                </div>
                
                <p className="text-gray-600 text-sm mb-3">
                  {proposal.descriptionLink || "No description"}
                </p>
                
                <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                  <div>
                    <strong>Public Key:</strong> {proposal.publicKey.toBase58().slice(0, 20)}...
                  </div>
                  <div>
                    <strong>Governance:</strong> {proposal.governance.toBase58().slice(0, 20)}...
                  </div>
                  <div>
                    <strong>Yes Votes:</strong> {proposal.yesVotesCount?.toString() || "0"}
                  </div>
                  <div>
                    <strong>No Votes:</strong> {proposal.noVotesCount?.toString() || "0"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instructions Section */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Setup Instructions</h3>
        <div className="text-sm text-gray-700 space-y-2">
          <p>
            <strong>To get the required public keys:</strong>
          </p>
          <ol className="list-decimal list-inside space-y-1 ml-4">
            <li><strong>Realm Public Key:</strong> Use <code>SPL_GOVERNANCE.getAllRealms()</code> to find existing realms, or create one with <code>createRealmInstruction()</code></li>
            <li><strong>Governance Public Key:</strong> Use <code>SPL_GOVERNANCE.getGovernancesByRealm(realmPubkey)</code> to find governances in your realm</li>
            <li><strong>Token Owner Record:</strong> Create one by depositing governance tokens with <code>depositGoverningTokensInstruction()</code></li>
            <li><strong>Governing Token Mint:</strong> The mint address of your community or council token</li>
          </ol>
          <p className="mt-4">
            <strong>Alternative approach:</strong> You can derive addresses using the SDK's PDA helpers:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li><code>SPL_GOVERNANCE.pda.realmAccount({`{name: "your-realm-name"}`}).publicKey</code></li>
            <li><code>SPL_GOVERNANCE.pda.governanceAccount({`{realmAccount: realmPubkey, seed: governanceSeed}`}).publicKey</code></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
