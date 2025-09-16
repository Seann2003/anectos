"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useSendTransaction } from "@privy-io/react-auth/solana";
import { CONNECTION, ANECTOS_PROGRAM, SURFPOOL_RPC } from "@/lib/constants";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { roundVaultPda } from "@/lib/pda";
import {
  createRoundVaultIx,
  setMatchingPoolToVaultBalanceIx,
  fundRoundPoolIx,
  setAreaMaxIx,
} from "@/lib/instructions";
import { BN } from "@coral-xyz/anchor";
import { solToLamports, lamportsToSol } from "@/lib/utils";

export default function AdminPage() {
  const { user, authenticated } = usePrivy();
  const { sendTransaction } = useSendTransaction();

  const [roundStr, setRoundStr] = useState("");
  console.log(roundStr);
  const [amountSol, setAmountSol] = useState("");
  const [areaMaxStr, setAreaMaxStr] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [rounds, setRounds] = useState<
    Array<{
      pubkey: string;
      isActive: boolean | null;
      roundVault: string;
      roundVaultSol: number | null;
      matchingPoolLamports: string;
      matchingPoolSol: number | null;
      poolDistributedLamports: string;
      poolRemainingSol: number | null;
      area?: string | null;
      areaMax?: string | null;
    }>
  >([]);
  const [roundsLoading, setRoundsLoading] = useState(false);
  const [onlyMine, setOnlyMine] = useState(true);
  const [walletLamports, setWalletLamports] = useState<number>(0);

  // Load connected wallet balance (localnet)
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        if (!authenticated || !user?.wallet?.address) return;
        const bal = await CONNECTION.getBalance(
          new PublicKey(user.wallet.address),
          "confirmed"
        );
        if (!cancelled) setWalletLamports(bal);
      } catch {
        if (!cancelled) setWalletLamports(0);
      }
    };
    run();
    const t = setInterval(run, 10_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [authenticated, user?.wallet?.address]);

  const loadRounds = async () => {
    setRoundsLoading(true);
    setErr(null);
    try {
      // 1) Try fetching all rounds directly
      const all = await ANECTOS_PROGRAM.account.fundingRound.all();
      const myPk = user?.wallet?.address
        ? new PublicKey(user.wallet.address)
        : null;
      let filtered =
        onlyMine && myPk
          ? all.filter((r: any) => {
              try {
                const owner = (r.account as any).owner as PublicKey;
                return owner && owner.equals(myPk);
              } catch {
                return false;
              }
            })
          : all;

      // 2) Also discover rounds referenced by projects, in case account filtering missed some
      const projAll = await ANECTOS_PROGRAM.account.project.all();
      const roundMap = new Map<string, any>();
      // Seed with already fetched
      for (const r of filtered) {
        roundMap.set(r.publicKey.toBase58(), r.account);
      }
      for (const p of projAll) {
        try {
          const rpk: PublicKey = (p.account as any).round;
          if (!rpk) continue;
          const k = rpk.toBase58();
          if (!roundMap.has(k)) {
            // Safe decode: ensure account exists and is owned by our program
            const info = await CONNECTION.getAccountInfo(rpk, "confirmed");
            if (info && info.owner.equals(ANECTOS_PROGRAM.programId)) {
              const acct = await ANECTOS_PROGRAM.account.fundingRound.fetch(
                rpk
              );
              roundMap.set(k, acct);
            }
          }
        } catch {}
      }

      // Apply onlyMine after merging if needed
      if (onlyMine && myPk) {
        for (const [k, acct] of Array.from(roundMap.entries())) {
          try {
            const owner = (acct as any).owner as PublicKey;
            if (!owner || !owner.equals(myPk)) {
              roundMap.delete(k);
            }
          } catch {
            roundMap.delete(k);
          }
        }
      }

      const enriched = await Promise.all(
        Array.from(roundMap.entries()).map(async ([k, acct]) => {
          const roundPk = new PublicKey(k);
          const [rvPk] = roundVaultPda(roundPk);
          const bal = await CONNECTION.getBalance(rvPk, "confirmed");
          const matchingPoolBn = (acct as any)?.matchingPool;
          const isActive = (acct as any)?.isActive ?? null;
          const poolDistributedBn = (acct as any)?.poolDistributed;
          const mpStr = matchingPoolBn?.toString?.() ?? "0";
          const distributedStr = poolDistributedBn?.toString?.() ?? "0";
          const areaBn = (acct as any)?.area;
          const areaMaxBn = (acct as any)?.areaMax;
          return {
            pubkey: k,
            isActive,
            roundVault: rvPk.toBase58(),
            roundVaultSol: lamportsToSol(bal),
            matchingPoolLamports: mpStr,
            matchingPoolSol: lamportsToSol(mpStr),
            poolDistributedLamports: distributedStr,
            poolRemainingSol: lamportsToSol(
              (BigInt(mpStr) - BigInt(distributedStr)).toString()
            ),
            area: areaBn?.toString?.() ?? null,
            areaMax: areaMaxBn?.toString?.() ?? null,
          };
        })
      );
      setRounds(enriched);
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setRoundsLoading(false);
    }
  };

  useEffect(() => {
    // Auto load on mount and when filter/auth changes
    loadRounds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, user?.wallet?.address, onlyMine]);

  const handleCreateRoundVault = async () => {
    setMsg(null);
    setErr(null);
    if (!authenticated || !user?.wallet?.address) {
      setErr("Please login with a Privy Solana wallet.");
      return;
    }
    try {
      setBusy(true);
      const roundPk = new PublicKey(roundStr);
      const [roundVault] = roundVaultPda(roundPk);
      const ownerPk = new PublicKey(user.wallet.address);
      console.log("Creating round vault", roundVault.toBase58());

      const ix = await createRoundVaultIx({
        owner: ownerPk,
        fundingRound: roundPk,
        roundVault,
      });
      console.log("Ix:", ix);
      const tx = new Transaction().add(ix);
      tx.feePayer = ownerPk;
      const { blockhash } = await CONNECTION.getLatestBlockhash();
      tx.recentBlockhash = blockhash;

      const r = await sendTransaction({
        transaction: tx,
        connection: CONNECTION,
        address: user.wallet.address,
      });
      setMsg(`Round vault created. Sig: ${r.signature}`);
      console.log("hsdhisdhi");
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  const handleFundMatchingPool = async () => {
    setMsg(null);
    setErr(null);
    if (!authenticated || !user?.wallet?.address) {
      setErr("Please login with a Privy Solana wallet.");
      return;
    }
    const lamports = solToLamports(amountSol);
    if (lamports <= BigInt(0)) {
      setErr("Enter a positive SOL amount.");
      return;
    }
    // Client-side balance check to avoid wasted prompts
    // Use BigInt-safe comparison
    if (lamports > BigInt(walletLamports)) {
      setErr("Amount exceeds your wallet balance.");
      return;
    }
    try {
      setBusy(true);
      const roundPk = new PublicKey(roundStr);
      const [roundVault] = roundVaultPda(roundPk);
      const ownerPk = new PublicKey(user.wallet.address);

      const tx = new Transaction();
      // If round vault doesn't exist yet, try to create it first
      const info = await CONNECTION.getAccountInfo(roundVault, "confirmed");
      if (!info) {
        const createIx = await createRoundVaultIx({
          owner: ownerPk,
          fundingRound: roundPk,
          roundVault,
        });
        tx.add(createIx);
      }
      // Fund pool via program to auto-increment matching_pool
      const fundIx = await fundRoundPoolIx({
        funder: ownerPk,
        fundingRound: roundPk,
        roundVault,
        amount: Number(lamports),
      });
      tx.add(fundIx);
      tx.feePayer = ownerPk;
      const { blockhash } = await CONNECTION.getLatestBlockhash();
      tx.recentBlockhash = blockhash;

      const r = await sendTransaction({
        transaction: tx,
        connection: CONNECTION,
        address: user.wallet.address,
      });
      setMsg(`Funded matching pool. Sig: ${r.signature}`);
      await loadRounds();
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  const handleSetPoolToVault = async () => {
    setMsg(null);
    setErr(null);
    if (!authenticated || !user?.wallet?.address) {
      setErr("Please login with a Privy Solana wallet.");
      return;
    }
    try {
      setBusy(true);
      const roundPk = new PublicKey(roundStr);
      const [roundVault] = roundVaultPda(roundPk);
      const ownerPk = new PublicKey(user.wallet.address);

      const tx = new Transaction();
      // Ensure vault exists first
      const info = await CONNECTION.getAccountInfo(roundVault, "confirmed");
      if (!info) {
        const createIx = await createRoundVaultIx({
          owner: ownerPk,
          fundingRound: roundPk,
          roundVault,
        });
        tx.add(createIx);
      }

      const setIx = await setMatchingPoolToVaultBalanceIx({
        owner: ownerPk,
        fundingRound: roundPk,
        roundVault,
      });
      tx.add(setIx);

      tx.feePayer = ownerPk;
      const { blockhash } = await CONNECTION.getLatestBlockhash();
      tx.recentBlockhash = blockhash;

      const r = await sendTransaction({
        transaction: tx,
        connection: CONNECTION,
        address: user.wallet.address,
      });
      setMsg(`Matching pool set to vault balance. Sig: ${r.signature}`);
      // refresh rounds list to reflect pool value
      await loadRounds();
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  const handleAirdrop = async () => {
    setMsg(null);
    setErr(null);
    if (!authenticated || !user?.wallet?.address) {
      setErr("Please login with a Privy Solana wallet.");
      return;
    }
    try {
      setBusy(true);
      const pk = new PublicKey(user.wallet.address);
      const sig = await CONNECTION.requestAirdrop(pk, 2 * 1_000_000_000);
      await CONNECTION.confirmTransaction(sig, "confirmed");
      // Refresh balance immediately
      const bal = await CONNECTION.getBalance(pk, "confirmed");
      setWalletLamports(bal);
      setMsg(`Airdropped 2 SOL to ${pk.toBase58()}. Sig: ${sig}`);
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <h1 className="text-3xl font-bold">Admin</h1>
      <Card>
        <CardHeader>
          <CardTitle>Welcome back admin!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            On-chain admin tools have been removed. Use database-backed tools
            below.
          </p>
          <div className="flex gap-3">
            <Link href="/admin/proposals">
              <Button variant="default">Review Proposals</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Funding Rounds On-Chain</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={onlyMine}
                onChange={(e) => setOnlyMine(e.target.checked)}
              />
              Show only my rounds
            </label>
            <Button
              size="sm"
              variant="secondary"
              onClick={loadRounds}
              disabled={roundsLoading}
            >
              {roundsLoading ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
          {rounds.length === 0 && !roundsLoading && (
            <div className="text-sm text-gray-600">No rounds found.</div>
          )}
          <div className="space-y-2">
            {rounds.map((r) => (
              <div
                key={r.pubkey}
                className="flex flex-wrap items-center justify-between rounded border p-3 gap-3"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium break-all">
                    {r.pubkey}
                  </div>
                  <div className="text-xs text-gray-600">
                    Active: {String(r.isActive)} · Round Vault: {r.roundVault}
                    <br />
                    Pool: {r.matchingPoolSol ?? 0} SOL · Distributed:{" "}
                    {lamportsToSol(r.poolDistributedLamports ?? "0")} SOL ·
                    Remaining: {r.poolRemainingSol ?? 0} SOL
                    <br />
                    Vault Bal: {r.roundVaultSol ?? 0} SOL
                    <br />
                    Area: {r.area ?? "-"} · Target Area: {r.areaMax ?? "-"}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setRoundStr(r.pubkey)}>
                    Use
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
