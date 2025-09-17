"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { CONNECTION, ANECTOS_PROGRAM } from "@/lib/constants";
import { PublicKey } from "@solana/web3.js";
import { roundVaultPda } from "@/lib/pda";
import { lamportsToSol } from "@/lib/utils";

export default function AdminPage() {
  const { user, authenticated } = usePrivy();
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

  const loadRounds = async () => {
    setRoundsLoading(true);
    try {
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
      console.error(e?.message || String(e));
    } finally {
      setRoundsLoading(false);
    }
  };

  useEffect(() => {
    // Auto load on mount and when filter/auth changes
    loadRounds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, user?.wallet?.address, onlyMine]);

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <h1 className="text-3xl font-bold">Admin</h1>
      <Card>
        <CardHeader>
          <CardTitle>Welcome back admin!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
