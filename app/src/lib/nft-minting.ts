import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import { create, mplCore, fetchAsset } from "@metaplex-foundation/mpl-core";
import {
  generateSigner,
  percentAmount,
  publicKey,
  some,
  sol,
  Umi,
} from "@metaplex-foundation/umi";

// Initialize UMI instance
export function initializeUmi(): Umi {
  const rpcUrl =
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";
  return createUmi(rpcUrl).use(mplCore());
}

/**
 * Contribution NFT Metadata
 */
export interface ContributionNFTMetadata {
  projectTitle: string;
  contributionAmount: number;
  contributorAddress: string;
  projectId: string;
  contributionDate: string;
  milestone?: string;
  category: string;
}

/**
 * Create contribution NFT for a user who contributed to a project
 */
export async function mintContributionNFT(
  wallet: any,
  metadata: ContributionNFTMetadata
): Promise<string> {
  try {
    // Initialize UMI with wallet
    const umi = initializeUmi().use(walletAdapterIdentity(wallet));

    // Generate unique asset signer
    const asset = generateSigner(umi);

    // Create off-chain metadata
    const nftMetadata = createNFTMetadata(metadata);

    // Upload metadata to decentralized storage (simplified for demo)
    const metadataUri = await uploadMetadata(nftMetadata);

    // Create the NFT
    const createInstruction = create(umi, {
      asset,
      name: `Anectos Contribution #${generateContributionId(metadata)}`,
      uri: metadataUri,
      plugins: [
        {
          type: "Attributes",
          attributeList: [
            { key: "Project", value: metadata.projectTitle },
            {
              key: "Contribution",
              value: `${metadata.contributionAmount} SOL`,
            },
            { key: "Date", value: metadata.contributionDate },
            { key: "Category", value: metadata.category },
            {
              key: "Contributor",
              value: metadata.contributorAddress.slice(0, 8) + "...",
            },
          ],
        },
        // Simplified - remove royalties plugin for now
      ],
    });

    // Send transaction
    await createInstruction.sendAndConfirm(umi);

    console.log("Contribution NFT minted:", asset.publicKey);
    return asset.publicKey.toString();
  } catch (error) {
    console.error("Error minting contribution NFT:", error);
    throw new Error(`Failed to mint contribution NFT: ${error}`);
  }
}

/**
 * Create metadata object for the contribution NFT
 */
function createNFTMetadata(metadata: ContributionNFTMetadata) {
  return {
    name: `Anectos Contribution #${generateContributionId(metadata)}`,
    description: `Certificate of contribution to "${metadata.projectTitle}" on Anectos platform. This NFT represents a ${metadata.contributionAmount} SOL contribution made on ${metadata.contributionDate}.`,
    image: generateContributionImage(metadata),
    external_url: `https://anectos.io/projects/${metadata.projectId}`,
    attributes: [
      {
        trait_type: "Project",
        value: metadata.projectTitle,
      },
      {
        trait_type: "Contribution Amount",
        value: metadata.contributionAmount,
        display_type: "number",
      },
      {
        trait_type: "Category",
        value: metadata.category,
      },
      {
        trait_type: "Contribution Date",
        value: metadata.contributionDate,
        display_type: "date",
      },
      {
        trait_type: "Contributor",
        value: metadata.contributorAddress,
      },
      {
        trait_type: "Project ID",
        value: metadata.projectId,
      },
      ...(metadata.milestone
        ? [
            {
              trait_type: "Milestone",
              value: metadata.milestone,
            },
          ]
        : []),
    ],
    properties: {
      category: "contribution",
      files: [
        {
          uri: generateContributionImage(metadata),
          type: "image/png",
        },
      ],
      creators: [
        {
          address: metadata.contributorAddress,
          share: 100,
        },
      ],
    },
  };
}

/**
 * Generate a unique contribution ID
 */
function generateContributionId(metadata: ContributionNFTMetadata): string {
  const date = new Date(metadata.contributionDate);
  const timestamp = date.getTime().toString(36);
  const projectHash = metadata.projectId.slice(-4);
  const contributorHash = metadata.contributorAddress.slice(-4);
  return `${timestamp}-${projectHash}-${contributorHash}`.toUpperCase();
}

/**
 * Generate contribution certificate image URL
 * In production, this would generate a dynamic image with the contribution details
 */
function generateContributionImage(metadata: ContributionNFTMetadata): string {
  // For demo, using a placeholder service that generates certificates
  // In production, you'd use a service like Canvas API, Fabric.js, or a custom image generator
  const params = new URLSearchParams({
    text: `Contribution Certificate`,
    project: metadata.projectTitle,
    amount: `${metadata.contributionAmount} SOL`,
    date: metadata.contributionDate,
    contributor: metadata.contributorAddress.slice(0, 8) + "...",
    category: metadata.category,
  });

  // Using a placeholder for now - replace with your certificate generator
  return `https://via.placeholder.com/512x512/4F46E5/FFFFFF?text=Anectos+Contribution+Certificate`;
}

/**
 * Upload metadata to decentralized storage
 * In production, use IPFS, Arweave, or other decentralized storage
 */
async function uploadMetadata(metadata: any): Promise<string> {
  try {
    // For demo purposes, using a mock URI
    // In production, upload to IPFS or Arweave
    const metadataString = JSON.stringify(metadata, null, 2);

    // Mock upload to IPFS (replace with actual implementation)
    const mockIpfsHash = "Qm" + Math.random().toString(36).substring(2, 15);
    const uri = `https://ipfs.io/ipfs/${mockIpfsHash}`;

    console.log("Metadata uploaded to:", uri);
    console.log("Metadata content:", metadataString);

    return uri;
  } catch (error) {
    console.error("Error uploading metadata:", error);
    throw new Error("Failed to upload NFT metadata");
  }
}

/**
 * Fetch contribution NFT details
 */
export async function fetchContributionNFT(assetAddress: string): Promise<any> {
  try {
    const umi = initializeUmi();
    const asset = await fetchAsset(umi, publicKey(assetAddress));
    return asset;
  } catch (error) {
    console.error("Error fetching contribution NFT:", error);
    throw new Error("Failed to fetch contribution NFT");
  }
}

/**
 * Get all contribution NFTs for a user
 */
export async function getUserContributionNFTs(
  userAddress: string
): Promise<any[]> {
  try {
    // In production, you'd query the blockchain for all NFTs owned by the user
    // that match the Anectos contribution pattern
    console.log(`Fetching contribution NFTs for user: ${userAddress}`);

    // Mock implementation - replace with actual blockchain query
    return [];
  } catch (error) {
    console.error("Error fetching user contribution NFTs:", error);
    return [];
  }
}

/**
 * Types for contribution NFT system
 */
export interface ContributionNFT {
  address: string;
  name: string;
  image: string;
  metadata: ContributionNFTMetadata;
  mintDate: string;
}

export interface NFTMintResult {
  success: boolean;
  nftAddress?: string;
  error?: string;
  transactionSignature?: string;
}

// Stub for NFT minting functionality
export {};
export {};
