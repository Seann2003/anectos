import {
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { ANECTOS_PROGRAM } from "./constants";

const toBN = (v: number | BN) => (BN.isBN(v) ? (v as BN) : new BN(v));

// create_project
export async function createProjectIx(args: {
  owner: PublicKey;
  projectPda: PublicKey;
  projectMetadataPda: PublicKey;
  title: string;
  description: string;
  round: PublicKey;
  targetAmount: number | BN;
  milestoneCount: number;
  sdgGoals: any[];
  projectImageMetadataUri: string;
}): Promise<TransactionInstruction> {
  const {
    owner,
    projectPda,
    projectMetadataPda,
    title,
    description,
    round,
    targetAmount,
    milestoneCount,
    sdgGoals,
    projectImageMetadataUri,
  } = args;

  return ANECTOS_PROGRAM.methods
    .createProject(
      title,
      description,
      round,
      toBN(targetAmount),
      milestoneCount,
      sdgGoals,
      projectImageMetadataUri
    )
    .accountsPartial({
      owner,
      project: projectPda,
      projectMetadata: projectMetadataPda,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
}

// initialize_funding_round
export async function initializeFundingRoundIx(args: {
  owner: PublicKey;
  fundingRound: PublicKey;
  fundingRoundMetadataPda: PublicKey;
  matchingPool: number | BN;
  startTime: number;
  endTime: number;
  nftMetadataUri: string;
}): Promise<TransactionInstruction> {
  const {
    owner,
    fundingRound,
    fundingRoundMetadataPda,
    matchingPool,
    startTime,
    endTime,
    nftMetadataUri,
  } = args;

  return ANECTOS_PROGRAM.methods
    .initializeFundingRound(
      toBN(matchingPool),
      new BN(startTime),
      new BN(endTime),
      nftMetadataUri
    )
    .accountsPartial({
      owner,
      fundingRound,
      fundingRoundMetadata: fundingRoundMetadataPda,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
}

// contribute
export async function contributeIx(args: {
  fundingRound: PublicKey;
  projectPda: PublicKey;
  vaultPda: PublicKey;
  user: PublicKey;
  amount: number | BN;
}): Promise<TransactionInstruction> {
  const { fundingRound, projectPda, vaultPda, user, amount } = args;
  return ANECTOS_PROGRAM.methods
    .contribute(toBN(amount))
    .accountsPartial({
      fundingRound,
      project: projectPda,
      vault: vaultPda,
      user,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
}

// complete_milestone
export async function completeMilestoneIx(args: {
  owner: PublicKey;
  projectPda: PublicKey;
  milestoneIndex: number; // u8
  currentFunding: number | BN; // u64
}): Promise<TransactionInstruction> {
  const { owner, projectPda, milestoneIndex, currentFunding } = args;
  return ANECTOS_PROGRAM.methods
    .completeMilestone(milestoneIndex, toBN(currentFunding))
    .accountsPartial({ owner, project: projectPda })
    .instruction();
}

// update_project_whitelist
export async function updateProjectWhitelistIx(args: {
  owner: PublicKey;
  projectPda: PublicKey;
  isWhitelisted: boolean;
}): Promise<TransactionInstruction> {
  const { owner, projectPda, isWhitelisted } = args;
  return ANECTOS_PROGRAM.methods
    .updateProjectWhitelist(isWhitelisted)
    .accountsPartial({ owner, project: projectPda })
    .instruction();
}

// update_funding_stage_status
export async function updateFundingStageStatusIx(args: {
  owner: PublicKey;
  fundingRound: PublicKey;
  isActive: boolean;
}): Promise<TransactionInstruction> {
  const { owner, fundingRound, isActive } = args;
  return ANECTOS_PROGRAM.methods
    .updateFundingStageStatus(isActive)
    .accountsPartial({ owner, fundingRound })
    .instruction();
}

// close_round
export async function closeRoundIx(args: {
  owner: PublicKey;
  fundingRound: PublicKey;
}): Promise<TransactionInstruction> {
  const { owner, fundingRound } = args;
  return ANECTOS_PROGRAM.methods
    .closeRound()
    .accountsPartial({ owner, fundingRound })
    .instruction();
}
