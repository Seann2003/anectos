"use client";

import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Loader2, Wallet, ShieldCheck, AlertTriangle } from "lucide-react";

export default function ProjectDashboardPage() {
  // Fake on-chain state mirrors
  const [vaultBalance, setVaultBalance] = useState<number>(125_000_000);
  const [userWalletBalance, setUserWalletBalance] = useState<number>(3_500_000);
  const [currentFunding, setCurrentFunding] = useState<number>(210_000_000);
  const [firstMilestoneAchieved, setFirstMilestoneAchieved] =
    useState<boolean>(true);
  const [amount, setAmount] = useState<string>("");
  const [processing, setProcessing] = useState(false);
  const [activity, setActivity] = useState<string[]>([]);

  const numericAmount = Math.max(0, Number(amount) || 0);
  const canWithdraw =
    !processing &&
    numericAmount > 0 &&
    firstMilestoneAchieved &&
    numericAmount <= vaultBalance;

  async function handleDistribute() {
    // Steps 3-6 simulated
    if (!firstMilestoneAchieved) {
      toast.error("Vault condition failed", {
        description: "First milestone not achieved.",
      });
      return;
    }
    if (numericAmount <= 0) {
      toast.error("Invalid amount");
      return;
    }
    if (numericAmount > vaultBalance) {
      toast.error("Insufficient project vault funds");
      return;
    }

    setProcessing(true);
    toast.info("Processing withdrawal", {
      description: "Submitting distribute_funds_to_owner (simulated)...",
    });
    await new Promise((r) => setTimeout(r, 1200));

    // Update local balances to simulate transfer
    setVaultBalance((v) => v - numericAmount);
    setUserWalletBalance((b) => b + numericAmount);
    setCurrentFunding((c) => Math.max(0, c - numericAmount));
    setProcessing(false);
    setAmount("");

    const log = `Transferred ${numericAmount.toLocaleString()} from vault -> wallet`;
    setActivity((a) => [log, ...a].slice(0, 6));
    toast.success("Funds transferred", { description: log });
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Toaster position="top-right" richColors closeButton />
      <h1 className="text-2xl font-semibold">Project Dashboard</h1>
      <p className="text-gray-600 mt-2">
        Distribute funds from project vault to owner wallet (UI only,
        simulated).
      </p>

      {/* Balances */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border bg-white p-4">
          <div className="text-xs text-gray-500">Vault Balance</div>
          <div className="mt-1 font-mono">
            {vaultBalance.toLocaleString()} lamports
          </div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="text-xs text-gray-500">Current Project Funding</div>
          <div className="mt-1 font-mono">
            {currentFunding.toLocaleString()} lamports
          </div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="text-xs text-gray-500">Your Wallet Balance</div>
          <div className="mt-1 font-mono">
            {userWalletBalance.toLocaleString()} lamports
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
        <div className="font-medium">Distribute Funds</div>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount to withdraw (lamports)
            </label>
            <input
              type="number"
              min={1}
              step={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {numericAmount > vaultBalance && (
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
