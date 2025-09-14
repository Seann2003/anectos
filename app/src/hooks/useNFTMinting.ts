import { useState, useCallback } from "react";
import { useWallet } from "@crossmint/client-sdk-react-ui";
import {
  mintContributionNFT,
  ContributionNFTMetadata,
  NFTMintResult,
} from "../lib/nft-minting";
import { toast } from "sonner";

export function useNFTMinting() {
  const { wallet } = useWallet();
  const [isMinting, setIsMinting] = useState(false);
  const [mintedNFTs, setMintedNFTs] = useState<string[]>([]);

  /**
   * Mint an NFT for a user's contribution to a project
   */
  const mintContributionCertificate = useCallback(
    async (
      projectData: {
        id: string;
        title: string;
        category: string;
      },
      contributionAmount: number
    ): Promise<NFTMintResult> => {
      if (!wallet?.address) {
        return {
          success: false,
          error: "Wallet not connected",
        };
      }

      setIsMinting(true);

      try {
        // Prepare NFT metadata
        const metadata: ContributionNFTMetadata = {
          projectTitle: projectData.title,
          contributionAmount,
          contributorAddress: wallet.address,
          projectId: projectData.id,
          contributionDate: new Date().toISOString(),
          category: projectData.category,
        };

        // Show minting progress
        toast.loading("Minting your contribution certificate...", {
          description: "Please confirm the transaction in your wallet",
        });

        // Mint the NFT
        const nftAddress = await mintContributionNFT(wallet, metadata);

        // Update local state
        setMintedNFTs((prev) => [...prev, nftAddress]);

        // Success notification
        toast.success("Contribution Certificate Minted!", {
          description: `Your NFT certificate has been created. Address: ${nftAddress.slice(
            0,
            8
          )}...`,
          action: {
            label: "View on Explorer",
            onClick: () => {
              window.open(
                `https://explorer.solana.com/address/${nftAddress}?cluster=devnet`,
                "_blank"
              );
            },
          },
        });

        return {
          success: true,
          nftAddress,
        };
      } catch (error: any) {
        console.error("NFT minting failed:", error);

        toast.error("Failed to mint certificate", {
          description: error.message || "Please try again",
        });

        return {
          success: false,
          error: error.message || "Unknown error occurred",
        };
      } finally {
        setIsMinting(false);
        toast.dismiss(); // Dismiss loading toast
      }
    },
    [wallet]
  );

  return {
    mintContributionCertificate,
    isMinting,
    mintedNFTs,
  };
}
