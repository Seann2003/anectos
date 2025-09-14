import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
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
import { ACTS_TOKEN_MINT, CONNECTION } from "./constants";

// SPL Governance Program ID
export const GOVERNANCE_PROGRAM_ID = new PublicKey(
  "GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw"
);

export interface GovernanceProposal {
  id: string;
  name: string;
  description: string;
  proposer: string;
  status: "draft" | "voting" | "completed" | "cancelled" | "executing";
  votesFor: number;
  votesAgainst: number;
  voteThreshold: number; // 60% for project approval
  quorumThreshold: number;
  timeLeft: number; // in days
  projectId?: string;
  category: string;
  requestedAmount: number;
  sdgGoals: string[];
  created: string;
  executed?: boolean;
}

// Simple wallet interface for governance
interface GovernanceWallet {
  publicKey: PublicKey | null;
  signTransaction(tx: Transaction): Promise<Transaction>;
  signAllTransactions(txs: Transaction[]): Promise<Transaction[]>;
}

export class AnectosGovernanceSDK {
  private connection: Connection;
  private programId: PublicKey;

  // Governance configuration
  public realmPk: PublicKey | null = null;
  public governancePk: PublicKey | null = null;
  public councilMint: PublicKey | null = null;
  public communityMint: PublicKey;

  constructor(connection: Connection = CONNECTION) {
    this.connection = connection;
    this.programId = GOVERNANCE_PROGRAM_ID;
    this.communityMint = ACTS_TOKEN_MINT;
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
      this.communityMint, // Community mint (ACTS token)
      wallet.publicKey, // Payer
      undefined, // Council mint (none for now)
      MintMaxVoteWeightSource.FULL_SUPPLY_FRACTION,
      new BN(1000), // Min tokens to create governance (1000 ACTS)
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
      minCommunityTokensToCreateProposal: new BN(1000), // Minimum ACTS tokens needed
      minInstructionHoldUpTime: 0,
      baseVotingTime: 3 * 24 * 60 * 60, // 3 days voting period
      communityVoteTipping: VoteTipping.Strict,
      councilVoteTipping: VoteTipping.Strict,
      minCouncilTokensToCreateProposal: new BN(0),
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

    this.governancePk = governancePk;

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
    projectDescription: string,
    requestedAmount: number = 0
  ): Promise<PublicKey> {
    if (!wallet.publicKey) {
      throw new Error("Wallet not connected");
    }

    const instructions: TransactionInstruction[] = [];

    const proposalName = `Whitelist Project: ${projectTitle}`;
    const descriptionLink = `Project ID: ${projectId}\n\nDescription: ${projectDescription}\n\nRequested Amount: $${requestedAmount.toLocaleString()}`;

    const proposalPk = await withCreateProposal(
      instructions,
      this.programId,
      1, // Program version
      realmPk,
      governancePk,
      tokenOwnerRecord,
      proposalName,
      descriptionLink,
      this.communityMint, // Governing token mint
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
      this.communityMint,
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
      this.communityMint,
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
      return proposals;
    } catch (error) {
      console.error("Error fetching proposals:", error);
      return [];
    }
  }

  /**
   * Get token owner records for a wallet
   */
  async getTokenOwnerRecords(
    walletPubkey: PublicKey,
    realmPk: PublicKey
  ): Promise<any[]> {
    try {
      const records = await getTokenOwnerRecordsByOwner(
        this.connection,
        this.programId,
        walletPubkey
      );
      return records.filter((record) => record.realm.equals(realmPk));
    } catch (error) {
      console.error("Error fetching token owner records:", error);
      return [];
    }
  }
}

// Export singleton instance
export const governanceSDK = new AnectosGovernanceSDK();
