"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { usePrivy } from "@privy-io/react-auth";
import { useSendTransaction } from "@privy-io/react-auth/solana";
import { PublicKey, Transaction } from "@solana/web3.js";
import { CONNECTION } from "@/lib/constants";
import {
  contributeIx,
  fundProjectPoolIx,
  createRoundVaultIx,
} from "@/lib/instructions";
import { projectMetadataPda, vaultPda, roundVaultPda } from "@/lib/pda";
import { lamportsToSol, solToLamports, formatSol } from "@/lib/utils";
import { BN } from "@coral-xyz/anchor";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

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
    currency: "SOL",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function ProjectDetailPage() {
  const params = useParams();
  const id = (params?.id as string) ?? "";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<UiProject | null>(null);
  const [donateOpen, setDonateOpen] = useState(false);
  const [amountSol, setAmountSol] = useState<string>("");
  const [sending, setSending] = useState(false);
  const [balanceLamports, setBalanceLamports] = useState<bigint | null>(null);
  const [isRoundOwner, setIsRoundOwner] = useState<boolean>(false);
  const [settlementInfo, setSettlementInfo] = useState<{
    expectedSettlementLamports: bigint;
    poolTotalLamports: bigint;
  } | null>(null);

  // Add state for comments
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  const { user, authenticated } = usePrivy();
  const { sendTransaction } = useSendTransaction();
  const [adminAmountSol, setAdminAmountSol] = useState<string>("");
  const [adminBusy, setAdminBusy] = useState<boolean>(false);

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

  // Fetch SOL balance when wallet available
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        if (!user?.wallet?.address) return;
        const pk = new PublicKey(user.wallet.address);
        const lamports = await CONNECTION.getBalance(pk, "confirmed");
        if (!cancelled) setBalanceLamports(BigInt(lamports));
      } catch (e) {
        // ignore
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [user?.wallet?.address]);

  // Fetch expected settlement + pool total for this project
  useEffect(() => {
    let cancelled = false;
    const fetchSettlement = async () => {
      try {
        if (!project?.id) return;
        const res = await fetch(`/api/round?project=${project.id}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        const expStr = data?.expectedSettlementLamports as string | undefined;
        const poolStr = (data?.projectMatchingPoolLamports ||
          data?.matchingPoolLamports) as string | undefined;
        if (expStr && poolStr) {
          const expectedSettlementLamports = (() => {
            try {
              return BigInt(expStr);
            } catch {
              return BigInt(0);
            }
          })();
          const poolTotalLamports = (() => {
            try {
              return BigInt(poolStr);
            } catch {
              return BigInt(0);
            }
          })();
          if (!cancelled)
            setSettlementInfo({
              expectedSettlementLamports,
              poolTotalLamports,
            });
        } else if (!cancelled) {
          setSettlementInfo(null);
        }
      } catch {
        if (!cancelled) setSettlementInfo(null);
      }
    };
    fetchSettlement();
    return () => {
      cancelled = true;
    };
  }, [project?.id]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        if (!project?.id || !user?.wallet?.address) {
          if (!cancelled) setIsRoundOwner(false);
          return;
        }
        const res = await fetch(`/api/round?project=${project.id}`, {
          cache: "no-store",
        });
        if (!res.ok) {
          if (!cancelled) setIsRoundOwner(false);
          return;
        }
        const data = await res.json();
        const ro = (data?.roundOwner as string) || null;
        if (!cancelled)
          setIsRoundOwner(Boolean(ro && ro === user.wallet.address));
      } catch {
        if (!cancelled) setIsRoundOwner(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [project?.id, user?.wallet?.address]);

  const milestonesReached = useMemo(() => {
    if (!project) return [] as number[];
    return project.milestones.filter((m) => project.fundingRaised >= m);
  }, [project]);

  const getUsername = async (wallet: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("name")
      .eq("wallet_address", wallet)
      .single();
    return data?.name || "Anonymous";
  };

  // Add function to fetch comments
  const fetchComments = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from("comments")
        .select("id, body, author_name, created_at")
        .eq("post_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transform data for display
      const formattedComments = data.map((comment) => ({
        id: comment.id,
        content: comment.body,
        author: comment.author_name
          ? `${comment.author_name.substring(
              0,
              4
            )}...${comment.author_name.substring(
              comment.author_name.length - 4
            )}`
          : "Anonymous",
        initial: comment.author_name
          ? comment.author_name[0].toUpperCase()
          : "A",
        createdAt: new Date(comment.created_at).toLocaleDateString(),
      }));

      setComments(formattedComments);
    } catch (err) {
      console.error("Error fetching comments:", err);
    }
  };

  // Add function to submit a comment
  const submitComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!authenticated || !user?.wallet?.address || !newComment.trim()) {
      toast.error("Please sign in and enter a comment");
      return;
    }

    setSubmittingComment(true);

    try {
      const { error } = await supabase.from("comments").insert({
        post_id: id,
        body: newComment.trim(),
        author_name: await getUsername(user.wallet.address),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      // Clear input and refresh comments
      setNewComment("");
      toast.success("Comment posted successfully");
      fetchComments();
    } catch (err) {
      console.error("Error posting comment:", err);
      toast.error("Failed to post comment. Please try again.");
    } finally {
      setSubmittingComment(false);
    }
  };

  // Add useEffect to fetch comments when component mounts or id changes
  useEffect(() => {
    fetchComments();
  }, [id]);

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
                console.log(
                  "project.fundingRaised",
                  project.fundingRaised,
                  threshold
                );
                const reached = project.fundingRaised / 1000000000 >= threshold;
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
              {/* Admin: Fund this project's matching pool */}
              {isRoundOwner && (
                <div className="mt-6 rounded-lg border border-blue-100 bg-blue-50 p-4">
                  <div className="text-sm font-medium text-blue-900 mb-2">
                    Admin: Fund Project Matching Pool
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                    <label className="block">
                      <span className="text-xs text-blue-900">
                        Amount (SOL)
                      </span>
                      <Input
                        type="number"
                        min="0"
                        step="0.000001"
                        placeholder="e.g. 5"
                        value={adminAmountSol}
                        onChange={(e) => setAdminAmountSol(e.target.value)}
                      />
                    </label>
                    <div className="md:col-span-2 flex gap-2">
                      <Button
                        type="button"
                        disabled={
                          !authenticated || !user?.wallet?.address || adminBusy
                        }
                        onClick={async () => {
                          if (
                            !authenticated ||
                            !user?.wallet?.address ||
                            !project
                          )
                            return;
                          const sol = parseFloat(adminAmountSol || "0");
                          if (!isFinite(sol) || sol <= 0) return;
                          setAdminBusy(true);
                          try {
                            const me = new PublicKey(user.wallet.address);
                            const projectPk = new PublicKey(project.id);
                            // Need round and round vault PDA
                            const res = await fetch(
                              `/api/project?id=${project.id}`,
                              { cache: "no-store" }
                            );
                            const json = await res.json();
                            const roundStr = json?.project?.round as string;
                            if (!roundStr)
                              throw new Error("Missing round for project");
                            const roundPk = new PublicKey(roundStr);
                            const [rvPk] = roundVaultPda(roundPk);

                            const tx = new Transaction();
                            // Ensure round vault exists
                            const info = await CONNECTION.getAccountInfo(
                              rvPk,
                              "confirmed"
                            );
                            if (!info) {
                              const createIx = await createRoundVaultIx({
                                owner: me,
                                fundingRound: roundPk,
                                roundVault: rvPk,
                              });
                              tx.add(createIx);
                            }

                            const lamports = solToLamports(sol);
                            const ix = await fundProjectPoolIx({
                              funder: me,
                              fundingRound: roundPk,
                              project: projectPk,
                              roundVault: rvPk,
                              amount: new BN(lamports.toString()),
                            });
                            tx.add(ix);
                            tx.feePayer = me;
                            const { blockhash } =
                              await CONNECTION.getLatestBlockhash();
                            tx.recentBlockhash = blockhash;
                            await sendTransaction({
                              transaction: tx,
                              connection: CONNECTION,
                              address: user.wallet.address,
                            });
                            setAdminAmountSol("");
                          } catch (e) {
                            console.error("fundProjectPool failed:", e);
                          } finally {
                            setAdminBusy(false);
                          }
                        }}
                      >
                        {adminBusy ? "Processing…" : "Fund Project Pool"}
                      </Button>
                    </div>
                  </div>
                  <div className="text-[11px] text-blue-700/70 mt-2">
                    Deposits SOL into the round vault and increments this
                    project's matching pool budget.
                  </div>
                </div>
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
                      {lamportsToSol(project.fundingRaised)} SOL raised
                    </span>
                    <span className="text-blue-700/70">
                      Goal {formatUSD(project.fundingGoal)}
                    </span>
                  </div>
                  {settlementInfo && (
                    <div className="mt-2 text-xs text-blue-900/80 space-y-1">
                      <div>
                        Expected Settlement:{" "}
                        {formatSol(
                          lamportsToSol(
                            Number(settlementInfo.expectedSettlementLamports)
                          )
                        )}{" "}
                        SOL
                      </div>
                      <div>
                        Project Matching Pool:{" "}
                        {formatSol(
                          lamportsToSol(
                            Number(settlementInfo.poolTotalLamports)
                          )
                        )}{" "}
                        SOL
                      </div>
                      <div className="text-[10px] text-blue-700/60">
                        Settlement equals the currently estimated unlocked
                        matching allocation if settled now.
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-blue-900/70 text-sm">Loading…</div>
              )}
              {!isRoundOwner && (
                <Popover open={donateOpen} onOpenChange={setDonateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      className="mt-4 w-full rounded-lg bg-blue-600 hover:bg-blue-700 text-white py-2 text-sm font-medium"
                    >
                      Support project
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-blue-900">
                        Donate to this project
                      </div>
                      <div className="text-xs text-blue-700/70">
                        {authenticated && user?.wallet?.address ? (
                          <>
                            Balance:{" "}
                            {balanceLamports !== null
                              ? formatSol(lamportsToSol(balanceLamports))
                              : "—"}
                          </>
                        ) : (
                          <>Connect wallet to donate.</>
                        )}
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-blue-900">
                          Amount (SOL)
                        </label>
                        <Input
                          type="number"
                          min="0"
                          step="0.0001"
                          placeholder="0.1"
                          value={amountSol}
                          onChange={(e) => setAmountSol(e.target.value)}
                        />
                      </div>
                      <Button
                        type="button"
                        disabled={
                          sending ||
                          !authenticated ||
                          !user?.wallet?.address ||
                          !project
                        }
                        onClick={async () => {
                          if (
                            !project ||
                            !authenticated ||
                            !user?.wallet?.address
                          )
                            return;
                          const sol = parseFloat(amountSol || "0");
                          if (!isFinite(sol) || sol <= 0) return;
                          try {
                            setSending(true);
                            const adminPk = new PublicKey(user.wallet.address);
                            const projectPk = new PublicKey(project.id);
                            // Derive PDAs: project vault is based on owner, but we don't have owner here.
                            // However, the on-chain contribute expects `vault` PDA seeded by project.owner.
                            // We don't have owner in UiProject, so fetch project account quickly.
                            const res = await fetch(
                              `/api/project?id=${project.id}`,
                              { cache: "no-store" }
                            );
                            const json = await res.json();
                            const ownerStr = json?.project?.owner as string;
                            const roundStr = json?.project?.round as string;
                            if (!ownerStr || !roundStr)
                              throw new Error("Missing owner or round");
                            const ownerPk = new PublicKey(ownerStr);
                            const roundPk = new PublicKey(roundStr);
                            const [vaultPk] = vaultPda(ownerPk);

                            const ix = await contributeIx({
                              fundingRound: roundPk,
                              projectPda: projectPk,
                              vaultPda: vaultPk,
                              user: adminPk,
                              amount: Number(solToLamports(sol)), // lamports
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
                            setDonateOpen(false);
                            setAmountSol("");
                          } catch (e) {
                            console.error("contribute failed:", e);
                          } finally {
                            setSending(false);
                          }
                        }}
                      >
                        {sending ? "Processing…" : "Donate"}
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
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
          <form
            className="mt-4 border-t border-blue-100 pt-4"
            onSubmit={submitComment}
          >
            <label
              htmlFor="new-comment"
              className="block text-sm font-medium text-blue-900 mb-1"
            >
              Add a comment
            </label>
            <textarea
              id="new-comment"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="w-full rounded-lg border border-blue-200 bg-white/90 px-3 py-2 text-sm text-blue-900 placeholder:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Share your thoughts..."
              rows={3}
            />
            <div className="mt-2 flex justify-end">
              <Button
                type="submit"
                className="rounded-lg bg-blue-700 text-white text-sm font-medium px-4 py-2"
              >
                Post
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
