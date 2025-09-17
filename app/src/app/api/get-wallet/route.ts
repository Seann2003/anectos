// pages/api/get-wallet.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { keypairIdentity } from "@metaplex-foundation/umi";
import fs from "fs";
import path from "path";

export default function GET(req: NextApiRequest, res: NextApiResponse) {
  try {
    // safer: resolve file path relative to project root
    const filePath = path.resolve(process.cwd(), "pages/api/dev-wallet.json");

    const secret = JSON.parse(fs.readFileSync(filePath, "utf8"));

    const umi = createUmi(
      "https://devnet.helius-rpc.com/?api-key=3e441bb8-f92a-4d28-9468-8946faf092b0"
    );

    umi.use(
      keypairIdentity(
        umi.eddsa.createKeypairFromSecretKey(new Uint8Array(secret))
      )
    );

    console.log("Using wallet:", umi.identity.publicKey.toString());

    res.status(200).json({ publicKey: umi.identity.publicKey.toString() });
  } catch (err: any) {
    console.error("Error in /api/get-wallet:", err);
    res.status(500).json({ error: err.message });
  }
}
