import { NextResponse, type NextRequest } from "next/server";
import { pinata } from "@/lib/pinata";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file = data.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    const apiKey = process.env.PINATA_API_KEY;
    const secret = process.env.PINATA_SECRET_API_KEY;
    if (!apiKey || !secret) {
      return NextResponse.json(
        { error: "Missing PINATA_API_KEY or PINATA_SECRET_API_KEY" },
        { status: 500 }
      );
    }

    const resp = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        pinata_api_key: apiKey,
        pinata_secret_api_key: secret,
      },
      body: data,
    });

    const json = await resp.json();
    if (!resp.ok) {
      return NextResponse.json(
        {
          error: json?.error || json?.message || "Pinata error",
          details: json,
        },
        { status: 502 }
      );
    }

    console.log("Pinata upload response:", json);

    const cid = json.IpfsHash;

    const gatewayBase =
      process.env.PINATA_GATEWAY || "https://gateway.pinata.cloud";
    const metadataUri = `ipfs://${cid}`;
    const gatewayUrl = `${gatewayBase.replace(/\/$/, "")}/ipfs/${cid}`;

    return NextResponse.json({ cid, metadataUri, gatewayUrl }, { status: 200 });
  } catch (e: any) {
    console.error("Pinata upload error:", e);
    return NextResponse.json(
      { error: e?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
