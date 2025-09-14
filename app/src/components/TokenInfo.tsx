"use client";
import { useState, useEffect } from "react";
import { useAuth, useWallet } from "@crossmint/client-sdk-react-ui";
import {
  ACTS_TOKEN_MINT,
  GOVERNANCE_REALM_NAME,
  GOVERNANCE_VOTING_THRESHOLD,
  SOLANA_NETWORK,
} from "../lib/constants";
import {
  getActsTokenBalance,
  formatActsAmount,
  getActsTokenInfo,
} from "../lib/token-utils";

export default function TokenInfo() {
  const { user } = useAuth();
  const { wallet } = useWallet();
  const [userBalance, setUserBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const tokenInfo = getActsTokenInfo();

  // Fetch user's ACTS token balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (wallet?.address) {
        setLoading(true);
        try {
          const balance = await getActsTokenBalance(wallet.address);
          setUserBalance(balance);
        } catch (error) {
          console.error("Error fetching token balance:", error);
          setUserBalance(0);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchBalance();
  }, [wallet?.address]);

  return (
    <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg">
      <h2 className="text-xl font-bold mb-4">ACTS Token Information</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
              Token Name
            </label>
            <p className="text-lg font-semibold">
              {tokenInfo.name} ({tokenInfo.symbol})
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
              Mint Address
            </label>
            <p className="text-sm font-mono bg-white dark:bg-gray-700 p-2 rounded break-all">
              {tokenInfo.mint}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
              Network
            </label>
            <p className="text-lg capitalize">{SOLANA_NETWORK}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
              Governance Realm
            </label>
            <p className="text-lg font-semibold">{GOVERNANCE_REALM_NAME}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
              Voting Threshold
            </label>
            <p className="text-lg">{GOVERNANCE_VOTING_THRESHOLD}%</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Supply
            </label>
            <p className="text-lg font-semibold">
              {tokenInfo.totalSupply} ACTS
            </p>
          </div>

          {/* User Balance Section - Only show if wallet connected */}
          {wallet?.address && (
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                Your Balance
              </label>
              {loading ? (
                <p className="text-lg text-gray-500">Loading...</p>
              ) : (
                <p className="text-lg font-semibold text-green-600">
                  {formatActsAmount(userBalance)} ACTS
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-300 dark:border-gray-600">
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href={`https://explorer.solana.com/address/${tokenInfo.mint}?cluster=${SOLANA_NETWORK}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            View on Solana Explorer
            <svg
              className="ml-2 w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>

          {wallet?.address && userBalance >= 10000 && (
            <a
              href="/admin/governance"
              className="inline-flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              Access Admin Dashboard
              <svg
                className="ml-2 w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                />
              </svg>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
