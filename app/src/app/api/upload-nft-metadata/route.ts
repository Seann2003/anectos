import { NextRequest } from "next/server";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createGenericFile,
  generateSigner,
  signerIdentity,
} from "@metaplex-foundation/umi";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";
import { mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";

type UploadReq = {
  name?: string;
  description?: string;
  imageBase64?: string; // raw base64 (no data: prefix)
  imageMime?: string; // default image/png
  externalUrl?: string;
  attributes?: Array<{ trait_type: string; value: string }>;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as UploadReq;
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

    const umi = createUmi("https://api.devnet.solana.com")
      .use(mplTokenMetadata())
      .use(
        irysUploader({
          address: "https://devnet.irys.xyz",
        })
      );

    // Uploader needs a signer (for some plugin operations / rent). Use ephemeral.
    const tempSigner = generateSigner(umi);
    umi.use(signerIdentity(tempSigner));

    // Prepare image bytes
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
      // 1x1 PNG
      imageBytes = Uint8Array.from(
        Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==",
          "base64"
        )
      );
    }

    const fileExt = imageMime.split("/").pop() || "png";
    const genericFile = createGenericFile(imageBytes, `image.${fileExt}`, {
      tags: [{ name: "Content-Type", value: imageMime }],
    });

    const [imageUri] = await umi.uploader.upload([genericFile]).catch((err) => {
      throw new Error("Image upload failed: " + (err?.message || err));
    });

    const metadataJson = {
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

    const metadataUri = await umi.uploader
      .uploadJson(metadataJson)
      .catch((err) => {
        throw new Error("Metadata upload failed: " + (err?.message || err));
      });

    return Response.json(
      {
        ok: true,
        metadataUri,
        imageUri,
        name,
        description,
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
