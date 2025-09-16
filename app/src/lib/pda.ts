import { PublicKey } from "@solana/web3.js";
import { ANECTOS_PROGRAM } from "./constants";

export const PROGRAM_ID: PublicKey = ANECTOS_PROGRAM.programId;

export function projectPdaFromOwner(owner: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("project"), owner.toBuffer()],
    PROGRAM_ID
  );
}

export function projectPdaFromRound(round: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("project"), round.toBuffer()],
    PROGRAM_ID
  );
}

export function projectMetadataPda(project: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("project_metadata"), project.toBuffer()],
    PROGRAM_ID
  );
}

// initialize_funding_round.rs:
//   funding_round_metadata PDA seeds = [b"funding_round_metadata", funding_round.key()]
export function fundingRoundMetadataPda(
  fundingRound: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("funding_round_metadata"), fundingRound.toBuffer()],
    PROGRAM_ID
  );
}

// Vault PDA used in contribute.rs and distribute_funds_to_owner.rs
// seeds = [b"vault", owner.key()]
export function vaultPda(owner: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), owner.toBuffer()],
    PROGRAM_ID
  );
}

// Round vault PDA: seeds = [b"round_vault", fundingRound]
export function roundVaultPda(fundingRound: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("round_vault"), fundingRound.toBuffer()],
    PROGRAM_ID
  );
}

// Convenience helpers to return only the address when bump isn't needed
export const projectAddressFromOwner = (owner: PublicKey) =>
  projectPdaFromOwner(owner)[0];
export const projectAddressFromRound = (round: PublicKey) =>
  projectPdaFromRound(round)[0];
export const projectMetadataAddress = (project: PublicKey) =>
  projectMetadataPda(project)[0];
export const fundingRoundMetadataAddress = (fundingRound: PublicKey) =>
  fundingRoundMetadataPda(fundingRound)[0];
export const vaultAddress = (owner: PublicKey) => vaultPda(owner)[0];
export const roundVaultAddress = (fundingRound: PublicKey) =>
  roundVaultPda(fundingRound)[0];
