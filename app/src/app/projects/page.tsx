"use client";

import { useEffect, useMemo, useState } from "react";
import SdgSelector from "@/components/sdg-selector";
import { lamportsToSol, formatSol } from "@/lib/utils";

type UiProject = {
  id: string; // projectPubkey
  title: string;
  imageUrl?: string | null;
  sdgs: number[];
  fundingGoal: number;
  fundingRaised: number;
  milestones: number[]; // amounts
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

function sdgToNumber(sdg: any): number | null {
  if (typeof sdg === "number") return sdg;
  if (typeof sdg === "object" && sdg) {
    const key = Object.keys(sdg)[0];
    if (!key) return null;
    return SDG_MAP[key] ?? null;
  }
  return null;
}

export default function ProjectsPage() {
  const [query, setQuery] = useState("");
  const [selectedSdgs, setSelectedSdgs] = useState<number[]>([]);
  const [items, setItems] = useState<UiProject[]>([]);
  console.log("items", items);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/project", { cache: "no-store" });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        let list: any[] = [];
        if (Array.isArray(data?.items)) list = data.items;
        else if (data && data.projectPubkey) list = [data];
        const mapped: UiProject[] = (Array.isArray(list) ? list : [list])
          .filter(Boolean)
          .map((entry: any) => {
            const project = entry.project ?? {};
            const meta = entry.projectMeta ?? {};
            const id = entry.projectPubkey as string;
            const title = (meta.title as string) || "Untitled Project";
            const imageUrl =
              (meta.imageMetadataUri.replace("ipfs://", "") as string) || null;
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
            return {
              id,
              title,
              imageUrl,
              sdgs,
              fundingGoal,
              fundingRaised,
              milestones,
            } as UiProject;
          });
        if (!cancelled) setItems(mapped);
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((p) => {
      const matchesQuery = q ? p.title.toLowerCase().includes(q) : true;
      const matchesSdgs = selectedSdgs.length
        ? p.sdgs.some((n) => selectedSdgs.includes(n))
        : true;
      return matchesQuery && matchesSdgs;
    });
  }, [items, query, selectedSdgs]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-10">
        {/* Centered search + filter */}
        <div className="min-h-[32vh] flex flex-col items-center justify-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-blue-900 mb-6 text-center">
            Explore Impact Projects
          </h1>
          <div className="w-full max-w-3xl flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 relative">
            <div className="flex-1">
              <input
                type="text"
                className="w-full rounded-lg border border-blue-200 bg-white/90 px-4 py-3 text-blue-900 placeholder:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search by project title..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="relative">
              <SdgSelector
                selected={selectedSdgs}
                onChange={setSelectedSdgs}
                showSelected={false}
              />
            </div>
          </div>
        </div>
        {loading && (
          <div className="mt-6 text-center text-blue-700">
            Loading projects…
          </div>
        )}
        {error && <div className="mt-6 text-center text-red-600">{error}</div>}
        <div className="mt-6">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => {
              const percent = Math.min(
                100,
                Math.round((p.fundingRaised / p.fundingGoal) * 100)
              );
              return (
                <div
                  key={p.id}
                  className="rounded-xl border border-blue-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  {p.imageUrl ? (
                    <img
                      src={
                        p.imageUrl.startsWith("https://")
                          ? p.imageUrl
                          : `https://ipfs.io/ipfs/${p.imageUrl}`
                      }
                      alt={p.title}
                      className="mb-3 h-40 w-full object-cover rounded-md border border-blue-100"
                    />
                  ) : (
                    <div className="mb-3 h-40 w-full rounded-md bg-blue-50 border border-blue-100" />
                  )}

                  <div className="mb-3">
                    <h3 className="text-lg font-semibold text-blue-900">
                      {p.title}
                    </h3>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {p.sdgs.slice(0, 4).map((n) => (
                        <span
                          key={n}
                          className="text-[10px] uppercase tracking-wide rounded bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5"
                        >
                          SDG {n}
                        </span>
                      ))}
                      {p.sdgs.length > 4 && (
                        <span className="text-[10px] text-blue-600">
                          +{p.sdgs.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="text-blue-900 font-medium">
                        {formatSol(lamportsToSol(p.fundingRaised), {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 4,
                        })}{" "}
                        raised
                      </span>
                      <span className="text-blue-700/70">
                        Goal{" "}
                        {formatSol(lamportsToSol(p.fundingGoal), {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 4,
                        })}
                      </span>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-blue-100">
                      <div
                        className="h-full rounded-full bg-blue-600"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="mt-1 text-right text-xs text-blue-700/70">
                      {(() => {
                        const reached = p.milestones.filter(
                          (m) => p.fundingRaised >= m
                        ).length;
                        return (
                          <span>
                            {percent}% funded • milestones {reached}/
                            {p.milestones.length}
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <a
                      href={`/projects/${p.id}`}
                      className="text-sm font-medium text-blue-700 hover:text-blue-800 hover:underline"
                    >
                      View details →
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
