"use client";

import { useMemo } from "react";
import { notFound, useParams } from "next/navigation";
import { getProjectById, formatUSD } from "../data";
import { Button } from "@/components/ui/button";

export default function ProjectDetailPage() {
  const params = useParams();
  const id = (params?.id as string) ?? "";

  const project = useMemo(() => getProjectById(id), [id]);
  if (!project) return notFound();

  const percent = Math.min(
    100,
    Math.round((project.fundingRaised / project.fundingGoal) * 100)
  );
  const milestonesReached = project.milestones.filter(
    (m) => project.fundingRaised >= m
  );

  // Fake discussion data for now; easy to replace with Supabase later
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
        <div className="mb-6">
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

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <div className="rounded-xl border border-blue-100 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-blue-900 mb-2">
                About this project
              </h2>
              <p className="text-blue-900/80 leading-relaxed">
                {project.description}
              </p>
            </div>

            {/* Discussion Panel */}
            <div className="rounded-xl border border-blue-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-blue-900">
                  Discussion
                </h2>
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
                      <p className="text-sm text-blue-900/90 mt-1">
                        {c.content}
                      </p>
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

          <div>
            <div className="rounded-xl border border-blue-100 bg-white p-5 shadow-sm md:sticky md:top-6">
              <h2 className="text-lg font-semibold text-blue-900 mb-3">
                Funding
              </h2>
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
              <Button
                type="button"
                className="mt-4 w-full rounded-lg bg-blue-600 hover:bg-blue-700 text-white py-2 text-sm font-medium"
              >
                Support project
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-blue-100 bg-white p-5 shadow-sm">
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
      </div>
    </div>
  );
}
