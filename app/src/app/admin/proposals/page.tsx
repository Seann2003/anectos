"use client";

import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useSendTransaction } from "@privy-io/react-auth/solana";
import { Toaster } from "@/components/ui/sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { PublicKey, Transaction } from "@solana/web3.js";
import { CONNECTION, SPL_GOVERNANCE } from "@/lib/constants";
import { changeProjectFundingStageIx } from "@/lib/instructions";
import { fundingRoundMetadataPda, projectMetadataPda } from "@/lib/pda";
import { publicKeyFromBn } from "@/lib/helpers";
import { Badge } from "@/components/ui/badge";

export default function AdminProposalsPage() {
  // On-chain projects state
  type UiProject = {
    id: string;
    title: string;
    imageUrl?: string | null;
    sdgs: number[];
    fundingGoal: number;
    fundingRaised: number;
    milestones: number[];
    description?: string;
    projectMetaPubkey?: string | null;
    round?: string | null;
    fundingStage?: string | null;
  };

  const SDG_MAP: Record<string, number> = {
    noPoverty: 1,
    zeroHunger: 2,
    goodHealthAndWellBeing: 3,
    qualityEducation: 4,
    genderEquality: 5,
    cleanWaterAndSanitation: 6,
    affordableAndCleanEnergy: 7,
    decentWorkAndEconomicGrowth: 8,
    industryInnovationAndInfrastructure: 9,
    reducedInequalities: 10,
    sustainableCitiesAndCommunities: 11,
    responsibleConsumptionAndProduction: 12,
    climateAction: 13,
    lifeBelowWater: 14,
    lifeOnLand: 15,
    peaceJusticeAndStrongInstitutions: 16,
    partnershipsForTheGoals: 17,
  };
  const sdgToNumber = (sdg: any): number | null => {
    if (typeof sdg === "number") return sdg;
    if (typeof sdg === "object" && sdg) {
      const key = Object.keys(sdg)[0];
      if (!key) return null;
      return SDG_MAP[key] ?? null;
    }
    return null;
  };
  const formatUSD = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(n);

  const [projItems, setProjItems] = useState<UiProject[]>([]);
  const [projLoading, setProjLoading] = useState(false);
  const [projError, setProjError] = useState<string | null>(null);
  const [selected, setSelected] = useState<UiProject | null>(null);
  const [actionLoading, setActionLoading] = useState<
    "approve" | "reject" | null
  >(null);

  const { user, authenticated } = usePrivy();
  const { sendTransaction } = useSendTransaction();
  console.log("Selecting project:", selected);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setProjLoading(true);
      setProjError(null);
      try {
        const res = await fetch("/api/project", { cache: "no-store" });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        const list: any[] = Array.isArray(data?.items)
          ? data.items
          : data && data.projectPubkey
          ? [data]
          : [];
        const normalizeRoundToString = (roundVal: any): string | null => {
          try {
            if (!roundVal) return null;
            if (typeof roundVal === "string") return roundVal;
            // BN-like from Anchor account
            if (typeof roundVal === "object" && "_bn" in roundVal) {
              return publicKeyFromBn(roundVal).toBase58();
            }
            if (roundVal instanceof PublicKey) return roundVal.toBase58();
            // Fallback attempt
            return new PublicKey(roundVal).toBase58();
          } catch {
            return null;
          }
        };
        const mapped: UiProject[] = list.map((entry: any) => {
          const project = entry.project ?? {};
          const meta = entry.projectMeta ?? {};
          const id = entry.projectPubkey as string;
          const title = (meta.title as string) || "Untitled Project";
          const imageUrl = (meta.imageMetadataUri as string) || null;
          const sdgGoalsRaw = (meta.sdgGoals as any[]) || [];
          const sdgs = sdgGoalsRaw
            .map((g) => sdgToNumber(g))
            .filter((n): n is number => typeof n === "number");
          const fundingGoal = parseInt(project.targetAmount ?? "0", 10) || 0;
          const fundingRaised =
            parseInt(project.currentFunding ?? "0", 10) || 0;
          const milestonesRaw = (project.milestones as any[]) || [];
          const milestones = milestonesRaw.map(
            (m) => parseInt(m?.amount ?? "0", 10) || 0
          );
          const description = (meta.description as string) || "";
          const projectMetaPubkey = (entry.projectMetaPubkey as string) || null;
          const round = normalizeRoundToString(project?.round);
          const fundingStage = (() => {
            const fs: any = meta.fundingStage;
            if (!fs) return null;
            if (typeof fs === "string") return fs.toLowerCase();
            if (typeof fs === "number") {
              const arr = [
                "planning",
                "active",
                "ongoing",
                "completed",
                "rejected",
              ];
              return arr[fs] ?? null;
            }
            if (typeof fs === "object") {
              const key = Object.keys(fs)[0];
              return key ? key.toLowerCase() : null;
            }
            return null;
          })();
          return {
            id,
            title,
            imageUrl,
            sdgs,
            fundingGoal,
            fundingRaised,
            milestones,
            description,
            projectMetaPubkey,
            round,
            fundingStage,
          } as UiProject;
        });
        if (!cancelled) setProjItems(mapped);
      } catch (e: any) {
        if (!cancelled) setProjError(e?.message || "Failed to load projects");
      } finally {
        if (!cancelled) setProjLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <Toaster position="top-right" richColors closeButton />
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Pending Proposals</h1>
        <Link href="/admin">
          <Button variant="outline">Back to Admin</Button>
        </Link>
      </div>

      {/* On-chain projects table */}
      <Card>
        <CardHeader>
          <CardTitle>On-chain Projects</CardTitle>
        </CardHeader>
        <CardContent>
          {projLoading && (
            <div className="text-gray-600">Loading projects…</div>
          )}
          {projError && <div className="text-red-600">{projError}</div>}
          {!projLoading && !projError && (
            <>
              {projItems.length === 0 ? (
                <div className="text-gray-600">No projects found.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>SDGs</TableHead>
                      <TableHead>Raised</TableHead>
                      <TableHead>Goal</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Milestones</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projItems.map((p) => {
                      const reached = p.milestones.filter(
                        (m) => p.fundingRaised >= m
                      ).length;
                      const status = (
                        p.fundingStage || "planning"
                      ).toLowerCase();
                      const statusVariant =
                        status === "rejected"
                          ? "destructive"
                          : status === "active" || status === "ongoing"
                          ? "default"
                          : "secondary"; // planning/completed -> secondary for neutrality
                      return (
                        <TableRow
                          key={p.id}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => setSelected(p)}
                        >
                          <TableCell className="font-medium">
                            {p.title}
                          </TableCell>
                          <TableCell>{p.sdgs.join(", ")}</TableCell>
                          <TableCell>{formatUSD(p.fundingRaised)}</TableCell>
                          <TableCell>{formatUSD(p.fundingGoal)}</TableCell>
                          <TableCell>
                            <Badge variant={statusVariant as any}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {reached}/{p.milestones.length}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Overlay modal with project details */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-3xl rounded-xl bg-white shadow-xl border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h3 className="text-lg font-semibold">{selected.title}</h3>
              <button
                className="rounded-md px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200"
                onClick={() => setSelected(null)}
              >
                Close
              </button>
            </div>
            <div className="p-5 grid gap-6 md:grid-cols-3">
              <div className="md:col-span-1">
                {selected.imageUrl ? (
                  <img
                    src={selected.imageUrl}
                    alt={selected.title}
                    className="w-full h-48 object-cover rounded-md border"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-100 rounded-md border" />
                )}
                <div className="mt-3 flex flex-wrap gap-1">
                  {selected.sdgs.map((n) => (
                    <span
                      key={n}
                      className="text-[10px] uppercase tracking-wide rounded bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5"
                    >
                      SDG {n}
                    </span>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2">
                <div className="mb-3">
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="text-gray-900 font-medium">
                      {formatUSD(selected.fundingRaised)} raised
                    </span>
                    <span className="text-gray-600">
                      Goal {formatUSD(selected.fundingGoal)}
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-blue-600"
                      style={{
                        width: `${
                          selected.fundingGoal
                            ? Math.min(
                                100,
                                Math.round(
                                  (selected.fundingRaised /
                                    selected.fundingGoal) *
                                    100
                                )
                              )
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-1">About</h4>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">
                    {selected.description || "No description provided."}
                  </p>
                </div>
                <div className="mt-4">
                  <h4 className="text-sm font-semibold mb-1">Milestones</h4>
                  <ul className="text-sm list-disc ml-5 space-y-1">
                    {selected.milestones.map((m, idx) => {
                      const reached = selected.fundingRaised >= m;
                      return (
                        <li
                          key={idx}
                          className={
                            reached ? "text-green-700" : "text-gray-700"
                          }
                        >
                          Milestone {idx + 1}: {formatUSD(m)}{" "}
                          {reached ? "— Reached" : "— Pending"}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </div>
            <div className="px-5 py-4 border-t flex items-center justify-between gap-2">
              <div className="text-xs text-gray-500">
                Project: <span className="font-mono">{selected.id}</span>
              </div>
              {(selected.fundingStage ?? "planning").toLowerCase() ===
                "planning" && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={actionLoading !== null}
                    onClick={async () => {
                      if (!authenticated || !user?.wallet?.address) return;
                      try {
                        setActionLoading("reject");
                        const adminPk = new PublicKey(user.wallet.address);
                        const projectPk = new PublicKey(selected.id);
                        const [projectMetaPk] = projectMetadataPda(projectPk);
                        if (!selected.round)
                          throw new Error("Missing funding round");
                        const roundPk = new PublicKey(selected.round);
                        const [roundMetaPda] = fundingRoundMetadataPda(roundPk);

                        const ix = await changeProjectFundingStageIx({
                          user: adminPk,
                          projectPda: projectPk,
                          projectMetadataPda: projectMetaPk,
                          fundingRound: roundPk,
                          fundingRoundMetadataPda: roundMetaPda,
                          fundingStage: { rejected: {} },
                        });
                        const tx = new Transaction().add(ix);
                        tx.feePayer = adminPk;
                        const { blockhash } =
                          await CONNECTION.getLatestBlockhash();
                        tx.recentBlockhash = blockhash;
                        await sendTransaction({
                          transaction: tx,
                          connection: CONNECTION,
                          address: user.wallet.address,
                        });
                        setSelected(null);
                      } catch (err) {
                        console.error("reject project stage failed:", err);
                      } finally {
                        setActionLoading(null);
                      }
                    }}
                  >
                    {actionLoading === "reject" ? "Rejecting…" : "Reject"}
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    disabled={actionLoading !== null}
                    onClick={async () => {
                      if (!authenticated || !user?.wallet?.address) return;
                      try {
                        setActionLoading("approve");
                        const adminPk = new PublicKey(user.wallet.address);
                        const projectPk = new PublicKey(selected.id);
                        const [projectMetaPk] = projectMetadataPda(projectPk);
                        if (!selected.round)
                          throw new Error("Missing funding round");
                        const roundPk = new PublicKey(selected.round);
                        const [roundMetaPda] = fundingRoundMetadataPda(roundPk);

                        const ix = await changeProjectFundingStageIx({
                          user: adminPk,
                          projectPda: projectPk,
                          projectMetadataPda: projectMetaPk,
                          fundingRound: roundPk,
                          fundingRoundMetadataPda: roundMetaPda,
                          fundingStage: { active: {} },
                        });
                        const tx = new Transaction().add(ix);
                        tx.feePayer = adminPk;
                        const { blockhash } =
                          await CONNECTION.getLatestBlockhash();
                        tx.recentBlockhash = blockhash;
                        await sendTransaction({
                          transaction: tx,
                          connection: CONNECTION,
                          address: user.wallet.address,
                        });
                        setSelected(null);
                      } catch (err) {
                        console.error("approve project stage failed:", err);
                      } finally {
                        setActionLoading(null);
                      }
                    }}
                  >
                    {actionLoading === "approve" ? "Approving…" : "Approve"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
