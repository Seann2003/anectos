"use client";

import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useSendTransaction } from "@privy-io/react-auth/solana";
import { PublicKey, Transaction, Keypair } from "@solana/web3.js";
import { CONNECTION, SPL_GOVERNANCE } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// This page demonstrates constructing a governance proposal using governance-idl-sdk
// It assumes you already have:
//  - an existing Realm
//  - an existing Governance account within that Realm
//  - a Token Owner Record (you deposited governing tokens earlier)
//  - the governing token mint used for proposals (community or council)
// For convenience, paste the needed public keys below or load them dynamically.

// TODO: Replace the placeholder public keys with real ones from your environment.
// These values MUST match your on-chain realm setup.
const REALM_PK = new PublicKey("11111111111111111111111111111111"); // placeholder
const GOVERNANCE_PK = new PublicKey("11111111111111111111111111111111"); // placeholder
const TOKEN_OWNER_RECORD_PK = new PublicKey("11111111111111111111111111111111"); // placeholder
const GOVERNING_TOKEN_MINT_PK = new PublicKey("11111111111111111111111111111111"); // placeholder

// A single-choice vote type per SDK type definitions
const SINGLE_CHOICE_VOTE_TYPE = { type: { singleChoice: {} }, /* fallback fields if library expects more */ } as any;

export default function TestCreateProposalPage() {
	const { user, authenticated } = usePrivy();
	const { sendTransaction } = useSendTransaction();

	const [name, setName] = useState("Activate Funding Stage");
	const [description, setDescription] = useState("Proposal to mark selected project(s) funding stage as Active.");
	const [optionLabel, setOptionLabel] = useState("Activate");
	const [submitting, setSubmitting] = useState(false);
	const [sig, setSig] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

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

			// Seed for proposal account (optional); using random keypair for uniqueness
			const proposalSeed = Keypair.generate().publicKey;

			// Build the createProposal instruction
			const ixCtx = await SPL_GOVERNANCE.createProposalInstruction(
				name.trim(),
				description.trim(),
				SINGLE_CHOICE_VOTE_TYPE, // voteType
				[optionLabel.trim() || "Activate"], // options as single-element tuple
				false, // useDenyOption
				REALM_PK,
				GOVERNANCE_PK,
				TOKEN_OWNER_RECORD_PK,
				GOVERNING_TOKEN_MINT_PK,
				walletPk, // governanceAuthority (token owner or delegate)
				walletPk, // payer
				proposalSeed
			);

			const tx = new Transaction();
			// The SDK's context object may contain 'ix' or 'instructions'. Handle both.
			if (Array.isArray((ixCtx as any).instructions)) {
				(ixCtx as any).instructions.forEach((i: any) => tx.add(i));
			} else if ((ixCtx as any).ix) {
				tx.add((ixCtx as any).ix);
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
		} catch (e: any) {
			console.error("createProposal failed", e);
			setError(e?.message || "Failed to create proposal");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="max-w-xl mx-auto p-6 space-y-6">
			<h1 className="text-2xl font-bold">Test: Create Governance Proposal</h1>
			<p className="text-sm text-gray-600">
				This page creates a proposal using existing Realm / Governance / TokenOwnerRecord.
				Replace placeholder public keys in the file with real ones before using on-chain.
			</p>
			<div className="space-y-4">
				<div>
					<label className="block text-xs font-medium text-gray-700 mb-1">Proposal Name</label>
					<Input value={name} onChange={(e) => setName(e.target.value)} />
				</div>
				<div>
					<label className="block text-xs font-medium text-gray-700 mb-1">Description (link or brief)</label>
					<Textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
				</div>
				<div>
					<label className="block text-xs font-medium text-gray-700 mb-1">Single Choice Option Label</label>
						<Input value={optionLabel} onChange={(e) => setOptionLabel(e.target.value)} />
				</div>
				<Button disabled={submitting} onClick={createProposal} className="bg-blue-600 hover:bg-blue-700 text-white">
					{submitting ? "Submitting…" : "Create Proposal"}
				</Button>
				{sig && (
					<div className="text-xs text-green-700 break-all">
						Success. Tx Signature: {sig}
					</div>
				)}
				{error && (
					<div className="text-xs text-red-600 break-all">{error}</div>
				)}
			</div>
			<div className="text-[10px] text-gray-500 space-y-1 border-t pt-4">
				<p>Note: This only creates the base proposal account. Adding signatories, inserting transactions, and starting voting require additional instructions (addSignatoryInstruction, insertTransactionInstruction, etc.).</p>
				<p>Active funding stage context: the proposal text/option can encode moving a project to 'active'; executing that would require a custom instruction in a transaction inserted later.</p>
			</div>
		</div>
	);
}

