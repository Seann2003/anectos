import { NextRequest } from "next/server";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createGenericFile,
  generateSigner,
  percentAmount,
  signerIdentity,
  sol,
  publicKey,
} from "@metaplex-foundation/umi";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";
import {
  createProgrammableNft,
  mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";
import { base58 } from "@metaplex-foundation/umi/serializers";

type CreateNftRequest = {
  name?: string;
  description?: string;
  imageBase64?: string; // data without data: URI prefix
  imageMime?: string; // default image/png
  externalUrl?: string;
  attributes?: Array<{ trait_type: string; value: string }>;
  sellerFeeBps?: number; // e.g. 550 => 5.5%
  ruleSet?: string | null; // public key string
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as CreateNftRequest;
    const name = body.name || "My NFT";
    const description = body.description || "Programmable NFT";
    const imageMime = body.imageMime || "image/png";
    const externalUrl = body.externalUrl || "https://example.com";
    const attributes = Array.isArray(body.attributes)
      ? body.attributes.filter(
          (a) =>
            a && typeof a.trait_type === "string" && typeof a.value === "string"
        )
      : [];
    const sellerFeeBps = Number.isFinite(body.sellerFeeBps)
      ? Number(body.sellerFeeBps)
      : 550;
    const ruleSet = body.ruleSet ? body.ruleSet : null;

    // 1. Setup Umi (NOTE: replace RPC with your actual devnet or localnet endpoint if desired)
    const umi = createUmi("https://api.devnet.solana.com")
      .use(mplTokenMetadata())
      .use(
        irysUploader({
          address: "https://devnet.irys.xyz",
        })
      );

    const signer = generateSigner(umi);
    umi.use(signerIdentity(signer));

    // 2. Airdrop (devnet only) – best-effort, ignore failure
    try {
      await umi.rpc.airdrop(umi.identity.publicKey, sol(1));
    } catch {}

    // 3. Prepare image file. If none provided, use a 1x1 PNG placeholder.
    let imageBytes: Uint8Array;
    if (body.imageBase64) {
      try {
        imageBytes = Uint8Array.from(Buffer.from(body.imageBase64, "base64"));
      } catch {
        return Response.json(
          { ok: false, error: "Invalid base64 in imageBase64" },
          { status: 400 }
        );
      }
    } else {
      // Tiny transparent PNG
      imageBytes = Uint8Array.from(
        Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==",
          "base64"
        )
      );
    }

    const filename = `image.${imageMime.split("/").pop() || "png"}`;
    const umiImageFile = createGenericFile(imageBytes, filename, {
      tags: [{ name: "Content-Type", value: imageMime }],
    });

    // 4. Upload image
    const [imageUri] = await umi.uploader
      .upload([umiImageFile])
      .catch((err) => {
        throw new Error("Image upload failed: " + (err?.message || err));
      });

    // 5. Upload metadata JSON
    const metadata = {
      name,
      description,
      image: imageUri,
      external_url: externalUrl,
      attributes,
      properties: {
        files: [
          {
            uri: imageUri,
            type: imageMime,
          },
        ],
        category: "image",
      },
    };

    const metadataUri = await umi.uploader.uploadJson(metadata).catch((err) => {
      throw new Error("Metadata upload failed: " + (err?.message || err));
    });

    // 6. Mint pNFT
    const nftSigner = generateSigner(umi);
    const tx = await createProgrammableNft(umi, {
      mint: nftSigner,
      sellerFeeBasisPoints: percentAmount(sellerFeeBps / 100),
      name,
      uri: metadataUri,
      ruleSet: ruleSet ? publicKey(ruleSet) : null,
    }).sendAndConfirm(umi);

    const signature = base58.deserialize(tx.signature)[0];
    const explorerTx = `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
    const explorerMint = `https://explorer.solana.com/address/${nftSigner.publicKey}?cluster=devnet`;

    return Response.json(
      {
        ok: true,
        mint: nftSigner.publicKey,
        metadataUri,
        imageUri,
        signature,
        explorerTx,
        explorerMint,
        sellerFeeBps,
      },
      { status: 200 }
    );
  } catch (e: any) {
    return Response.json(
      { ok: false, error: e?.message || String(e) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return Response.json({ ok: false, error: "Use POST" }, { status: 405 });
}
