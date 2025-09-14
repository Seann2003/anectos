import {
  Connection,
  PublicKey,
  clusterApiUrl,
  Transaction,
} from "@solana/web3.js";
import { AnchorProvider, Program, BN, Idl } from "@coral-xyz/anchor";
import idlJson from "../../../target/idl/anectos.json";

// Program configuration
export const PROGRAM_ID = new PublicKey(
  "26yr8seqaSUEJidnG6yif5W6Fgm84MfkC7UP7ZNAjwgj"
);
export const NETWORK = "localhost";

interface WalletInterface {
  publicKey: PublicKey | null;
  signTransaction(tx: Transaction): Promise<Transaction>;
  signAllTransactions(txs: Transaction[]): Promise<Transaction[]>;
}

export const getConnection = () => {
  if (NETWORK === "localhost") {
    return new Connection("http://localhost:8899", "confirmed");
  }
  return new Connection(clusterApiUrl(NETWORK as any), "confirmed");
};

export const getProgram = (wallet: WalletInterface) => {
  const connection = getConnection();

  const walletAdapter = {
    publicKey: wallet.publicKey,
    signTransaction: wallet.signTransaction.bind(wallet),
    signAllTransactions: wallet.signAllTransactions.bind(wallet),
  } as any;

  const provider = new AnchorProvider(connection, walletAdapter, {
    commitment: "confirmed",
    preflightCommitment: "confirmed",
  });

  return new Program(idlJson as Idl, provider);
};

export const findProjectPDA = (projectId: string, round: PublicKey) => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("project"), Buffer.from(projectId), round.toBuffer()],
    PROGRAM_ID
  );
};

export const findProjectVaultPDA = (project: PublicKey) => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("project_vault"), project.toBuffer()],
    PROGRAM_ID
  );
};

export const findContributionPDA = (
  contributor: PublicKey,
  project: PublicKey
) => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("contribution"), contributor.toBuffer(), project.toBuffer()],
    PROGRAM_ID
  );
};

export const findFundingRoundPDA = (seed: string) => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("funding_round"), Buffer.from(seed)],
    PROGRAM_ID
  );
};

export const findFundingRoundMetaPDA = (round: PublicKey) => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("funding_round_meta"), round.toBuffer()],
    PROGRAM_ID
  );
};

export const findProjectMetaPDA = (project: PublicKey) => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("project_meta"), project.toBuffer()],
    PROGRAM_ID
  );
};

export const lamportsToSol = (lamports: number | BN): number => {
  return typeof lamports === "number"
    ? lamports / 1e9
    : lamports.toNumber() / 1e9;
};

export const solToLamports = (sol: number): number => {
  return Math.floor(sol * 1e9);
};
