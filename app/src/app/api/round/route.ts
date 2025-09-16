import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { ANECTOS_PROGRAM, CONNECTION } from "@/lib/constants";
import { projectPdaFromOwner, vaultPda } from "@/lib/pda";

function isPublicKeyLike(v: any): v is PublicKey {
  return (
    v &&
    typeof v === "object" &&
    typeof (v as any).toBase58 === "function" &&
    (typeof (v as any).toBuffer === "function" ||
      typeof (v as any).toBytes === "function")
  );
}

function toBase58Maybe(v: any): string | null {
  try {
    if (!v) return null;
    if (typeof v === "string") return v;
    if (v instanceof PublicKey || isPublicKeyLike(v)) return v.toBase58();
    return new PublicKey(v).toBase58();
  } catch {
    return null;
  }
}

const LAMPORTS_PER_SOL = 1_000_000_000;
const toSol = (lamports: bigint | number | string | null | undefined) => {
  try {
    if (lamports == null) return null;
    const bi = typeof lamports === "bigint" ? lamports : BigInt(lamports);
    return Number(bi) / LAMPORTS_PER_SOL;
  } catch {
    return null;
  }
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectStr = searchParams.get("project");
    const ownerStr = searchParams.get("owner");
    const walletStr = searchParams.get("wallet");

    if (!projectStr && !ownerStr) {
      return Response.json(
        { error: "Missing required param: project or owner" },
        { status: 400 }
      );
    }

    // Resolve project PDA
    const projectPk = projectStr
      ? new PublicKey(projectStr)
      : projectPdaFromOwner(new PublicKey(ownerStr!))[0];

    const project = await ANECTOS_PROGRAM.account.project.fetchNullable(
      projectPk
    );
    if (!project) {
      return Response.json(
        { error: "Project not found", project: projectPk.toBase58() },
        { status: 404 }
      );
    }

    const ownerPk = new PublicKey(toBase58Maybe(project.owner)!);
    const roundPk = new PublicKey(toBase58Maybe(project.round)!);
    const [vaultPk] = vaultPda(ownerPk);

    // Balances
    const [vaultBalanceLamportsNum, walletBalanceLamportsNum] =
      await Promise.all([
        CONNECTION.getBalance(vaultPk, "confirmed"),
        walletStr
          ? CONNECTION.getBalance(new PublicKey(walletStr), "confirmed")
          : Promise.resolve(0),
      ]);

    const projectFundingBn: BN = project.currentFunding as unknown as BN;
    const projectFundingLamportsStr = BN.isBN(projectFundingBn)
      ? projectFundingBn.toString()
      : String(projectFundingBn ?? "0");

    const projectMatchingUnlockedBn: BN | undefined = (project as any)
      ?.matchingUnlocked;
    const projectMatchingUnlockedStr = projectMatchingUnlockedBn
      ? projectMatchingUnlockedBn.toString()
      : null;

    // Fetch funding round account for QF metrics (safely)
    let round: any = null;
    try {
      const info = await CONNECTION.getAccountInfo(roundPk, "confirmed");
      if (info && info.owner.equals(ANECTOS_PROGRAM.programId)) {
        // Only attempt decode when owned by our program
        round = await ANECTOS_PROGRAM.account.fundingRound.fetch(roundPk);
      }
    } catch (e) {
      console.warn(
        "/api/round: safe decode of fundingRound failed:",
        (e as any)?.message
      );
      round = null;
    }

    // Round-level metrics we still need: total round area, contributor count
    const roundAreaBn: BN | undefined = (round as any)?.area;
  const roundAreaMaxBn: BN | undefined = (round as any)?.areaMax;
    const contributorCount: number | null =
      (round as any)?.contributorCount ?? null;

    // Project-level pool metrics (per-project matching pools)
    const projectAreaBn: BN | undefined = (project as any)?.area;
    const projectMatchingPoolBn: BN | undefined = (project as any)
      ?.matchingPool;
    const projectPoolDistributedBn: BN | undefined = (project as any)
      ?.poolDistributed;

    const projectMatchingPoolLamportsStr = projectMatchingPoolBn
      ? projectMatchingPoolBn.toString()
      : null;
    const roundAreaStr = roundAreaBn ? roundAreaBn.toString() : null;
    const projectAreaStr = projectAreaBn ? projectAreaBn.toString() : null;
    const projectPoolDistributedLamportsStr = projectPoolDistributedBn
      ? projectPoolDistributedBn.toString()
      : null;
    const roundAreaMaxStr = roundAreaMaxBn ? roundAreaMaxBn.toString() : null;

    // Derive round vault PDA and load its balance
    const [roundVaultPk] = PublicKey.findProgramAddressSync(
      [Buffer.from("round_vault"), roundPk.toBuffer()],
      ANECTOS_PROGRAM.programId
    );
    const roundVaultBalanceLamports = await CONNECTION.getBalance(
      roundVaultPk,
      "confirmed"
    );

    // Compute expected settlement delta according to on-chain logic
    // alloc = floor(pool_total * (area_i^2) / (sum area_j^2))
    // delta = clamp(alloc - already, 0..min(vault_balance, pool_remaining))
    const bi = (v: any) => {
      try {
        return BigInt(v ?? 0);
      } catch {
        return BigInt(0);
      }
    };
    // Use project-level pool totals for allocation
    const poolTotal = bi(projectMatchingPoolLamportsStr);
    const roundArea = bi(roundAreaStr);
  const roundAreaMax = bi(roundAreaMaxStr);
    const projArea = bi(projectAreaStr);
    const already = bi(projectMatchingUnlockedStr);
    const rvBal = BigInt(roundVaultBalanceLamports);
    const distributed = bi(projectPoolDistributedLamportsStr);
    const poolRemaining =
      poolTotal > distributed ? poolTotal - distributed : BigInt(0);
    let alloc = BigInt(0);
    if (
      poolTotal > BigInt(0) &&
      roundArea > BigInt(0) &&
      projArea > BigInt(0) 
    ) {
      const num = projArea * projArea;
      const denomArea = roundAreaMax > BigInt(0) ? (roundArea > roundAreaMax ? roundArea : roundAreaMax) : roundArea;
      const den = denomArea * denomArea;
      if (den > BigInt(0)) {
        alloc = (poolTotal * num) / den;
      }
    }
    let expectedDelta = BigInt(0);
    if (alloc > already) expectedDelta = alloc - already;
    if (expectedDelta > rvBal) expectedDelta = rvBal;
    if (expectedDelta > poolRemaining) expectedDelta = poolRemaining;

    const result = {
      // Aliases for convenience
      projectId: projectPk.toBase58(),
      fundingRoundId: roundPk.toBase58(),
      projectPubkey: projectPk.toBase58(),
      owner: ownerPk.toBase58(),
      round: roundPk.toBase58(),
      roundVault: roundVaultPk.toBase58(),
      vault: vaultPk.toBase58(),
      roundOwner: round ? toBase58Maybe((round as any).owner) : null,
      projectCurrentFundingLamports: projectFundingLamportsStr,
      projectCurrentFundingSol: toSol(projectFundingLamportsStr),
      vaultBalanceLamports: String(vaultBalanceLamportsNum),
      vaultBalanceSol: toSol(vaultBalanceLamportsNum),
      roundVaultBalanceLamports: String(roundVaultBalanceLamports),
      roundVaultBalanceSol: toSol(roundVaultBalanceLamports),
      walletBalanceLamports: walletStr
        ? String(walletBalanceLamportsNum)
        : null,
      walletBalanceSol: walletStr ? toSol(walletBalanceLamportsNum) : null,
      // QF metrics (project-level pool)
      matchingPoolLamports: projectMatchingPoolLamportsStr, // kept name for backward compat
      matchingPoolSol: toSol(projectMatchingPoolLamportsStr ?? null),
      roundArea: roundAreaStr,
      projectArea: projectAreaStr,
      contributorCount,
  roundAreaMax: roundAreaMaxStr,
      projectMatchingUnlockedLamports: projectMatchingUnlockedStr,
      poolDistributedLamports: projectPoolDistributedLamportsStr, // kept name for compat
      // New explicit project pool fields
      projectMatchingPoolLamports: projectMatchingPoolLamportsStr,
      projectPoolDistributedLamports: projectPoolDistributedLamportsStr,
      projectPoolRemainingLamports: poolRemaining.toString(),
      expectedSettlementLamports: expectedDelta.toString(),
      expectedSettlementSol: toSol(expectedDelta.toString()),
      // naive canSettle flag — require some pool and some vault balance
      canSettle: expectedDelta > BigInt(0),
    };

    return Response.json(result);
  } catch (e: any) {
    console.error("/api/round GET error:", e);
    return Response.json(
      { error: e?.message || "Failed to fetch round balances" },
      { status: 500 }
    );
  }
}
