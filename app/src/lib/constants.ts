import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { Connection, Keypair } from "@solana/web3.js";
import idl from "../../../target/idl/anectos.json";
import { Anectos } from "../../../target/types/anectos";

export const SURFPOOL_RPC = "http://127.0.0.1:8899";
export const DEVNET_RPC = "https://api.devnet.solana.com";

export const CONNECTION = new Connection(SURFPOOL_RPC, "confirmed");
const provider = { connection: CONNECTION } as AnchorProvider;

export const ANECTOS_PROGRAM = new Program<Anectos>(idl, provider);