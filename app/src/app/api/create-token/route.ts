import { NextRequest } from "next/server";
import { CONNECTION, SURFPOOL_RPC } from "@/lib/constants";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import {
  createSignerFromKeypair,
  keypairIdentity,
  publicKey as umiPublicKey,
} from "@metaplex-foundation/umi";
import {
  findMetadataPda,
  createMetadataAccountV3,
} from "@metaplex-foundation/mpl-token-metadata";
import { umi } from "@/lib/constants";

type CreateTokenRequest = {
  cid?: string;
  name?: string;
  symbol?: string;
  decimals?: number;
  initialSupply?: string | number;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as CreateTokenRequest;
    const cid =
      body.cid || "bafkreigcjffzx7ob3ryjfx24klabgndzdl3shdo7wug5nhugbvzjrcw7hy";
    const decimals = Number.isFinite(body.decimals) ? Number(body.decimals) : 9;
    const initialSupplyRaw =
      typeof body.initialSupply === "string"
        ? BigInt(body.initialSupply)
        : typeof body.initialSupply === "number"
        ? BigInt(Math.floor(body.initialSupply))
        : BigInt(0);

    const uri = `https://ipfs.io/ipfs/${cid}`;
    let name = body.name || "Anectos Token";
    let symbol = body.symbol || "ANECT";

    // Optional: try to fetch name/symbol from provided CID JSON if present
    try {
      const r = await fetch(uri, { cache: "no-store" });
      if (r.ok) {
        const j = await r.json().catch(() => null);
        if (j && typeof j === "object") {
          if (!body.name && typeof (j as any).name === "string")
            name = (j as any).name;
          if (!body.symbol && typeof (j as any).symbol === "string")
            symbol = (j as any).symbol;
        }
      }
    } catch {}

    // Create a temporary payer with SOL on localnet
    const payer = Keypair.generate();
    const airdropSig = await CONNECTION.requestAirdrop(
      payer.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await CONNECTION.confirmTransaction(airdropSig, "confirmed");

    // 1) Create the mint
    const mintAuthority = payer.publicKey;
    const freezeAuthority = payer.publicKey;
    const mintPubkey = await createMint(
      CONNECTION,
      payer,
      mintAuthority,
      freezeAuthority,
      decimals
    );

    // 2) Create Metaplex token metadata account (Fungible) via Umi
    const umiKeypair = umi.eddsa.createKeypairFromSecretKey(payer.secretKey);
    const umiSigner = createSignerFromKeypair(umi, umiKeypair);
    umi.use(keypairIdentity(umiSigner));

    const mintUmi = umiPublicKey(mintPubkey.toBase58());
    const metadataPdaUmi = findMetadataPda(umi, { mint: mintUmi });

    const builder = createMetadataAccountV3(umi, {
      metadata: metadataPdaUmi,
      mint: mintUmi,
      mintAuthority: umiSigner,
      payer: umiSigner,
      updateAuthority: umiSigner.publicKey,
      data: {
        name,
        symbol,
        uri,
        sellerFeeBasisPoints: 0,
        creators: null,
        collection: null,
        uses: null,
      },
      isMutable: true,
      collectionDetails: null,
    });
    const { signature: metaSig } = await builder.sendAndConfirm(umi);

    // 3) Optionally mint initial supply to payer's ATA
    let ata: PublicKey | null = null;
    let mintSig: string | null = null;
    if (initialSupplyRaw > BigInt(0)) {
      const ataAcc = await getOrCreateAssociatedTokenAccount(
        CONNECTION,
        payer,
        mintPubkey,
        payer.publicKey
      );
      ata = ataAcc.address;
      mintSig = await mintTo(
        CONNECTION,
        payer,
        mintPubkey,
        ata,
        payer,
        Number(initialSupplyRaw)
      );
      await CONNECTION.confirmTransaction(mintSig, "confirmed");
    }

    return Response.json(
      {
        ok: true,
        mint: mintPubkey.toBase58(),
        metadata: metadataPdaUmi.toString(),
        name,
        symbol,
        uri,
        decimals,
        authority: payer.publicKey.toBase58(),
        airdropSig,
        metadataSig: metaSig,
        ata: ata ? ata.toBase58() : null,
        mintSig,
      },
      { status: 200 }
    );
  } catch (e: any) {
    console.error("/api/create-token error:", e);
    return Response.json(
      { ok: false, error: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  // Convenience: allow GET with ?cid=...&name=...&symbol=... for quick testing.
  const { searchParams } = new URL(req.url);
  const cid = searchParams.get("cid") || undefined;
  const name = searchParams.get("name") || undefined;
  const symbol = searchParams.get("symbol") || undefined;
  const decimals = searchParams.get("decimals");
  const initialSupply = searchParams.get("initialSupply");
  // Proxy to POST
  const body: CreateTokenRequest = {
    cid,
    name,
    symbol,
    decimals: decimals ? Number(decimals) : undefined,
    initialSupply: initialSupply ? initialSupply : undefined,
  };
  return POST(
    new Request(req.url, { method: "POST", body: JSON.stringify(body) }) as any
  );
}
