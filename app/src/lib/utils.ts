import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const LAMPORTS_PER_SOL = 1_000_000_000;

export function lamportsToSol(lamports: bigint | number | string): number {
  try {
    const bi =
      typeof lamports === "bigint" ? Number(lamports) : Number(lamports);
    return bi / LAMPORTS_PER_SOL;
  } catch {
    return 0;
  }
}

export function solToLamports(sol: number | string): bigint {
  const n = typeof sol === "string" ? parseFloat(sol) : sol;
  const lamports = Math.round((Number.isFinite(n) ? n : 0) * LAMPORTS_PER_SOL);
  return BigInt(lamports);
}

export function formatSol(n: number, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "SOL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 9,
    ...options,
  }).format(n);
}
