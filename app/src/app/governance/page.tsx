"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronRight,
  Coins,
  Loader2,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

type Project = {
  id: string;
  title: string;
  shortDescription: string;
  requestedAmountUsd: number;
  proposer: string;
  imageUrl?: string;
  quorum: number;
  yesVotes: number;
  noVotes: number;
};

const MOCK_PROJECTS: Project[] = [
  {
    id: "p1",
    title: "Solar Water Purification for Rural Communities",
    shortDescription:
      "Deploy solar-powered water purification units to serve 10 villages.",
    requestedAmountUsd: 50000,
    proposer: "0x12...9ab",
    imageUrl: "/Solar Water Purification for Rural Communities.png",
    quorum: 60,
    yesVotes: 120_000,
    noVotes: 15_000,
  },
  {
    id: "p2",
    title: "Regenerative Agriculture Training Program",
    shortDescription:
      "Train 200 farmers in regenerative practices to restore soil health.",
    requestedAmountUsd: 80000,
    proposer: "0x8f...c31",
    imageUrl: "/Regenerative Agriculture Training Program.png",
    quorum: 55,
    yesVotes: 35_000,
    noVotes: 20_000,
  },
  {
    id: "p3",
    title: "Ocean Plastic Cleanup Technology",
    shortDescription:
      "Pilot a low-cost cleanup device to remove plastic from coastal waters.",
    requestedAmountUsd: 65000,
    proposer: "0xa3...e44",
    imageUrl: "/Ocean Plastic Cleanup Technology.png",
    quorum: 50,
    yesVotes: 10_000,
    noVotes: 5_000,
  },
];

