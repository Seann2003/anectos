/**
 * Anectos DAO Governance Demo
 *
 * This script demonstrates the complete governance workflow:
 * 1. Create a proposal for project whitelisting
 * 2. Vote on proposals
 * 3. Execute approved proposals
 *
 * Based on the realms-workshop implementation
 */

import { useState, useCallback } from "react";
import { useAuth, useWallet } from "@crossmint/client-sdk-react-ui";
import { PublicKey } from "@solana/web3.js";
import { ACTS_TOKEN_MINT, CONNECTION } from "./constants";

// Mock implementation demonstrating governance workflow
export interface GovernanceProposal {
  id: string;
  name: string;
  description: string;
  proposer: string;
  status: "draft" | "voting" | "completed" | "cancelled" | "executing";
  votesFor: number;
  votesAgainst: number;
  voteThreshold: number;
  quorumThreshold: number;
  timeLeft: number;
  projectId?: string;
  category: string;
  requestedAmount: number;
  sdgGoals: string[];
  created: string;
  executed?: boolean;
}

export interface ProjectData {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  category: string;
  sdgGoals: string[];
}

export class AnectosGovernanceDemo {
  private static instance: AnectosGovernanceDemo;
  private proposals: GovernanceProposal[] = [];
  private votes: { [proposalId: string]: { [wallet: string]: "yes" | "no" } } =
    {};

  private constructor() {
    // Initialize with demo proposals
    this.proposals = [
      {
        id: "prop-1",
        name: "Whitelist Project: Ocean Cleanup Initiative",
        description:
          "Proposal to whitelist the autonomous ocean plastic cleanup robot project for funding eligibility. This innovative project aims to remove plastic waste from oceans using AI-powered robots.",
        proposer: "OceanTech.sol",
        status: "voting",
        votesFor: 1250,
        votesAgainst: 350,
        voteThreshold: 60,
        quorumThreshold: 1000,
        timeLeft: 2,
        projectId: "ocean-cleanup-001",
        category: "Environmental",
        requestedAmount: 100000,
        sdgGoals: ["Life Below Water", "Innovation"],
        created: "2024-01-15",
      },
      {
        id: "prop-2",
        name: "Whitelist Project: Solar Microgrid Network",
        description:
          "Proposal to whitelist the rural solar microgrid project for remote communities. This project will provide clean energy access to underserved areas.",
        proposer: "SolarPower.sol",
        status: "completed",
        votesFor: 1800,
        votesAgainst: 200,
        voteThreshold: 60,
        quorumThreshold: 1500,
        timeLeft: 0,
        projectId: "solar-grid-002",
        category: "Energy",
        requestedAmount: 150000,
        sdgGoals: ["Affordable and Clean Energy", "Reduced Inequalities"],
        created: "2024-01-10",
        executed: false,
      },
    ];
  }

  public static getInstance(): AnectosGovernanceDemo {
    if (!AnectosGovernanceDemo.instance) {
      AnectosGovernanceDemo.instance = new AnectosGovernanceDemo();
    }
    return AnectosGovernanceDemo.instance;
  }

  /**
   * Create a new governance proposal
   * In real implementation, this would interact with SPL Governance program
   */
  async createProposal(
    projectData: ProjectData,
    proposerWallet: string
  ): Promise<string> {
    console.log("🏛️ Creating governance proposal...");
    console.log("📊 Project:", projectData.title);
    console.log(
      "💰 Requested Amount:",
      `$${projectData.targetAmount.toLocaleString()}`
    );
    console.log("🎯 Category:", projectData.category);
    console.log("🌍 SDG Goals:", projectData.sdgGoals.join(", "));

    // Simulate proposal creation
    const proposalId = `prop-${Date.now()}`;
    const newProposal: GovernanceProposal = {
      id: proposalId,
      name: `Whitelist Project: ${projectData.title}`,
      description: `Proposal to whitelist "${
        projectData.title
      }" for funding eligibility.\n\nProject Description: ${
        projectData.description
      }\n\nFunding Target: $${projectData.targetAmount.toLocaleString()}\n\nSDG Goals: ${projectData.sdgGoals.join(
        ", "
      )}`,
      proposer: proposerWallet.slice(0, 8) + "...sol",
      status: "voting",
      votesFor: 0,
      votesAgainst: 0,
      voteThreshold: 60,
      quorumThreshold: 1000,
      timeLeft: 3,
      projectId: projectData.id,
      category: projectData.category,
      requestedAmount: projectData.targetAmount,
      sdgGoals: projectData.sdgGoals,
      created: new Date().toISOString().split("T")[0],
    };

    this.proposals.unshift(newProposal);

    // In real implementation, would call:
    // await governanceSDK.createProposal(...)

    console.log("✅ Proposal created successfully!");
    console.log("📋 Proposal ID:", proposalId);
    console.log("⏰ Voting period: 3 days");
    console.log("🎯 Approval threshold: 60%");

    return proposalId;
  }

