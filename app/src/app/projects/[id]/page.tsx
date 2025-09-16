"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

type UiProject = {
  id: string;
  title: string;
  description: string;
  imageUrl?: string | null;
  sdgs: number[];
  fundingGoal: number;
  fundingRaised: number;
  milestones: number[];
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

function formatUSD(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function ProjectDetailPage() {
  const params = useParams();
  const id = (params?.id as string) ?? "";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<UiProject | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/project?id=${id}`, { cache: "no-store" });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        if (!data?.project || !data?.projectMeta)
          throw new Error("Project not found");

        const projectAcc = data.project;
        const metaAcc = data.projectMeta;
        const sdgsRaw = (metaAcc.sdgGoals as any[]) || [];
        const sdgs = sdgsRaw
          .map((g) => sdgToNumber(g))
          .filter((n): n is number => typeof n === "number");
        const milestonesRaw = (projectAcc.milestones as any[]) || [];
        const milestones = milestonesRaw.map(
          (m: any) => parseInt(m?.amount ?? "0", 10) || 0
        );
        const mapped: UiProject = {
          id: data.projectPubkey,
          title: metaAcc.title || "Untitled Project",
          description: metaAcc.description || "",
          imageUrl: metaAcc.imageMetadataUri.replace("ipfs://", "") || null,
          sdgs,
          fundingGoal: parseInt(projectAcc.targetAmount ?? "0", 10) || 0,
          fundingRaised: parseInt(projectAcc.currentFunding ?? "0", 10) || 0,
          milestones,
        };
        if (!cancelled) setProject(mapped);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load project");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const percent = useMemo(() => {
    if (!project) return 0;
    const goal = project.fundingGoal;
    if (!goal || goal <= 0) return 0;
    const pct = Math.round((project.fundingRaised / goal) * 100);
    return Math.min(100, Math.max(0, isFinite(pct) ? pct : 0));
  }, [project]);
  const milestonesReached = useMemo(() => {
    if (!project) return [] as number[];
    return project.milestones.filter((m) => project.fundingRaised >= m);
  }, [project]);

  const comments = [
    {
      id: "c1",
      author: "Aisha Tan",
      initial: "A",
      createdAt: "2 hours ago",
      content:
        "Love this initiative. How are you handling maintenance for the purification units in remote areas?",
    },
    {
      id: "c2",
      author: "Daniel Ruiz",
      initial: "D",
      createdAt: "1 day ago",
      content:
        "We piloted a similar composting program in our city. Happy to share learnings on routing and contamination control.",
    },
    {
      id: "c3",
      author: "Mei Chen",
      initial: "M",
      createdAt: "3 days ago",
      content:
        "For mangrove restoration, do you plan to monitor blue carbon credits? Curious about your MRV setup.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-10 max-w-4xl">
        <div className="mb-4">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900"
          >
            <ArrowLeft className="h-4 w-4" /> Back to projects
          </Link>
        </div>
        {loading && (
          <div className="text-center text-blue-700">Loading project…</div>
        )}
        {error && <div className="text-center text-red-600">{error}</div>}
        {project && (
          <div className="flex gap-4 justify-center items-center">
            <div className="mb-6 w-1/2">
              <h1 className="text-3xl md:text-4xl font-extrabold text-blue-900">
                {project.title}
              </h1>
              <div className="mt-2 flex flex-wrap gap-1">
                {project.sdgs.map((n) => (
                  <span
                    key={n}
                    className="text-[10px] uppercase tracking-wide rounded bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5"
                  >
                    SDG {n}
                  </span>
                ))}
              </div>
            </div>
            {project.imageUrl ? (
              <img
                src={
                  project.imageUrl.startsWith("https://")
                    ? project.imageUrl
                    : `https://ipfs.io/ipfs/${project.imageUrl}`
                }
                alt={project.title}
                width={400}
                height={400}
                className="object-cover rounded-md border border-blue-100 shadow-sm mb-6"
              />
            ) : (
              <div className="mb-6 h-[400px] w-[400px] rounded-md bg-blue-50 border border-blue-100" />
            )}
          </div>
        )}

        {/* Milestones at top */}
        {project && (
          <div className="mb-6 rounded-xl border border-blue-100 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-blue-900 mb-3">
              Milestones
            </h2>
            <ul className="space-y-3">
              {project.milestones.map((threshold, idx) => {
                const reached = project.fundingRaised >= threshold;
                return (
                  <li
                    key={idx}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
                      reached
                        ? "border-green-200 bg-green-50"
                        : "border-blue-100 bg-blue-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex size-5 items-center justify-center rounded-full text-[10px] font-bold ${
                          reached
                            ? "bg-green-600 text-white"
                            : "bg-blue-200 text-blue-800"
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="text-blue-900 text-sm">
                        Milestone {idx + 1} — target {formatUSD(threshold)}
                      </span>
                    </div>
                    <span
                      className={`text-xs ${
                        reached ? "text-green-700" : "text-blue-700/70"
                      }`}
                    >
                      {reached ? "Reached" : "Pending"}
                    </span>
                  </li>
                );
              })}
            </ul>
            <div className="mt-4 text-xs text-blue-700/70">
              Reached {milestonesReached.length} of {project.milestones.length}{" "}
              milestones
            </div>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-3 items-stretch">
          <div className="md:col-span-2 h-full">
            <div className="h-full rounded-xl border border-blue-100 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-blue-900 mb-2">
                About this project
              </h2>
              {project ? (
                <p className="text-blue-900/80 leading-relaxed">
                  {project.description}
                </p>
              ) : (
                <p className="text-blue-900/60 leading-relaxed">Loading…</p>
              )}
            </div>
          </div>

          <div className="h-full">
            <div className="h-full rounded-xl border border-blue-100 bg-white p-5 shadow-sm md:sticky md:top-6">
              <h2 className="text-lg font-semibold text-blue-900 mb-3">
                Funding
              </h2>
              {project ? (
                <>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="text-blue-900 font-medium">
                      {formatUSD(project.fundingRaised)} raised
                    </span>
                    <span className="text-blue-700/70">
                      Goal {formatUSD(project.fundingGoal)}
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-blue-100">
                    <div
                      className="h-full rounded-full bg-blue-600"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="mt-1 text-right text-xs text-blue-700/70">
                    {percent}% funded
                  </div>
                </>
              ) : (
                <div className="text-blue-900/70 text-sm">Loading…</div>
              )}
              <Button
                type="button"
                className="mt-4 w-full rounded-lg bg-blue-600 hover:bg-blue-700 text-white py-2 text-sm font-medium"
              >
                Support project
              </Button>
            </div>
          </div>
        </div>

        {/* Discussion moved to its own full-width frame */}
        <div className="mt-6 rounded-xl border border-blue-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-blue-900">Discussion</h2>
            <span className="text-xs text-blue-700/70">
              {comments.length} comments
            </span>
          </div>
          <ul className="space-y-4">
            {comments.map((c) => (
              <li key={c.id} className="flex gap-3">
                <div className="mt-0.5 h-9 w-9 flex items-center justify-center rounded-full bg-blue-200 text-blue-800 font-bold">
                  {c.initial}
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium text-blue-900">
                      {c.author}
                    </span>
                    <span className="text-xs text-blue-700/70">
                      • {c.createdAt}
                    </span>
                  </div>
                  <p className="text-sm text-blue-900/90 mt-1">{c.content}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-4 border-t border-blue-100 pt-4">
            <label
              htmlFor="new-comment"
              className="block text-sm font-medium text-blue-900 mb-1"
            >
              Add a comment
            </label>
            <textarea
              id="new-comment"
              className="w-full rounded-lg border border-blue-200 bg-white/90 px-3 py-2 text-sm text-blue-900 placeholder:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Share your thoughts... (coming soon)"
              rows={3}
              disabled
            />
            <div className="mt-2 flex justify-end">
              <Button
                type="button"
                className="rounded-lg bg-blue-600 text-white text-sm font-medium px-4 py-2 opacity-60 cursor-not-allowed"
                disabled
              >
                Post
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
