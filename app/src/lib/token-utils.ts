import { Connection, PublicKey } from "@solana/web3.js";
import { getAccount, getAssociatedTokenAddress } from "@solana/spl-token";

// ACTS Token Configuration
const ACTS_TOKEN_MINT = new PublicKey(process.env.NEXT_PUBLIC_ACTS_TOKEN_MINT!);
const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL!;
const connection = new Connection(SOLANA_RPC_URL);

/**
 * Get ACTS token balance for a wallet address
 */
export async function getActsTokenBalance(
  walletAddress: string
): Promise<number> {
  try {
    const walletPublicKey = new PublicKey(walletAddress);

    // Get associated token address for ACTS token
    const tokenAccountAddress = await getAssociatedTokenAddress(
      ACTS_TOKEN_MINT,
      walletPublicKey
    );

    try {
      // Fetch token account info
      const tokenAccount = await getAccount(connection, tokenAccountAddress);
      const balance = Number(tokenAccount.amount) / Math.pow(10, 9); // Assuming 9 decimals
      return balance;
    } catch (error) {
      // Token account doesn't exist, user has 0 balance
      return 0;
    }
  } catch (error) {
    console.error("Error fetching ACTS token balance:", error);
    return 0;
  }
}

/**
 * Check if a wallet has admin privileges (10,000+ ACTS tokens)
 */
export async function checkAdminPrivileges(
  walletAddress: string
): Promise<boolean> {
  const balance = await getActsTokenBalance(walletAddress);
  return balance >= 10000; // Admin threshold
}

/**
 * Format ACTS token amount for display
 */
export function formatActsAmount(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(2)}B`;
  } else if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(2)}M`;
  } else if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(2)}K`;
  }
  return amount.toLocaleString();
}

/**
 * Get ACTS token info
 */
export function getActsTokenInfo() {
  return {
    mint: ACTS_TOKEN_MINT.toString(),
    name: "ACTS",
    symbol: "ACTS",
    decimals: 9,
    totalSupply: "18,446,744,073", // From your token creation
    description: "Anectos Community Token for governance and funding decisions",
  };
}
