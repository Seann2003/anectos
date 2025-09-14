import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
  Keypair,
} from "@solana/web3.js";
import { SplGovernance } from "governance-idl-sdk";
import { getExplorerLink } from "@solana-developers/helpers";
import { ACTS_TOKEN_MINT, CONNECTION, SOLANA_NETWORK } from "../constants";

// SPL Governance Program ID
export const GOVERNANCE_PROGRAM_ID = new PublicKey(
  "GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw"
);

export interface GovernanceConfig {
  realmPk?: PublicKey;
  governancePk?: PublicKey;
  councilMint?: PublicKey;
  communityMint: PublicKey;
}

export class AnectosGovernanceSDK {
  private connection: Connection;
  private splGovernance: SplGovernance;

  // Governance configuration
  public realmPk: PublicKey | null = null;
  public governancePk: PublicKey | null = null;
  public councilMint: PublicKey | null = null;
  public communityMint: PublicKey;

  constructor(connection: Connection = CONNECTION) {
    this.connection = connection;
    this.splGovernance = new SplGovernance(connection);
    this.communityMint = ACTS_TOKEN_MINT;
  }

  /**
   * Initialize governance with existing realm or create new one
   */
  async initializeGovernance(realmPubkey?: string) {
    if (realmPubkey) {
      this.realmPk = new PublicKey(realmPubkey);

      // Get realm info
      const realm = await this.splGovernance.getRealmByPubkey(this.realmPk);
      this.councilMint = realm.config.councilMint;
      this.communityMint = realm.communityMint;

      // Get governance accounts for this realm
      const governanceAccounts =
        await this.splGovernance.getGovernanceAccountsByRealm(this.realmPk);
      if (governanceAccounts.length > 0) {
        this.governancePk = governanceAccounts[0].publicKey;
      }
    }
  }

  /**
   * Get token owner record for a wallet
   */
  async getTokenOwnerRecord(
    walletPubkey: PublicKey
  ): Promise<PublicKey | null> {
    if (!this.realmPk) {
      throw new Error("Realm not initialized");
    }

    try {
      const tokenOwnerRecords =
        await this.splGovernance.getTokenOwnerRecordsForOwner(walletPubkey);
      const realmRecords = tokenOwnerRecords.filter(
        (tor) => tor.realm.toBase58() === this.realmPk!.toBase58()
      );

      // Prefer community token owner record (ACTS tokens)
      const communityRecord = realmRecords.find(
        (tor) =>
          tor.governingTokenMint.toBase58() === this.communityMint.toBase58()
      );

      if (communityRecord) {
        return communityRecord.publicKey;
      }

      // Fallback to any token owner record for this realm
      return realmRecords.length > 0 ? realmRecords[0].publicKey : null;
    } catch (error) {
      console.error("Error getting token owner record:", error);
      return null;
    }
  }

  /**
   * Create a new governance proposal
   */
  async createProposal(
    proposalName: string,
    proposalDescription: string,
    walletPubkey: PublicKey,
    instructions: TransactionInstruction[] = []
  ): Promise<{
    proposalPk: PublicKey;
    instructions: TransactionInstruction[];
  }> {
    if (!this.realmPk || !this.governancePk) {
      throw new Error("Governance not properly initialized");
    }

    const tokenOwnerRecord = await this.getTokenOwnerRecord(walletPubkey);
    if (!tokenOwnerRecord) {
      throw new Error("No token owner record found for wallet");
    }

    const proposalSeed = walletPubkey; // Use wallet as seed for uniqueness

    const createProposalIx = await this.splGovernance.createProposalInstruction(
      proposalName,
      proposalDescription,
      {
        choiceType: "single",
        multiChoiceOptions: null,
      },
      ["Approve"], // Single option: Approve
      false, // Use deny option = false (Yes/No voting)
      this.realmPk,
      this.governancePk,
      tokenOwnerRecord,
      this.communityMint, // Use ACTS tokens for voting
      walletPubkey, // Governance authority
      walletPubkey, // Payer
      proposalSeed
    );

    // Calculate proposal PDA
    const proposalPk = this.splGovernance.pda.proposalAccount({
      governanceAccount: this.governancePk,
      governingTokenMint: this.communityMint,
      proposalSeed,
    }).publicKey;

    const txInstructions = [createProposalIx];

    // Add any additional instructions (like whitelisting actions)
    if (instructions.length > 0) {
      const insertInstructions =
        await this.splGovernance.insertTransactionInstruction(
          instructions,
          0, // Option index
          0, // Instruction index
          0, // Hold up time
          this.governancePk,
          proposalPk,
          tokenOwnerRecord,
          walletPubkey, // Governance authority
          walletPubkey // Payer
        );
      txInstructions.push(insertInstructions);
    }

    return {
      proposalPk,
      instructions: txInstructions,
    };
  }

