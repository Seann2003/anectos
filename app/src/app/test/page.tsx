"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Transaction, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { CONNECTION } from "@/lib/constants";
import { createProjectIx, initializeFundingRoundIx } from "@/lib/instructions";
import {
  projectPdaFromOwner,
  projectMetadataPda,
  fundingRoundMetadataPda,
} from "@/lib/pda";

export default function TestCreateProject() {
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTest = async () => {
    setLoading(true);
    setResult(null);
    try {
      // Dummy owner keypair for localnet
      const ownerKp = Keypair.generate();
      const ownerPk = ownerKp.publicKey;

      // Create a fresh funding round keypair (non-PDA account)
      const roundKp = Keypair.generate();
      const roundPk = roundKp.publicKey;

      // Airdrop some SOL so we can pay fees
      try {
        const { blockhash, lastValidBlockHeight } =
          await CONNECTION.getLatestBlockhash();
        const dropSig = await CONNECTION.requestAirdrop(
          ownerPk,
          2 * LAMPORTS_PER_SOL
        );
        await CONNECTION.confirmTransaction(
          { signature: dropSig, blockhash, lastValidBlockHeight },
          "confirmed"
        );
      } catch (airdropErr) {
        console.warn("Airdrop failed (continuing):", airdropErr);
      }

      // Ensure funded
      const bal = await CONNECTION.getBalance(ownerPk);
      if (bal === 0) {
        setResult(
          "Airdrop failed or faucet is unavailable. Please ensure your local validator faucet is running or fund the test keypair."
        );
        return;
      }

      const [projectPk] = projectPdaFromOwner(ownerPk);
      const [projectMetaPk] = projectMetadataPda(projectPk);
      const [roundMetaPda] = fundingRoundMetadataPda(roundPk);

      // Build both instructions: initialize funding round, then create project referencing that round
      const now = Math.floor(Date.now() / 1000);
      const startTime = now + 5; // start 5s from now
      const endTime = now + 3600; // end in 1 hour
      const initRoundIx = await initializeFundingRoundIx({
        owner: ownerPk,
        fundingRound: roundPk,
        fundingRoundMetadataPda: roundMetaPda,
        matchingPool: 0,
        startTime,
        endTime,
        nftMetadataUri: "",
      });

      console.log("Init Round Ix:", initRoundIx);
      console.log("Project PDA:", projectPk.toBase58());
      console.log("Project Meta PDA:", projectMetaPk.toBase58());
      console.log("Round Meta PDA:", roundMetaPda.toBase58());

      const createProjIx = await createProjectIx({
        owner: ownerPk,
        projectPda: projectPk,
        projectMetadataPda: projectMetaPk,
        title: "Test Project",
        description: "Testing localnet connection.",
        round: roundPk,
        targetAmount: 1,
        milestoneCount: 1,
        sdgGoals: [{ noPoverty: {} }],
        projectImageMetadataUri: "",
      });

      const tx = new Transaction().add(initRoundIx, createProjIx);
      console.log("Tx:", tx);
      tx.feePayer = ownerPk;
      const { blockhash, lastValidBlockHeight } =
        await CONNECTION.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      // Round account must sign for its own initialization (non-PDA init)
      tx.sign(ownerKp, roundKp);

      const sig = await CONNECTION.sendRawTransaction(tx.serialize());
      await CONNECTION.confirmTransaction(
        { signature: sig, blockhash, lastValidBlockHeight },
        "confirmed"
      );
      setResult(`Success! Tx signature: ${sig}`);
    } catch (err: any) {
      const logs = err?.logs ? `\nLogs:\n${err.logs.join("\n")}` : "";
      setResult(`Error: ${err?.message || err}${logs}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-12">
      <h1 className="text-2xl font-bold mb-4">
        Test createProjectIx (Localhost)
      </h1>
      <Button onClick={handleTest} disabled={loading} className="mb-4">
        {loading ? "Testing..." : "Test createProject"}
      </Button>
      {result && (
        <div className="mt-4 p-3 rounded bg-gray-100 text-gray-800">
          {result}
        </div>
      )}
    </div>
  );
}
