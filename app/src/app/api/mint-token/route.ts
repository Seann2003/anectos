import { createNft } from "@metaplex-foundation/mpl-token-metadata";
import { generateSigner } from "@metaplex-foundation/umi";
import { NextRequest } from "next/server";
import { mintV1, TokenStandard } from "@metaplex-foundation/mpl-token-metadata";
import { umi } from "@/lib/constants";

export async function POST(req: NextRequest) {
  const mint = generateSigner(umi);
  await mintV1(umi, {
    mint: mint.publicKey,
    authority: authority,
    amount: 1,
    tokenOwner: tokenOwner,
    tokenStandard: TokenStandard.NonFungible,
  }).sendAndConfirm(umi);
}
