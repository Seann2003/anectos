import {
  Connection,
  PublicKey,
  TransactionInstruction,
  Transaction,
} from "@solana/web3.js";
import {
  withCreateRealm,
  withCreateGovernance,
  withCreateProposal,
  withCastVote,
  withFinalizeVote,
  getRealm,
  getAllProposals,
  getTokenOwnerRecordsByOwner,
  VoteThreshold,
  VoteThresholdType,
  GovernanceConfig,
  VoteTipping,
  Vote,
  YesNoVote,
  VoteType,
  MintMaxVoteWeightSource,
} from "@solana/spl-governance";
import BN from "bn.js";

// Define a simplified wallet interface for governance
interface GovernanceWallet {
  publicKey: PublicKey | null;
  signTransaction(tx: Transaction): Promise<Transaction>;
  signAllTransactions(txs: Transaction[]): Promise<Transaction[]>;
}

// Governance Program ID (mainnet/devnet)
export const GOVERNANCE_PROGRAM_ID = new PublicKey(
  "GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw"
);

// ACTS Token Mint (this will be your governance token)
export const ACTS_TOKEN_MINT = new PublicKey(
  // Replace with your actual ACTS token mint address
  "ActsToken123456789012345678901234567890123"
);

export interface GovernanceProposal {
  id: string;
  name: string;
  description: string;
  proposer: PublicKey;
  governingTokenMint: PublicKey;
  status: "draft" | "voting" | "completed" | "cancelled";
  votesFor: number;
  votesAgainst: number;
  voteThreshold: number;
  quorumThreshold: number;
  timeLeft: number;
  projectId?: string;
  executedAt?: number;
}

export class GovernanceManager {
  private connection: Connection;
  private programId: PublicKey;
  private realmPk: PublicKey | null = null;

  constructor(connection: Connection) {
    this.connection = connection;
    this.programId = GOVERNANCE_PROGRAM_ID;
  }

  /**
   * Initialize the governance realm for ANECTOS DAO
   */
  async initializeRealm(
    wallet: GovernanceWallet,
    realmName: string = "ANECTOS DAO"
  ): Promise<PublicKey> {
    if (!wallet.publicKey) {
      throw new Error("Wallet not connected");
    }

    const instructions: TransactionInstruction[] = [];

    const realmPk = await withCreateRealm(
      instructions,
      this.programId,
      1, // Program version
      realmName,
      wallet.publicKey, // Realm authority
      ACTS_TOKEN_MINT, // Community mint (ACTS token)
      wallet.publicKey, // Payer
      undefined, // Council mint (none for now)
      MintMaxVoteWeightSource.FULL_SUPPLY_FRACTION,
      new BN(1) as any, // Min tokens to create governance
      undefined, // Community token config
      undefined // Council token config
    );

    this.realmPk = realmPk;

    const transaction = new Transaction().add(...instructions);
    await wallet.signTransaction(transaction);
    await this.connection.sendRawTransaction(transaction.serialize());

    return realmPk;
  }

  /**
   * Create a governance for project proposals
   */
  async createProjectGovernance(
    wallet: GovernanceWallet,
    realmPk: PublicKey
  ): Promise<PublicKey> {
    if (!wallet.publicKey) {
      throw new Error("Wallet not connected");
    }

    const instructions: TransactionInstruction[] = [];

    // Configure governance with 60% approval threshold
    const config = new GovernanceConfig({
      communityVoteThreshold: new VoteThreshold({
        type: VoteThresholdType.YesVotePercentage,
        value: 60, // 60% majority required
      }),
      minCommunityTokensToCreateProposal: new BN(1000) as any, // Minimum ACTS tokens needed
      minInstructionHoldUpTime: 0,
      baseVotingTime: 3 * 24 * 60 * 60, // 3 days voting period
      communityVoteTipping: VoteTipping.Strict,
      councilVoteTipping: VoteTipping.Strict,
      minCouncilTokensToCreateProposal: new BN(0) as any,
      councilVoteThreshold: new VoteThreshold({
        type: VoteThresholdType.YesVotePercentage,
        value: 0,
      }),
      councilVetoVoteThreshold: new VoteThreshold({
        type: VoteThresholdType.YesVotePercentage,
        value: 0,
      }),
      communityVetoVoteThreshold: new VoteThreshold({
        type: VoteThresholdType.YesVotePercentage,
        value: 80,
      }),
      votingCoolOffTime: 0,
      depositExemptProposalCount: 0,
    });

    // Use a dummy governed account (can be the realm itself)
    const governedAccount = realmPk;

    const governancePk = await withCreateGovernance(
      instructions,
      this.programId,
      1, // Program version
      realmPk,
      governedAccount,
      config,
      wallet.publicKey, // Token owner record
      wallet.publicKey, // Governance authority
      wallet.publicKey, // Payer
      undefined // Voter weight record
    );

    const transaction = new Transaction().add(...instructions);
    await wallet.signTransaction(transaction);
    await this.connection.sendRawTransaction(transaction.serialize());

    return governancePk;
  }

