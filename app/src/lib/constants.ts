import { clusterApiUrl, Connection, PublicKey } from "@solana/web3.js";

export const CONNECTION = new Connection(
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? clusterApiUrl("devnet")
);

// ACTS Governance Token Configuration
export const ACTS_TOKEN_MINT = new PublicKey(
  process.env.NEXT_PUBLIC_ACTS_TOKEN_MINT ??
    "HUUrWwyqN6uUp3JWtqstfAA8w7KmfanWChHw1s4m6n7J"
);

// Program IDs
export const ANECTOS_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_ANECTOS_PROGRAM_ID ??
    "26yr8seqaSUEJidnG6yif5W6Fgm84MfkC7UP7ZNAjwgj"
);

export const SPL_GOVERNANCE_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_SPL_GOVERNANCE_PROGRAM_ID ??
    "GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw"
);

// Governance Configuration
export const GOVERNANCE_REALM_NAME =
  process.env.NEXT_PUBLIC_GOVERNANCE_REALM_NAME ?? "Anectos";
export const GOVERNANCE_VOTING_THRESHOLD = parseInt(
  process.env.NEXT_PUBLIC_GOVERNANCE_VOTING_THRESHOLD ?? "60"
);

// Network Configuration
export const SOLANA_NETWORK =
  process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? "devnet";