export default function GovernancePage() {
  const [userBalance] = useState<number>(75_000);
  const [projects, setProjects] = useState<Project[]>([...MOCK_PROJECTS]);
  const [selectedId, setSelectedId] = useState<string | null>(
    MOCK_PROJECTS[0].id
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("governance.approved.v1");
      if (!raw) return;
      const approved = JSON.parse(raw) as Array<{
        id: string;
        title: string;
        description: string;
        target_amount: number;
        sdg_goals: number[];
      }>;
      if (!approved?.length) return;
      const mapped: Project[] = approved.map((a) => ({
        id: `approved-${a.id}`,
        title: a.title,
        shortDescription: a.description,
        requestedAmountUsd: a.target_amount,
        proposer: "approved",
        quorum: 60,
        yesVotes: 0,
        noVotes: 0,
      }));
      setProjects((prev) => {
        const ids = new Set(prev.map((p) => p.id));
        const add = mapped.filter((m) => !ids.has(m.id));
        return [...add, ...prev];
      });
    } catch {}
  }, []);

  const selected = useMemo(() => {
    const found = projects.find((p) => p.id === selectedId);
    return found ?? projects[0]!;
  }, [projects, selectedId]);

  const totalVotes = selected.yesVotes + selected.noVotes;
  const yesPct = totalVotes
    ? Math.round((selected.yesVotes / totalVotes) * 100)
    : 0;
  const noPct = 100 - yesPct;
  const quorumReached = yesPct >= selected.quorum;

  const [voteWeight, setVoteWeight] = useState<number>(10_000);
  const [voteChoice, setVoteChoice] = useState<"yes" | "no" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canVote =
    userBalance >= voteWeight && voteWeight > 0 && voteChoice !== null;

  function handleSelectProject(id: string) {
    setSelectedId(id);
    setVoteWeight(10_000);
    setVoteChoice(null);
    setSubmitting(false);
    setError(null);
  }

  async function submitVote() {
    setError(null);
    if (!canVote) {
      setError("You must select a vote and have sufficient tokens.");
      toast.error("Unable to submit vote", {
        description:
          "Select Yes/No and ensure vote weight is within your balance.",
      });
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1200));
    setProjects((prev) =>
      prev.map((p) =>
        p.id === selected.id
          ? {
              ...p,
              yesVotes: p.yesVotes + (voteChoice === "yes" ? voteWeight : 0),
              noVotes: p.noVotes + (voteChoice === "no" ? voteWeight : 0),
            }
          : p
      )
    );
    setSubmitting(false);
    toast.success("Vote submitted", {
      description: `You voted ${voteChoice?.toUpperCase()} with ${voteWeight.toLocaleString()} ANCT on “${
        selected.title
      }”.`,
    });
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Toaster position="top-right" richColors closeButton />
      <h1 className="text-2xl font-semibold">Governance</h1>
      <p className="text-gray-600 mt-2">
        Review projects awaiting whitelisting and cast your token-weighted vote.
      </p>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className="rounded-lg border bg-white">
            <div className="px-4 py-3 border-b font-medium">
              Projects awaiting whitelist
            </div>
            <ul className="divide-y">
              {projects.map((p) => (
                <li
                  key={p.id}
                  className={`px-4 py-3 hover:bg-gray-50 cursor-pointer ${
                    selectedId === p.id ? "bg-blue-50" : ""
                  }`}
                  onClick={() => handleSelectProject(p.id)}
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
                        {p.shortDescription}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        Requested: ${p.requestedAmountUsd.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="md:col-span-2">
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
                  <div className="text-xs text-gray-500">
                    Proposer: {selected.proposer}
                  </div>
                </div>
                <p className="text-sm text-gray-700 mt-1">
                  {selected.shortDescription}
                </p>
                <div className="text-sm text-gray-600 mt-1">
                  Requested funding: $
                  {selected.requestedAmountUsd.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-md border px-3 py-2 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-700">
                <Coins className="h-4 w-4" />
                <span>Your token balance</span>
              </div>
              <div className="font-mono">
                {userBalance.toLocaleString()} ANCT
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <ThumbsUp className="h-4 w-4 text-green-600" /> Yes
                </div>
                <div>{yesPct}%</div>
              </div>
              <div className="h-2 w-full bg-gray-200 rounded overflow-hidden mt-1">
                <div
                  className="h-full bg-green-500"
                  style={{ width: `${yesPct}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-sm text-gray-700 mt-2">
                <div className="flex items-center gap-2">
                  <ThumbsDown className="h-4 w-4 text-red-600" /> No
                </div>
                <div>{noPct}%</div>
              </div>
              <div className="h-2 w-full bg-gray-200 rounded overflow-hidden mt-1">
                <div
                  className="h-full bg-red-500"
                  style={{ width: `${noPct}%` }}
                />
              </div>
              <div className="mt-3 text-xs text-gray-600">
                Quorum required: {selected.quorum}% —{" "}
                {quorumReached ? (
                  <span className="text-green-700 inline-flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" /> Reached
                  </span>
                ) : (
                  <span>Not yet reached</span>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-between gap-4">
              <div className="flex items-end gap-2">
                <button
                  type="button"
                  onClick={() => setVoteChoice("yes")}
                  className={`flex-1 inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2 ${
                    voteChoice === "yes"
                      ? "bg-green-600 text-white"
                      : "bg-white hover:bg-green-50"
                  }`}
                >
                  <ThumbsUp className="h-4 w-4" /> Yes
                </button>
                <button
                  type="button"
                  onClick={() => setVoteChoice("no")}
                  className={`flex-1 inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2 ${
                    voteChoice === "no"
                      ? "bg-red-600 text-white"
                      : "bg-white hover:bg-red-50"
                  }`}
                >
                  <ThumbsDown className="h-4 w-4" /> No
                </button>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={submitVote}
                  disabled={!canVote || submitting}
                  className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-white ${
                    !canVote || submitting
                      ? "bg-gray-400"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                    </>
                  ) : (
                    <>Submit Vote</>
                  )}
                </button>
                {error && <div className="text-red-700 text-sm">{error}</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