  /**
   * Add wallet as signatory to proposal and sign off
   */
  async addSignatoryAndSignOff(
    proposalPk: PublicKey,
    walletPubkey: PublicKey
  ): Promise<TransactionInstruction[]> {
    if (!this.realmPk || !this.governancePk) {
      throw new Error("Governance not properly initialized");
    }

    const tokenOwnerRecord = await this.getTokenOwnerRecord(walletPubkey);
    if (!tokenOwnerRecord) {
      throw new Error("No token owner record found for wallet");
    }

    const instructions: TransactionInstruction[] = [];

    // Add signatory
    const addSignatoryIx = await this.splGovernance.addSignatoryInstruction(
      walletPubkey, // Signatory
      proposalPk,
      tokenOwnerRecord,
      walletPubkey, // Governance authority
      walletPubkey // Payer
    );
    instructions.push(addSignatoryIx);

    // Calculate signatory record PDA
    const signatoryRecordPk = this.splGovernance.pda.signatoryRecordAccount({
      proposal: proposalPk,
      signatory: walletPubkey,
    }).publicKey;

    // Sign off proposal
    const signOffIx = await this.splGovernance.signOffProposalInstruction(
      this.realmPk,
      this.governancePk,
      proposalPk,
      walletPubkey, // Signatory
      signatoryRecordPk,
      tokenOwnerRecord
    );
    instructions.push(signOffIx);

    return instructions;
  }

  /**
   * Cast a vote on a proposal
   */
  async castVote(
    proposalPk: PublicKey,
    walletPubkey: PublicKey,
    vote: "Yes" | "No"
  ): Promise<TransactionInstruction> {
    if (!this.realmPk || !this.governancePk) {
      throw new Error("Governance not properly initialized");
    }

    const tokenOwnerRecord = await this.getTokenOwnerRecord(walletPubkey);
    if (!tokenOwnerRecord) {
      throw new Error("No token owner record found for wallet");
    }

    // Convert vote to proper format
    const voteChoice = vote === "Yes" ? { approve: [{}] } : { deny: [{}] };

    const castVoteIx = await this.splGovernance.castVoteInstruction(
      this.realmPk,
      this.governancePk,
      proposalPk,
      tokenOwnerRecord,
      walletPubkey, // Governance authority
      this.communityMint,
      walletPubkey, // Payer
      voteChoice
    );

    return castVoteIx;
  }

  /**
   * Get all proposals for the realm
   */
  async getAllProposals() {
    if (!this.realmPk) {
      throw new Error("Realm not initialized");
    }

    try {
      const governanceAccounts =
        await this.splGovernance.getGovernanceAccountsByRealm(this.realmPk);
      const allProposals = [];

      for (const governance of governanceAccounts) {
        const proposals = await this.splGovernance.getProposalsByGovernance(
          governance.publicKey
        );
        allProposals.push(...proposals);
      }

      return allProposals;
    } catch (error) {
      console.error("Error fetching proposals:", error);
      return [];
    }
  }

  /**
   * Get draft proposals for a token owner
   */
  async getDraftProposals(tokenOwnerRecord: PublicKey) {
    try {
      const proposals = await this.splGovernance.getProposalsByTokenOwnerRecord(
        tokenOwnerRecord
      );
      return proposals.filter((proposal) => proposal.state.draft !== undefined);
    } catch (error) {
      console.error("Error fetching draft proposals:", error);
      return [];
    }
  }

  /**
   * Send transaction with multiple instructions
   */
  async sendTransaction(
    instructions: TransactionInstruction[],
    wallet: any // Wallet adapter
  ): Promise<string> {
    try {
      const transaction = new Transaction().add(...instructions);
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = wallet.publicKey;

      // Sign and send transaction
      const signedTx = await wallet.signTransaction(transaction);
      const signature = await this.connection.sendRawTransaction(
        signedTx.serialize()
      );

      // Confirm transaction
      await this.connection.confirmTransaction(signature, "confirmed");

      console.log(
        "Transaction successful:",
        getExplorerLink("tx", signature, SOLANA_NETWORK as any)
      );
      return signature;
    } catch (error) {
      console.error("Transaction failed:", error);
      throw error;
    }
  }

  /**
   * Create a complete proposal workflow (create + sign off)
   */
  async createCompleteProposal(
    proposalName: string,
    proposalDescription: string,
    walletPubkey: PublicKey,
    wallet: any,
    additionalInstructions: TransactionInstruction[] = []
  ): Promise<{ proposalPk: PublicKey; signature: string }> {
    // Create proposal
    const { proposalPk, instructions: createInstructions } =
      await this.createProposal(
        proposalName,
        proposalDescription,
        walletPubkey,
        additionalInstructions
      );

    // Add signatory and sign off
    const signOffInstructions = await this.addSignatoryAndSignOff(
      proposalPk,
      walletPubkey
    );

    // Combine all instructions
    const allInstructions = [...createInstructions, ...signOffInstructions];

    // Send transaction
    const signature = await this.sendTransaction(allInstructions, wallet);

    return { proposalPk, signature };
  }
}

// Export singleton instance
export const governanceSDK = new AnectosGovernanceSDK();
