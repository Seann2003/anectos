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

export async function changeProjectFundingStageIx(args: {
  user: PublicKey;
  projectPda: PublicKey;
  projectMetadataPda: PublicKey;
  fundingRound: PublicKey;
  fundingRoundMetadataPda: PublicKey;
  fundingStage: any; // Anchor enum variant object
}): Promise<TransactionInstruction> {
  const {
    user,
    projectPda,
    projectMetadataPda,
    fundingRound,
    fundingRoundMetadataPda,
    fundingStage,
  } = args;

  return ANECTOS_PROGRAM.methods
    .changeProjectFundingStage(fundingStage)
    .accountsPartial({
      user,
      projectMeta: projectMetadataPda,
      project: projectPda,
      fundingRound,
      fundingRoundMetadata: fundingRoundMetadataPda,
    })
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

// distribute_funds_to_owner
export async function distributeFundsToOwnerIx(args: {
  owner: PublicKey;
  vaultPda: PublicKey;
  projectPda: PublicKey;
  amount: number | BN; // u64 lamports
}): Promise<TransactionInstruction> {
  const { owner, vaultPda, projectPda, amount } = args;
  return ANECTOS_PROGRAM.methods
    .distributeFundsToOwner(toBN(amount))
    .accountsPartial({
      owner,
      vault: vaultPda,
      project: projectPda,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
}

// create_round_vault
export async function createRoundVaultIx(args: {
  owner: PublicKey;
  fundingRound: PublicKey;
  roundVault: PublicKey;
}): Promise<TransactionInstruction> {
  const { owner, fundingRound, roundVault } = args;
  return (ANECTOS_PROGRAM.methods as any)
    .createRoundVault()
    .accountsPartial({
      owner,
      fundingRound,
      roundVault,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
}

// settle_matching_for_project
export async function settleMatchingForProjectIx(args: {
  owner: PublicKey;
  fundingRound: PublicKey;
  roundVault: PublicKey;
  projectPda: PublicKey;
  projectVault: PublicKey;
}): Promise<TransactionInstruction> {
  const { owner, fundingRound, roundVault, projectPda, projectVault } = args;
  return (ANECTOS_PROGRAM.methods as any)
    .settleMatchingForProject()
    .accountsPartial({
      owner,
      fundingRound,
      roundVault,
      project: projectPda,
      projectVault,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
}

// set_matching_pool (owner-only)
export async function setMatchingPoolToVaultBalanceIx(args: {
  owner: PublicKey;
  fundingRound: PublicKey;
  roundVault: PublicKey;
}): Promise<TransactionInstruction> {
  const { owner, fundingRound, roundVault } = args;
  return (ANECTOS_PROGRAM.methods as any)
    .setMatchingPool()
    .accountsPartial({
      owner,
      fundingRound,
      roundVault,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
}

// fund_round_pool: move lamports from funder to round_vault and increment matching_pool
export async function fundRoundPoolIx(args: {
  funder: PublicKey;
  fundingRound: PublicKey;
  roundVault: PublicKey;
  amount: number | BN;
}): Promise<TransactionInstruction> {
  const { funder, fundingRound, roundVault, amount } = args;
  return (ANECTOS_PROGRAM.methods as any)
    .fundRoundPool(toBN(amount))
    .accountsPartial({
      funder,
      fundingRound,
      roundVault,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
}

// fund_project_pool: deposit into round vault and increment this project's matching_pool
export async function fundProjectPoolIx(args: {
  funder: PublicKey;
  fundingRound: PublicKey;
  project: PublicKey;
  roundVault: PublicKey;
  amount: number | BN;
}): Promise<TransactionInstruction> {
  const { funder, fundingRound, project, roundVault, amount } = args;
  return (ANECTOS_PROGRAM.methods as any)
    .fundProjectPool(toBN(amount))
    .accountsPartial({
      funder,
      fundingRound,
      project,
      roundVault,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
}

// set_area_max (owner-only): set target area for scaling (u128)
export async function setAreaMaxIx(args: {
  owner: PublicKey;
  fundingRound: PublicKey;
  areaMax: BN; // pass as BN string for u128
}): Promise<TransactionInstruction> {
  const { owner, fundingRound, areaMax } = args;
  return (ANECTOS_PROGRAM.methods as any)
    .setAreaMax(areaMax)
    .accountsPartial({ owner, fundingRound })
    .instruction();
}