  /**
   * Cast a vote on a proposal
   * In real implementation, this would call SPL Governance vote instruction
   */
  async castVote(
    proposalId: string,
    voteChoice: "yes" | "no",
    voteAmount: number,
    voterWallet: string
  ): Promise<void> {
    console.log(`🗳️ Casting ${voteChoice.toUpperCase()} vote...`);
    console.log("📋 Proposal ID:", proposalId);
    console.log("💪 Vote Weight:", voteAmount.toLocaleString(), "ACTS");

    const proposal = this.proposals.find((p) => p.id === proposalId);
    if (!proposal) {
      throw new Error("Proposal not found");
    }

    if (proposal.status !== "voting") {
      throw new Error("Proposal is not in voting state");
    }

    // Check if already voted
    if (this.votes[proposalId]?.[voterWallet]) {
      throw new Error("You have already voted on this proposal");
    }

    // Record vote
    if (!this.votes[proposalId]) {
      this.votes[proposalId] = {};
    }
    this.votes[proposalId][voterWallet] = voteChoice;

    // Update vote counts
    if (voteChoice === "yes") {
      proposal.votesFor += voteAmount;
    } else {
      proposal.votesAgainst += voteAmount;
    }

    // Check if proposal should complete
    const totalVotes = proposal.votesFor + proposal.votesAgainst;
    if (totalVotes >= proposal.quorumThreshold) {
      const approvalPercentage = (proposal.votesFor / totalVotes) * 100;
      if (approvalPercentage >= proposal.voteThreshold) {
        proposal.status = "completed";
        console.log("🎉 Proposal has reached approval threshold!");
      } else if (approvalPercentage < 100 - proposal.voteThreshold) {
        proposal.status = "cancelled";
        console.log("❌ Proposal has been rejected");
      }
    }

    // In real implementation, would call:
    // await governanceSDK.castVote(proposalPk, walletPk, voteChoice)

    console.log("✅ Vote cast successfully!");
    console.log(
      `📊 Current votes - For: ${proposal.votesFor}, Against: ${proposal.votesAgainst}`
    );
    console.log(
      `📈 Approval rate: ${(
        (proposal.votesFor / (proposal.votesFor + proposal.votesAgainst)) *
        100
      ).toFixed(1)}%`
    );
  }

  /**
   * Execute a completed proposal
   * In real implementation, this would call the project whitelisting instruction
   */
  async executeProposal(
    proposalId: string,
    executorWallet: string
  ): Promise<void> {
    console.log("⚡ Executing proposal...");
    console.log("📋 Proposal ID:", proposalId);

    const proposal = this.proposals.find((p) => p.id === proposalId);
    if (!proposal) {
      throw new Error("Proposal not found");
    }

    if (proposal.status !== "completed") {
      throw new Error("Proposal is not ready for execution");
    }

    if (proposal.executed) {
      throw new Error("Proposal has already been executed");
    }

    // Mark as executing
    proposal.status = "executing";

    // Simulate execution delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // In real implementation, would call your Anchor program:
    // await program.methods.updateProjectWhitelist(true)
    //   .accounts({ project: proposal.projectId, ... })
    //   .rpc();

    proposal.executed = true;

    console.log("✅ Proposal executed successfully!");
    console.log("🎯 Project has been whitelisted for funding");
    console.log(
      `💰 Funding approved: $${proposal.requestedAmount.toLocaleString()}`
    );

    if (proposal.projectId) {
      console.log("📂 Project ID:", proposal.projectId);
      console.log("📋 Status: Whitelisted and eligible for community funding");
    }
  }

  /**
   * Get all proposals
   */
  getProposals(): GovernanceProposal[] {
    return [...this.proposals];
  }

  /**
   * Get proposal by ID
   */
  getProposal(proposalId: string): GovernanceProposal | undefined {
    return this.proposals.find((p) => p.id === proposalId);
  }

  /**
   * Check if user has voted on a proposal
   */
  hasVoted(proposalId: string, walletAddress: string): boolean {
    return !!this.votes[proposalId]?.[walletAddress];
  }

  /**
   * Get proposal statistics
   */
  getProposalStats(proposalId: string) {
    const proposal = this.getProposal(proposalId);
    if (!proposal) return null;

    const totalVotes = proposal.votesFor + proposal.votesAgainst;
    const approvalRate =
      totalVotes > 0 ? (proposal.votesFor / totalVotes) * 100 : 0;
    const quorumProgress = (totalVotes / proposal.quorumThreshold) * 100;

    return {
      totalVotes,
      approvalRate,
      quorumProgress,
      approved:
        approvalRate >= proposal.voteThreshold &&
        totalVotes >= proposal.quorumThreshold,
      canExecute: proposal.status === "completed" && !proposal.executed,
    };
  }
}

// Export singleton instance
export const governanceDemo = AnectosGovernanceDemo.getInstance();

/**
 * Example usage:
 *
 * // Create a proposal
 * await governanceDemo.createProposal({
 *   id: "proj-123",
 *   title: "Green Building Initiative",
 *   description: "Sustainable construction project",
 *   targetAmount: 75000,
 *   category: "Environmental",
 *   sdgGoals: ["Sustainable Cities", "Climate Action"]
 * }, "wallet-address");
 *
 * // Vote on proposal
 * await governanceDemo.castVote("prop-123", "yes", 1000, "voter-wallet");
 *
 * // Execute approved proposal
 * await governanceDemo.executeProposal("prop-123", "executor-wallet");
 */
