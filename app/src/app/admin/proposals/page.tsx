"use client";

import { useEffect, useMemo, useState } from "react";
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

type Proposal = {
  id: string;
  owner_privy_user_id: string;
  title: string;
  description: string;
  target_amount: number;
  sdg_goals: number[];
  image_metadata_uri?: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: number; // unix ms
};

// Seed a few fake proposals based on the create/proposal fields
const SEED: Proposal[] = [
  {
    id: "p1",
    owner_privy_user_id: "user_abc",
    title: "Solar Water Purification for Rural Communities",
    description: "Deploy solar purification units for 10 villages.",
    target_amount: 50000,
    sdg_goals: [6, 7, 13],
    image_metadata_uri: null,
    status: "pending",
    created_at: Date.now() - 1000 * 60 * 60 * 6,
  },
  {
    id: "p2",
    owner_privy_user_id: "user_xyz",
    title: "Regenerative Agriculture Training Program",
    description: "Train 100 farmers on regenerative practices.",
    target_amount: 30000,
    sdg_goals: [2, 12, 15],
    image_metadata_uri: null,
    status: "pending",
    created_at: Date.now() - 1000 * 60 * 60 * 24,
  },
  {
    id: "p3",
    owner_privy_user_id: "user_mno",
    title: "Ocean Plastic Cleanup Technology",
    description: "Pilot coastal cleanup with AI sorting.",
    target_amount: 75000,
    sdg_goals: [14, 9, 13],
    image_metadata_uri: null,
    status: "pending",
    created_at: Date.now() - 1000 * 60 * 60 * 2,
  },
];

const STORAGE_KEY = "admin.proposals.v1";

function loadProposals(): Proposal[] {
  if (typeof window === "undefined") return SEED;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return SEED;
  try {
    const parsed = JSON.parse(raw) as Proposal[];
    return parsed.length ? parsed : SEED;
  } catch {
    return SEED;
  }
}

export default function AdminProposalsPage() {
  const [items, setItems] = useState<Proposal[]>([]);
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

  useEffect(() => {
    setItems(loadProposals());
  }, []);

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
          return {
            id,
            title,
            imageUrl,
            sdgs,
            fundingGoal,
            fundingRaised,
            milestones,
            description,
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

  const pending = useMemo(
    () => items.filter((p) => p.status === "pending"),
    [items]
  );

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
                      <TableHead>Milestones</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projItems.map((p) => {
                      const reached = p.milestones.filter(
                        (m) => p.fundingRaised >= m
                      ).length;
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
            <div className="px-5 py-4 border-t flex items-center justify-end gap-2">
              <Link
                href={`/projects/${selected.id}`}
                className="text-sm text-blue-700 hover:underline"
                onClick={() => setSelected(null)}
              >
                Open project page →
              </Link>
              <Button
                onClick={() => setSelected(null)}
                variant="outline"
                size="sm"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
