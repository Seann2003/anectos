import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { ANECTOS_PROGRAM } from "@/lib/constants";
import { projectPdaFromOwner, projectMetadataPda } from "@/lib/pda";

type ProjectWithMeta = {
  projectPubkey: string;
  project: any | null;
  projectMetaPubkey?: string;
  projectMeta?: any | null;
};

function isPublicKeyLike(v: any): v is PublicKey {
  return (
    v &&
    typeof v === "object" &&
    typeof (v as any).toBase58 === "function" &&
    // one of these should exist on PublicKey across versions
    (typeof (v as any).toBuffer === "function" ||
      typeof (v as any).toBytes === "function")
  );
}

function sanitize<T = any>(data: any): T {
  if (data === null || data === undefined) return data as T;
  if (BN.isBN?.(data)) return (data as BN).toString() as unknown as T;
  if (typeof data === "bigint") return data.toString() as unknown as T;
  // Avoid relying on instanceof due to potential duplicate module instances
  if (data instanceof PublicKey || isPublicKeyLike(data))
    return (data as PublicKey).toBase58() as unknown as T;
  if (Array.isArray(data)) return data.map((v) => sanitize(v)) as unknown as T;
  if (typeof data === "object") {
    const out: any = {};
    for (const [k, v] of Object.entries(data)) out[k] = sanitize(v);
    return out as T;
  }
  return data as T;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerStr = searchParams.get("owner");
    const idStr = searchParams.get("id");
    const mode = searchParams.get("mode"); // "single" | "list" | undefined

    // 0) If id (project pubkey) provided, fetch that specific project and meta
    if (idStr) {
      const projectPk = new PublicKey(idStr);
      const project = await ANECTOS_PROGRAM.account.project.fetchNullable(
        projectPk
      );
      if (!project) {
        return Response.json(
          { error: "Project not found", id: idStr },
          { status: 404 }
        );
      }
      const [projectMetaPk] = projectMetadataPda(projectPk);
      const projectMeta =
        await ANECTOS_PROGRAM.account.projectMeta.fetchNullable(projectMetaPk);
      return Response.json({
        projectPubkey: projectPk.toBase58(),
        project: sanitize(project),
        projectMetaPubkey: projectMetaPk.toBase58(),
        projectMeta: sanitize(projectMeta),
      });
    }

    // 1) If an owner is provided and mode !== list: fetch that owner's project PDA directly
    if (ownerStr && mode !== "list") {
      const ownerPk = new PublicKey(ownerStr);
      const [projectPk] = projectPdaFromOwner(ownerPk);
      const project = await ANECTOS_PROGRAM.account.project.fetchNullable(
        projectPk
      );
      if (!project) {
        return Response.json(
          { error: "Project not found for owner", owner: ownerStr },
          { status: 404 }
        );
      }
      const [projectMetaPk] = projectMetadataPda(projectPk);
      const projectMeta =
        await ANECTOS_PROGRAM.account.projectMeta.fetchNullable(projectMetaPk);

      const payload: ProjectWithMeta = {
        projectPubkey: projectPk.toBase58(),
        project: sanitize(project),
        projectMetaPubkey: projectMetaPk.toBase58(),
        projectMeta: sanitize(projectMeta),
      };
      return Response.json(payload);
    }

    // 2) If mode === list and owner provided: list all projects for that owner using memcmp on owner field
    if (ownerStr && mode === "list") {
      const ownerPk = new PublicKey(ownerStr);
      // Project layout: discriminator(8) + project_id(32) + round(32) + owner(32)
      const ownerOffset = 8 + 32 + 32; // 72
      const accounts = await ANECTOS_PROGRAM.account.project.all([
        { memcmp: { offset: ownerOffset, bytes: ownerPk.toBase58() } },
      ]);

      const items: ProjectWithMeta[] = await Promise.all(
        accounts.map(async (acc) => {
          const projectPubkey = acc.publicKey;
          const [metaPk] = projectMetadataPda(projectPubkey);
          const projectMeta =
            await ANECTOS_PROGRAM.account.projectMeta.fetchNullable(metaPk);
          return {
            projectPubkey: projectPubkey.toBase58(),
            project: sanitize(acc.account),
            projectMetaPubkey: metaPk.toBase58(),
            projectMeta: sanitize(projectMeta),
          };
        })
      );
      return Response.json({ count: items.length, items });
    }

    // 3) No owner provided: return all projects (use with care on real networks)
    const all = await ANECTOS_PROGRAM.account.project.all();
    const items: ProjectWithMeta[] = await Promise.all(
      all.map(async (acc) => {
        const [metaPk] = projectMetadataPda(acc.publicKey);
        const projectMeta =
          await ANECTOS_PROGRAM.account.projectMeta.fetchNullable(metaPk);
        return {
          projectPubkey: acc.publicKey.toBase58(),
          project: sanitize(acc.account),
          projectMetaPubkey: metaPk.toBase58(),
          projectMeta: sanitize(projectMeta),
        };
      })
    );
    return Response.json({ count: items.length, items });
  } catch (e: any) {
    console.error("/api/project GET error:", e);
    return Response.json(
      { error: e?.message || "Failed to fetch projects" },
      { status: 500 }
    );
  }
}
