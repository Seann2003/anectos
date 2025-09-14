"use client";

import { useMemo, useState } from "react";
import { PROJECTS } from "./data";
import SdgSelector from "@/components/sdg-selector";
// Removed unused Button import and SDG_NUMBERS

export default function ProjectsPage() {
  const [query, setQuery] = useState("");
  const [selectedSdgs, setSelectedSdgs] = useState<number[]>([]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PROJECTS.filter((p) => {
      const matchesQuery = q ? p.title.toLowerCase().includes(q) : true;
      const matchesSdgs = selectedSdgs.length
        ? p.sdgs.some((n) => selectedSdgs.includes(n))
        : true;
      return matchesQuery && matchesSdgs;
    });
  }, [query, selectedSdgs]);

  // Removed unused filter helpers

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
                  {/* Project image */}
                  {p.imageUrl ? (
                    <img
                      src={p.imageUrl}
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
                        ${""}
                        {p.fundingRaised.toLocaleString()} raised
                      </span>
                      <span className="text-blue-700/70">
                        Goal ${""}
                        {p.fundingGoal.toLocaleString()}
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
