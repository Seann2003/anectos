"use client";

import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Loader2, Wallet, ShieldCheck, AlertTriangle } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { PublicKey, Transaction } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { useSendTransaction } from "@privy-io/react-auth/solana";
import { CONNECTION } from "@/lib/constants";
import {
  distributeFundsToOwnerIx,
  settleMatchingForProjectIx,
} from "@/lib/instructions";
import { projectPdaFromOwner, vaultPda, roundVaultPda } from "@/lib/pda";
import { lamportsToSol, solToLamports, formatSol } from "@/lib/utils";

export default function ProjectDashboardPage() {
  const [vaultBalance, setVaultBalance] = useState<number>(0);
  const [userWalletBalance, setUserWalletBalance] = useState<number>(0);
  const [currentFunding, setCurrentFunding] = useState<number>(0);
  // QF metrics
  const [matchingPoolSol, setMatchingPoolSol] = useState<number | null>(null);
  const [roundArea, setRoundArea] = useState<string | null>(null);
  const [projectArea, setProjectArea] = useState<string | null>(null);
  const [contributorCount, setContributorCount] = useState<number | null>(null);
  const [expectedSettlementSol, setExpectedSettlementSol] = useState<
    number | null
  >(null);
  const [projectPoolDistributedSol, setProjectPoolDistributedSol] = useState<
    number | null
  >(null);
  const [projectPoolRemainingSol, setProjectPoolRemainingSol] = useState<
    number | null
  >(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [fundingRoundId, setFundingRoundId] = useState<string | null>(null);
  const [firstMilestoneAchieved, setFirstMilestoneAchieved] =
    useState<boolean>(true);
  const [amount, setAmount] = useState<string>("");
  const [processing, setProcessing] = useState(false);
  const [activity, setActivity] = useState<string[]>([]);
  const [canSettle, setCanSettle] = useState<boolean>(false);
  const [projectUnlockedSol, setProjectUnlockedSol] = useState<number | null>(
    null
  );
  const { authenticated, user } = usePrivy();
  const { sendTransaction } = useSendTransaction();

  // Treat entered amount as SOL, convert to lamports for validation/tx
  const numericAmountSol = Math.max(0, Number(amount) || 0);
  const amountLamportsBig = solToLamports(numericAmountSol);
  const amountLamportsNum = Number(amountLamportsBig);
  const amountLamportsBN = new BN(amountLamportsBig.toString());
  const canWithdraw =
    !processing &&
    numericAmountSol > 0 &&
    firstMilestoneAchieved &&
    amountLamportsNum <= vaultBalance;

  async function handleDistribute() {
    if (!firstMilestoneAchieved) {
      toast.error("Vault condition failed", {
        description: "First milestone not achieved.",
      });
      return;
    }
    if (numericAmountSol <= 0) {
      toast.error("Invalid amount");
      return;
    }
    if (amountLamportsNum > vaultBalance) {
      toast.error("Insufficient project vault funds");
      return;
    }
    if (!authenticated || !user?.wallet?.address) {
      toast.error("Wallet not connected");
      return;
    }

    setProcessing(true);
    try {
      const ownerPk = new PublicKey(user.wallet.address);
      const [projectPk] = projectPdaFromOwner(ownerPk);
      const [vaultPk] = vaultPda(ownerPk);

      const ix = await distributeFundsToOwnerIx({
        owner: ownerPk,
        vaultPda: vaultPk,
        projectPda: projectPk,
        amount: amountLamportsBN,
      });
      const tx = new Transaction().add(ix);
      tx.feePayer = ownerPk;
      const { blockhash } = await CONNECTION.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      await sendTransaction({
        transaction: tx,
        connection: CONNECTION,
        address: user.wallet.address,
      });

      // Refresh balances after success
      try {
        const res = await fetch(
          `/api/round?owner=${encodeURIComponent(
            user.wallet.address
          )}&wallet=${encodeURIComponent(user.wallet.address)}`,
          { cache: "no-store" }
        );
        if (res.ok) {
          const data = await res.json();
          const vaultLamports = parseInt(data?.vaultBalanceLamports ?? "0", 10);
          const projLamports = parseInt(
            data?.projectCurrentFundingLamports ?? "0",
            10
          );
          const walletLamports = parseInt(
            data?.walletBalanceLamports ?? "0",
            10
          );
          setVaultBalance(Number.isFinite(vaultLamports) ? vaultLamports : 0);
          setCurrentFunding(Number.isFinite(projLamports) ? projLamports : 0);
          setUserWalletBalance(
            Number.isFinite(walletLamports) ? walletLamports : 0
          );
          // QF metrics
          setMatchingPoolSol(
            typeof data?.matchingPoolSol === "number"
              ? data.matchingPoolSol
              : null
          );
          setRoundArea(
            typeof data?.roundArea === "string" ? data.roundArea : null
          );
          setProjectArea(
            typeof data?.projectArea === "string" ? data.projectArea : null
          );
          setContributorCount(
            typeof data?.contributorCount === "number"
              ? data.contributorCount
              : null
          );
          setCanSettle(Boolean(data?.canSettle));
          setExpectedSettlementSol(
            typeof data?.expectedSettlementSol === "number"
              ? data.expectedSettlementSol
              : null
          );
          setProjectUnlockedSol(
            typeof data?.projectMatchingUnlockedLamports === "string"
              ? Number(data.projectMatchingUnlockedLamports) / 1_000_000_000
              : null
          );
          setProjectPoolDistributedSol(
            typeof data?.projectPoolDistributedLamports === "string"
              ? Number(data.projectPoolDistributedLamports) / 1_000_000_000
              : null
          );
          setProjectPoolRemainingSol(
            typeof data?.projectPoolRemainingLamports === "string"
              ? Number(data.projectPoolRemainingLamports) / 1_000_000_000
              : null
          );
          setProjectId(
            typeof data?.projectId === "string"
              ? data.projectId
              : typeof data?.projectPubkey === "string"
              ? data.projectPubkey
              : null
          );
          setFundingRoundId(
            typeof data?.fundingRoundId === "string"
              ? data.fundingRoundId
              : typeof data?.round === "string"
              ? data.round
              : null
          );
        }
      } catch {}

      setAmount("");
      const log = `Transferred ${formatSol(
        numericAmountSol
      )} from vault -> wallet`;
      setActivity((a) => [log, ...a].slice(0, 6));
      toast.success("Funds transferred", { description: log });
    } catch (e: any) {
      toast.error("Withdrawal failed", {
        description: e?.message ?? String(e),
      });
    } finally {
      setProcessing(false);
    }
  }

  // Fetch real balances from API when wallet is available
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        if (!authenticated || !user?.wallet?.address) return;
        const addr = user.wallet.address;
        const res = await fetch(
          `/api/round?owner=${encodeURIComponent(
            addr
          )}&wallet=${encodeURIComponent(addr)}`,
          { cache: "no-store" }
        );
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        console.log("Fetched round balances:", data);
        const vaultLamports = parseInt(data?.vaultBalanceLamports ?? "0", 10);
        const projLamports = parseInt(
          data?.projectCurrentFundingLamports ?? "0",
          10
        );
        const walletLamports = parseInt(data?.walletBalanceLamports ?? "0", 10);
        if (!cancelled) {
          setVaultBalance(Number.isFinite(vaultLamports) ? vaultLamports : 0);
          setCurrentFunding(Number.isFinite(projLamports) ? projLamports : 0);
          setUserWalletBalance(
            Number.isFinite(walletLamports) ? walletLamports : 0
          );
          // QF metrics
          setMatchingPoolSol(
            typeof data?.matchingPoolSol === "number"
              ? data.matchingPoolSol
              : null
          );
          setRoundArea(
            typeof data?.roundArea === "string" ? data.roundArea : null
          );
          setProjectArea(
            typeof data?.projectArea === "string" ? data.projectArea : null
          );
          setContributorCount(
            typeof data?.contributorCount === "number"
              ? data.contributorCount
              : null
          );
          setCanSettle(Boolean(data?.canSettle));
          // Identifiers
          setProjectId(
            typeof data?.projectId === "string"
              ? data.projectId
              : typeof data?.projectPubkey === "string"
              ? data.projectPubkey
              : null
          );
          setFundingRoundId(
            typeof data?.fundingRoundId === "string"
              ? data.fundingRoundId
              : typeof data?.round === "string"
              ? data.round
              : null
          );
          setExpectedSettlementSol(
            typeof data?.expectedSettlementSol === "number"
              ? data.expectedSettlementSol
              : null
          );
          setProjectUnlockedSol(
            typeof data?.projectMatchingUnlockedLamports === "string"
              ? Number(data.projectMatchingUnlockedLamports) / 1_000_000_000
              : null
          );
          setProjectPoolDistributedSol(
            typeof data?.projectPoolDistributedLamports === "string"
              ? Number(data.projectPoolDistributedLamports) / 1_000_000_000
              : null
          );
          setProjectPoolRemainingSol(
            typeof data?.projectPoolRemainingLamports === "string"
              ? Number(data.projectPoolRemainingLamports) / 1_000_000_000
              : null
          );
        }
      } catch (e: any) {
        if (!cancelled)
          toast.error("Failed to load balances", {
            description: e?.message ?? String(e),
          });
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [authenticated, user?.wallet?.address]);

  async function handleSettleMatching() {
    if (!authenticated || !user?.wallet?.address) return;
    setProcessing(true);
    try {
      const ownerPk = new PublicKey(user.wallet.address);
      const [projectPk] = projectPdaFromOwner(ownerPk);
      // Fetch round data to get round pubkey
      const res = await fetch(
        `/api/round?owner=${encodeURIComponent(
          ownerPk.toBase58()
        )}&wallet=${encodeURIComponent(ownerPk.toBase58())}`,
        { cache: "no-store" }
      );
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const roundPk = new PublicKey(data.round);
      const [rvPk] = roundVaultPda(roundPk);
      const [vaultPk] = vaultPda(ownerPk);

      const ix = await settleMatchingForProjectIx({
        owner: ownerPk,
        fundingRound: roundPk,
        roundVault: rvPk,
        projectPda: projectPk,
        projectVault: vaultPk,
      });
      const tx = new Transaction().add(ix);
      tx.feePayer = ownerPk;
      const { blockhash } = await CONNECTION.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      await sendTransaction({
        transaction: tx,
        connection: CONNECTION,
        address: user.wallet.address,
      });

      // Refresh
      const refresh = await fetch(
        `/api/round?owner=${encodeURIComponent(
          ownerPk.toBase58()
        )}&wallet=${encodeURIComponent(ownerPk.toBase58())}`,
        { cache: "no-store" }
      );
      if (refresh.ok) {
        const d = await refresh.json();
        console.log("Post-settlement refresh:", d);
        const vaultLamports = parseInt(d?.vaultBalanceLamports ?? "0", 10);
        const projLamports = parseInt(
          d?.projectCurrentFundingLamports ?? "0",
          10
        );
        const walletLamports = parseInt(d?.walletBalanceLamports ?? "0", 10);
        setVaultBalance(Number.isFinite(vaultLamports) ? vaultLamports : 0);
        setCurrentFunding(Number.isFinite(projLamports) ? projLamports : 0);
        setUserWalletBalance(
          Number.isFinite(walletLamports) ? walletLamports : 0
        );
        setMatchingPoolSol(
          typeof d?.matchingPoolSol === "number" ? d.matchingPoolSol : null
        );
        setRoundArea(typeof d?.roundArea === "string" ? d.roundArea : null);
        setProjectArea(
          typeof d?.projectArea === "string" ? d.projectArea : null
        );
        setContributorCount(
          typeof d?.contributorCount === "number" ? d.contributorCount : null
        );
        setCanSettle(Boolean(d?.canSettle));
        setExpectedSettlementSol(
          typeof d?.expectedSettlementSol === "number"
            ? d.expectedSettlementSol
            : null
        );
        setProjectUnlockedSol(
          typeof d?.projectMatchingUnlockedLamports === "string"
            ? Number(d.projectMatchingUnlockedLamports) / 1_000_000_000
            : null
        );
        setProjectPoolDistributedSol(
          typeof d?.projectPoolDistributedLamports === "string"
            ? Number(d.projectPoolDistributedLamports) / 1_000_000_000
            : null
        );
        setProjectPoolRemainingSol(
          typeof d?.projectPoolRemainingLamports === "string"
            ? Number(d.projectPoolRemainingLamports) / 1_000_000_000
            : null
        );
        setProjectId(
          typeof d?.projectId === "string"
            ? d.projectId
            : typeof d?.projectPubkey === "string"
            ? d.projectPubkey
            : null
        );
        setFundingRoundId(
          typeof d?.fundingRoundId === "string"
            ? d.fundingRoundId
            : typeof d?.round === "string"
            ? d.round
            : null
        );
      }
      setActivity((a) => ["Settled matching funds", ...a].slice(0, 6));
      toast.success("Matching settled");
    } catch (e: any) {
      toast.error("Settlement failed", {
        description: e?.message ?? String(e),
      });
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Toaster position="top-right" richColors closeButton />
      <h1 className="text-2xl font-semibold">Project Dashboard</h1>
      <p className="text-gray-600 mt-2">
        Distribute funds from project vault to owner wallet.
      </p>

      {/* Balances */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border bg-white p-4">
          <div className="text-xs text-gray-500">Vault Balance</div>
          <div className="mt-1 font-mono">
            {formatSol(lamportsToSol(vaultBalance))}
          </div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="text-xs text-gray-500">Current Project Funding</div>
          <div className="mt-1 font-mono">
            {formatSol(lamportsToSol(currentFunding))}
          </div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="text-xs text-gray-500">Your Wallet Balance</div>
          <div className="mt-1 font-mono">
            {formatSol(lamportsToSol(userWalletBalance))}
          </div>
        </div>
      </div>

      {/* QF Metrics */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border bg-white p-4">
          <div className="text-xs text-gray-500">Matching Pool</div>
          <div className="mt-1 font-mono">
            {matchingPoolSol == null ? "-" : formatSol(matchingPoolSol)}
          </div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="text-xs text-gray-500">
            Pool Distributed (Project)
          </div>
          <div className="mt-1 font-mono">
            {projectPoolDistributedSol == null
              ? "-"
              : formatSol(projectPoolDistributedSol)}
          </div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="text-xs text-gray-500">Pool Remaining (Project)</div>
          <div className="mt-1 font-mono">
            {projectPoolRemainingSol == null
              ? "-"
              : formatSol(projectPoolRemainingSol)}
          </div>
        </div>
        <div className="rounded-lg border bg-white p-4 md:col-span-3">
          <div className="text-xs text-gray-500">
            Unlocked from Pool (Project)
          </div>
          <div className="mt-1 font-mono">
            {projectUnlockedSol == null || matchingPoolSol == null
              ? "-"
              : `${formatSol(projectUnlockedSol)} / ${formatSol(
                  matchingPoolSol
                )}`}
          </div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="text-xs text-gray-500">QF Area (Project)</div>
          <div className="mt-1 font-mono">{projectArea ?? "-"}</div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="text-xs text-gray-500">QF Area (Round)</div>
          <div className="mt-1 font-mono">{roundArea ?? "-"}</div>
        </div>
      </div>

      <div className="mt-2 text-xs text-gray-500">
        Contributors: {contributorCount ?? "-"}
      </div>

      {/* Identifiers */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border bg-white p-4">
          <div className="text-xs text-gray-500">Project ID</div>
          <div className="mt-1 font-mono break-all text-sm">
            {projectId ?? "-"}
          </div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="text-xs text-gray-500">Funding Round ID</div>
          <div className="mt-1 font-mono break-all text-sm">
            {fundingRoundId ?? "-"}
          </div>
        </div>
      </div>

      {/* Vault requirements */}
      <div className="mt-6 rounded-lg border bg-white p-4">
        <div className="font-medium mb-2">Vault Conditions</div>
        <div className="flex items-center gap-2 text-sm">
          {firstMilestoneAchieved ? (
            <>
              <ShieldCheck className="h-4 w-4 text-green-600" /> First milestone
              is achieved
            </>
          ) : (
            <>
              <AlertTriangle className="h-4 w-4 text-yellow-600" /> First
              milestone must be completed before withdrawal
            </>
          )}
        </div>
      </div>

      {/* Distribute funds control */}
      <div className="mt-6 rounded-lg border bg-white p-4">
        <div className="font-medium">Withdraw Funds</div>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount to withdraw (SOL)
            </label>
            <input
              type="number"
              min={0.000000001}
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {amountLamportsNum > vaultBalance && (
              <div className="mt-1 text-xs text-red-600">
                Amount exceeds vault balance.
              </div>
            )}
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleDistribute}
              disabled={!canWithdraw}
              className={`w-full inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-white ${
                canWithdraw ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400"
              }`}
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Processing...
                </>
              ) : (
                <>
                  <Wallet className="h-4 w-4" /> Distribute Funds
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Matching Settlement */}
      <div className="mt-6 rounded-lg border bg-white p-4">
        <div className="font-medium">Matching Funds</div>
        <div className="mt-2 text-xs text-gray-600">
          Expected settlement:{" "}
          {expectedSettlementSol == null
            ? "-"
            : formatSol(expectedSettlementSol)}
        </div>
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={handleSettleMatching}
            disabled={!canSettle || processing}
            className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-white ${
              !canSettle || processing
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
            title={
              !canSettle
                ? "Cannot settle now"
                : "Settle proportional matching from the pool"
            }
          >
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Settling...
              </>
            ) : (
              <>Settle Matching</>
            )}
          </button>
          <span className="text-xs text-gray-500">
            Settles your project’s proportional share from the matching pool.
          </span>
        </div>
      </div>

      {/* Activity */}
      <div className="mt-6 rounded-lg border bg-white p-4">
        <div className="font-medium mb-2">Recent Activity</div>
        {activity.length === 0 ? (
          <div className="text-sm text-gray-600">No activity yet.</div>
        ) : (
          <ul className="text-sm list-disc ml-5 space-y-1">
            {activity.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
