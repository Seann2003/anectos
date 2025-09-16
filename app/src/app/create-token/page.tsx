// "use client";

// import { useState } from "react";
// import {
//   Keypair,
//   PublicKey,
//   SystemProgram,
//   Transaction,
// } from "@solana/web3.js";
// import { CONNECTION, TOKEN_METADATA_PROGRAM_ID } from "@/lib/constants";
// import {
//   createInitializeMintInstruction,
//   getAssociatedTokenAddress,
//   createAssociatedTokenAccountInstruction,
//   MINT_SIZE,
//   TOKEN_PROGRAM_ID,
// } from "@solana/spl-token";
// import {
//   createMetadataAccountV3Instruction,
//   PROGRAM_ID as METADATA_PROGRAM_ID,
// } from "@metaplex-foundation/mpl-token-metadata";

// export default function CreateTokenPage() {
//   const [mintAddr, setMintAddr] = useState<string | null>(null);
//   const [status, setStatus] = useState("");

//   const createToken = async () => {
//     try {
//       setStatus("Creating token...");

//       // Generate a new keypair for the mint
//       const mint = Keypair.generate();

//       // Get fee payer (replace with your wallet adapter in real app)
//       const payer = Keypair.generate();
//       const airdropSig = await CONNECTION.requestAirdrop(payer.publicKey, 1e9);
//       await CONNECTION.confirmTransaction(airdropSig, "confirmed");

//       const lamports = await CONNECTION.getMinimumBalanceForRentExemption(
//         MINT_SIZE
//       );

//       // Create mint account
//       const tx = new Transaction().add(
//         SystemProgram.createAccount({
//           fromPubkey: payer.publicKey,
//           newAccountPubkey: mint.publicKey,
//           space: MINT_SIZE,
//           lamports,
//           programId: TOKEN_PROGRAM_ID,
//         }),
//         createInitializeMintInstruction(
//           mint.publicKey,
//           9, // decimals
//           payer.publicKey, // mint authority
//           payer.publicKey // freeze authority
//         )
//       );

//       // Derive metadata PDA
//       const [metadataPda] = PublicKey.findProgramAddressSync(
//         [
//           Buffer.from("metadata"),
//           METADATA_PROGRAM_ID.toBuffer(),
//           mint.publicKey.toBuffer(),
//         ],
//         METADATA_PROGRAM_ID
//       );

//       // Add metadata instruction
//       tx.add(
//         createMetadataAccountV3Instruction(
//           {
//             metadata: metadataPda,
//             mint: mint.publicKey,
//             mintAuthority: payer.publicKey,
//             payer: payer.publicKey,
//             updateAuthority: payer.publicKey,
//           },
//           {
//             createMetadataAccountArgsV3: {
//               data: {
//                 name: "MyToken",
//                 symbol: "MTK",
//                 uri: "https://arweave.net/your_metadata.json", // must be JSON metadata
//                 sellerFeeBasisPoints: 0,
//                 creators: null,
//                 collection: null,
//                 uses: null,
//               },
//               isMutable: true,
//               collectionDetails: null,
//             },
//           }
//         )
//       );

//       // Send tx
//       const sig = await CONNECTION.sendTransaction(tx, [payer, mint], {
//         skipPreflight: false,
//       });
//       await CONNECTION.confirmTransaction(sig, "confirmed");

//       setMintAddr(mint.publicKey.toBase58());
//       setStatus(`✅ Token created! Signature: ${sig}`);
//     } catch (e: any) {
//       setStatus(`❌ Error: ${e.message}`);
//     }
//   };

//   return (
//     <div className="max-w-xl mx-auto p-6 space-y-4">
//       <h1 className="text-xl font-semibold">Create SPL Token with Metadata</h1>
//       <button
//         onClick={createToken}
//         className="bg-blue-600 text-white px-4 py-2 rounded"
//       >
//         Create Token
//       </button>
//       {status && <p className="mt-4">{status}</p>}
//       {mintAddr && (
//         <p className="break-all">
//           Mint Address: <span className="font-mono">{mintAddr}</span>
//         </p>
//       )}
//     </div>
//   );
// }
