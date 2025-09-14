import { useState, useEffect, useCallback } from "react";
import { useAuth, useWallet } from "@crossmint/client-sdk-react-ui";
import { Connection, PublicKey } from "@solana/web3.js";
import { getAccount, getAssociatedTokenAddress } from "@solana/spl-token";
import {
  governanceDemo,
  type GovernanceProposal,
} from "../lib/governance-demo";

export { type GovernanceProposal } from "../lib/governance-demo";

// ACTS Token Configuration
const ACTS_TOKEN_MINT = new PublicKey(process.env.NEXT_PUBLIC_ACTS_TOKEN_MINT!);
const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL!;
const connection = new Connection(SOLANA_RPC_URL);

export function useGovernance() {
  const { user } = useAuth();
  const { wallet } = useWallet();
  const [proposals, setProposals] = useState<GovernanceProposal[]>([]);
  const [userVotingPower, setUserVotingPower] = useState(0);
  const [userActsBalance, setUserActsBalance] = useState(0);
  const [hasVoted, setHasVoted] = useState<{ [proposalId: string]: boolean }>(
    {}
  );
  const [loading, setLoading] = useState(false);

  // Fetch real ACTS token balance
  useEffect(() => {
    const fetchTokenBalance = async () => {
      if (wallet && user && wallet.address) {
        try {
          setLoading(true);

          // Get user's wallet public key
          const walletPublicKey = new PublicKey(wallet.address);

          // Get associated token address for ACTS token
          const tokenAccountAddress = await getAssociatedTokenAddress(
            ACTS_TOKEN_MINT,
            walletPublicKey
          );

          try {
            // Fetch token account info
            const tokenAccount = await getAccount(
              connection,
              tokenAccountAddress
            );
            const balance = Number(tokenAccount.amount) / Math.pow(10, 9); // Assuming 9 decimals

            setUserActsBalance(balance);
            setUserVotingPower(balance); // 1:1 ratio for simplicity

            console.log(`ACTS Token Balance: ${balance} tokens`);
          } catch (error) {
            // Token account doesn't exist, user has 0 balance
            console.log("No ACTS token account found, balance is 0");
            setUserActsBalance(0);
            setUserVotingPower(0);
          }

          // Load proposals
          setProposals(governanceDemo.getProposals());

          // Check voting status
          const votingStatus: { [proposalId: string]: boolean } = {};
          const userAddress = wallet.address || user.id || "anonymous";
          governanceDemo.getProposals().forEach((proposal) => {
            votingStatus[proposal.id] = governanceDemo.hasVoted(
              proposal.id,
              userAddress
            );
          });
          setHasVoted(votingStatus);
        } catch (error) {
          console.error("Error fetching ACTS token balance:", error);
          // Fallback to demo balance for testing
          setUserActsBalance(2500);
          setUserVotingPower(2500);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchTokenBalance();
  }, [wallet, user]);

  /**
   * Create a new proposal to whitelist a project
   */
  const createProposal = useCallback(
    async (projectData: {
      id: string;
      title: string;
      description: string;
      targetAmount: number;
      sdgGoals: string[];
      category: string;
    }) => {
      if (!wallet || !user) {
        throw new Error("Wallet not connected");
      }

      setLoading(true);
      try {
        const userAddress = wallet.address || user.id || "anonymous";
        const proposalId = await governanceDemo.createProposal(
          projectData,
          userAddress
        );

        // Refresh proposals
        setProposals(governanceDemo.getProposals());

        return proposalId;
      } catch (error) {
        console.error("Error creating proposal:", error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [wallet, user]
  );

  /**
   * Cast a vote on a proposal
   */
  const castVote = useCallback(
    async (
      proposalId: string,
      voteChoice: "yes" | "no",
      voteAmount: number
    ) => {
      if (!wallet || !user) {
        throw new Error("Wallet not connected");
      }

      if (hasVoted[proposalId]) {
        throw new Error("You have already voted on this proposal");
      }

      if (voteAmount > userVotingPower) {
        throw new Error("Insufficient voting power");
      }

      setLoading(true);
      try {
        const userAddress = wallet.address || user.id || "anonymous";
        await governanceDemo.castVote(
          proposalId,
          voteChoice,
          voteAmount,
          userAddress
        );

        // Update local state
        setHasVoted((prev) => ({ ...prev, [proposalId]: true }));
        setUserVotingPower((prev) => prev - voteAmount);
        setProposals(governanceDemo.getProposals());
      } catch (error) {
        console.error("Error casting vote:", error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [wallet, user, hasVoted, userVotingPower]
  );

  /**
   * Execute a completed proposal
   */
  const executeProposal = useCallback(
    async (proposalId: string) => {
      if (!wallet || !user) {
        throw new Error("Wallet not connected");
      }

      setLoading(true);
      try {
        const userAddress = wallet.address || user.id || "anonymous";
        await governanceDemo.executeProposal(proposalId, userAddress);

        // Refresh proposals
        setProposals(governanceDemo.getProposals());
      } catch (error) {
        console.error("Error executing proposal:", error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [wallet, user]
  );

  /**
   * Check if a proposal can be executed
   */
  const canExecuteProposal = useCallback((proposal: GovernanceProposal) => {
    const stats = governanceDemo.getProposalStats(proposal.id);
    return stats?.canExecute || false;
  }, []);

  /**
   * Get proposal statistics
   */
  const getProposalStats = useCallback((proposal: GovernanceProposal) => {
    return governanceDemo.getProposalStats(proposal.id);
  }, []);

  return {
    // State
    proposals,
    userVotingPower,
    userActsBalance,
    hasVoted,
    loading,

    // Actions
    createProposal,
    castVote,
    executeProposal,
    canExecuteProposal,
    getProposalStats,
  };
}
