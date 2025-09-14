"use client";

import { useMemo, useState } from "react";
import { PROJECTS } from "./data";
import { Button } from "@/components/ui/button";

const SDG_NUMBERS = Array.from({ length: 17 }, (_, i) => i + 1);

export default function ProjectsPage() {
  const [query, setQuery] = useState("");
  const [openFilter, setOpenFilter] = useState(false);
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

  const toggleSdg = (n: number) => {
    setSelectedSdgs((prev) =>
      prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]
    );
  };

  const resetFilters = () => setSelectedSdgs([]);

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
              <Button
                type="button"
                onClick={() => setOpenFilter((v) => !v)}
                className="whitespace-nowrap rounded-lg border border-blue-200 bg-blue-600 text-white hover:bg-blue-700 px-4 py-3 transition-colors"
              >
                Filter by SDGs{" "}
                {selectedSdgs.length ? `(${selectedSdgs.length})` : ""}
              </Button>
              {openFilter && (
                <div className="absolute right-0 mt-2 w-80 rounded-xl border border-blue-100 bg-white p-4 shadow-xl z-10">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-blue-900">
                      Select SDG Goals
                    </p>
                    <Button
                      onClick={resetFilters}
                      className="text-xs text-blue-600 hover:underline"
                      type="button"
                    >
                      Reset
                    </Button>
                  </div>
                  <div className="grid grid-cols-6 gap-2">
                    {SDG_NUMBERS.map((n) => {
                      const active = selectedSdgs.includes(n);
                      return (
                        <Button
                          key={n}
                          type="button"
                          onClick={() => toggleSdg(n)}
                          className={`rounded-md px-0.5 py-1 text-xs font-medium border transition-colors ${
                            active
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-white text-blue-700 border-blue-200 hover:bg-blue-50"
                          }`}
                          aria-pressed={active}
                        >
                          {n}
                        </Button>
                      );
                    })}
                  </div>
                  <div className="flex justify-end mt-3">
                    <Button
                      type="button"
                      onClick={() => setOpenFilter(false)}
                      className="text-sm text-blue-700 hover:underline"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-blue-900/80">
              Showing {filtered.length} of {PROJECTS.length} projects
              {selectedSdgs.length > 0 && (
                <span>
                  {" "}
                  • SDGs: {selectedSdgs.sort((a, b) => a - b).join(", ")}
                </span>
              )}
            </p>
          </div>

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