  /**
   * Create a proposal to whitelist a project
   */
  async createProjectProposal(
    wallet: GovernanceWallet,
    realmPk: PublicKey,
    governancePk: PublicKey,
    tokenOwnerRecord: PublicKey,
    projectId: string,
    projectTitle: string,
    projectDescription: string
  ): Promise<PublicKey> {
    if (!wallet.publicKey) {
      throw new Error("Wallet not connected");
    }

    const instructions: TransactionInstruction[] = [];

    const proposalName = `Whitelist Project: ${projectTitle}`;
    const descriptionLink = `Project ID: ${projectId}\n\nDescription: ${projectDescription}`;

    const proposalPk = await withCreateProposal(
      instructions,
      this.programId,
      1, // Program version
      realmPk,
      governancePk,
      tokenOwnerRecord,
      proposalName,
      descriptionLink,
      ACTS_TOKEN_MINT, // Governing token mint
      wallet.publicKey, // Governance authority
      0, // Proposal index (not used in v1)
      VoteType.SINGLE_CHOICE,
      ["Approve"], // Options
      true, // Use deny option
      wallet.publicKey, // Payer
      undefined // Voter weight record
    );

    const transaction = new Transaction().add(...instructions);
    await wallet.signTransaction(transaction);
    await this.connection.sendRawTransaction(transaction.serialize());

    return proposalPk;
  }

  /**
   * Cast a vote on a proposal
   */
  async castVote(
    wallet: GovernanceWallet,
    realmPk: PublicKey,
    governancePk: PublicKey,
    proposalPk: PublicKey,
    proposalOwnerRecord: PublicKey,
    tokenOwnerRecord: PublicKey,
    voteChoice: YesNoVote
  ): Promise<PublicKey> {
    if (!wallet.publicKey) {
      throw new Error("Wallet not connected");
    }

    const instructions: TransactionInstruction[] = [];

    const vote = Vote.fromYesNoVote(voteChoice);

    const voteRecordPk = await withCastVote(
      instructions,
      this.programId,
      1, // Program version
      realmPk,
      governancePk,
      proposalPk,
      proposalOwnerRecord,
      tokenOwnerRecord,
      wallet.publicKey, // Governance authority
      ACTS_TOKEN_MINT,
      vote,
      wallet.publicKey, // Payer
      undefined, // Voter weight record
      undefined // Max voter weight record
    );

    const transaction = new Transaction().add(...instructions);
    await wallet.signTransaction(transaction);
    await this.connection.sendRawTransaction(transaction.serialize());

    return voteRecordPk;
  }

  /**
   * Finalize a vote to execute the proposal
   */
  async finalizeVote(
    wallet: GovernanceWallet,
    realmPk: PublicKey,
    governancePk: PublicKey,
    proposalPk: PublicKey,
    proposalOwnerRecord: PublicKey
  ): Promise<void> {
    if (!wallet.publicKey) {
      throw new Error("Wallet not connected");
    }

    const instructions: TransactionInstruction[] = [];

    await withFinalizeVote(
      instructions,
      this.programId,
      1, // Program version
      realmPk,
      governancePk,
      proposalPk,
      proposalOwnerRecord,
      ACTS_TOKEN_MINT,
      undefined // Max voter weight record
    );

    const transaction = new Transaction().add(...instructions);
    await wallet.signTransaction(transaction);
    await this.connection.sendRawTransaction(transaction.serialize());
  }

  /**
   * Get all proposals for the realm
   */
  async getAllProposals(realmPk: PublicKey): Promise<any[]> {
    try {
      const proposals = await getAllProposals(
        this.connection,
        this.programId,
        realmPk
      );
      return proposals.flat();
    } catch (error) {
      console.error("Error fetching proposals:", error);
      return [];
    }
  }

  /**
   * Get user's token owner records (voting power)
   */
  async getUserTokenOwnerRecords(userPk: PublicKey): Promise<any[]> {
    try {
      const records = await getTokenOwnerRecordsByOwner(
        this.connection,
        this.programId,
        userPk
      );
      return records;
    } catch (error) {
      console.error("Error fetching token owner records:", error);
      return [];
    }
  }

  /**
   * Get realm information
   */
  async getRealm(realmPk: PublicKey): Promise<any> {
    try {
      return await getRealm(this.connection, realmPk);
    } catch (error) {
      console.error("Error fetching realm:", error);
      return null;
    }
  }
}

// Helper functions for governance integration with your existing project system

/**
 * Create a governance proposal for project whitelisting
 */
export async function createProjectWhitelistProposal(
  governance: GovernanceManager,
  wallet: GovernanceWallet,
  realmPk: PublicKey,
  governancePk: PublicKey,
  tokenOwnerRecord: PublicKey,
  projectData: {
    id: string;
    title: string;
    description: string;
    targetAmount: number;
    sdgGoals: string[];
  }
): Promise<PublicKey> {
  const proposalDescription = `
Project Title: ${projectData.title}

Description: ${projectData.description}

Funding Target: ${projectData.targetAmount} SOL

SDG Goals: ${projectData.sdgGoals.join(", ")}

Voting on this proposal will determine whether to whitelist this project for funding.
A 60% majority is required for approval.
  `.trim();

  return governance.createProjectProposal(
    wallet,
    realmPk,
    governancePk,
    tokenOwnerRecord,
    projectData.id,
    projectData.title,
    proposalDescription
  );
}

/**
 * Execute project whitelisting after successful vote
 */
export async function executeProjectWhitelisting(
  projectId: string,
  proposalPk: PublicKey
): Promise<boolean> {
  // This will integrate with your existing project whitelisting function
  // You'll need to call your Solana program's update_project_whitelist instruction
  try {
    // Call your program's whitelisting function here
    // await updateProjectWhitelist(wallet, projectId, true);
    console.log(
      `Project ${projectId} whitelisted after proposal ${proposalPk.toBase58()}`
    );
    return true;
  } catch (error) {
    console.error("Error executing project whitelisting:", error);
    return false;
  }
}
