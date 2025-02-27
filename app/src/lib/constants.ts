import { clusterApiUrl, Connection } from "@solana/web3.js";

export const CONNECTION = new Connection(
  process.env.NEXT_PUBLIC_RPC_URL ?? clusterApiUrl("devnet")
);
