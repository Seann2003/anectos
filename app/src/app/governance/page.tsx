"use client";

import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { lamportsToSol, formatSol } from "@/lib/utils";

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
// Helper to format on-chain lamport integer values as SOL
const formatSOLFromLamports = (lamports: number) =>
  formatSol(lamportsToSol(lamports), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });

export default function GovernancePage() {
  const [items, setItems] = useState<UiProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
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
          } satisfies UiProject;
        });
        if (!cancelled) {
          setItems(mapped);
          setSelectedId(mapped[0]?.id ?? null);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load projects");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const selected = items.find((p) => p.id === selectedId) || items[0];

  return (
    <div className="container mx-auto px-4 py-8">
      <Toaster position="top-right" richColors closeButton />
      <h1 className="text-2xl font-semibold">Governance</h1>
      <p className="text-gray-600 mt-2">
        Review projects awaiting whitelisting from on-chain data.
      </p>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className="rounded-lg border bg-white">
            <div className="px-4 py-3 border-b font-medium">
              Projects awaiting whitelist
            </div>
            {loading && <div className="px-4 py-3 text-gray-600">Loading…</div>}
            {error && <div className="px-4 py-3 text-red-600">{error}</div>}
            {!loading && !error && (
              <ul className="divide-y">
                {items.map((p) => (
                  <li
                    key={p.id}
                    className={`px-4 py-3 hover:bg-gray-50 cursor-pointer ${
                      selectedId === p.id ? "bg-blue-50" : ""
                    }`}
                    onClick={() => setSelectedId(p.id)}
                  >
                    <div className="flex items-start gap-3">
                      {p.imageUrl ? (
                        <img
                          src={p.imageUrl}
                          alt={p.title}
                          className="h-12 w-12 rounded object-cover border"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded bg-gray-100 border" />
                      )}
                      <div className="flex-1">
                        <div className="font-medium flex items-center gap-2">
                          {p.title}
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        </div>
                        <div className="text-xs text-gray-600 line-clamp-2">
                          {p.description || "No description provided."}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          Goal: {formatSOLFromLamports(p.fundingGoal)}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="md:col-span-2">
          {!selected ? (
            <div className="rounded-lg border bg-white p-4 text-gray-600">
              Select a project to view details.
            </div>
          ) : (
            <div className="rounded-lg border bg-white p-4">
              <div className="flex items-start gap-4">
                {selected.imageUrl ? (
                  <img
                    src={selected.imageUrl}
                    alt={selected.title}
                    className="h-24 w-24 rounded object-cover border"
                  />
                ) : (
                  <div className="h-24 w-24 rounded bg-gray-100 border" />
                )}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">{selected.title}</h2>
                  </div>
                  <p className="text-sm text-gray-700 mt-1">
                    {selected.description || "No description provided."}
                  </p>
                  <div className="text-sm text-gray-600 mt-1">
                    Goal: {formatSOLFromLamports(selected.fundingGoal)}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between text-sm text-gray-700">
                  <div>Raised</div>
                  <div>{formatSOLFromLamports(selected.fundingRaised)}</div>
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

              <div className="mt-4">
                <h4 className="text-sm font-semibold mb-1">Milestones</h4>
                <ul className="text-sm list-disc ml-5 space-y-1">
                  {selected.milestones.map((m, idx) => {
                    const reached = selected.fundingRaised >= m;
                    return (
                      <li
                        key={idx}
                        className={reached ? "text-green-700" : "text-gray-700"}
                      >
                        Milestone {idx + 1}: {formatSOLFromLamports(m)}{" "}
                        {reached ? "— Reached" : "— Pending"}
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="mt-4">
                <h4 className="text-sm font-semibold mb-1">SDGs</h4>
                <div className="flex flex-wrap gap-1">
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
