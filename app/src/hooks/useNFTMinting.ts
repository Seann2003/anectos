export function useNFTMinting() {
  const isMinting = false;
  const mintedNFTs: string[] = [];

  const mintContributionCertificate = async () => {
    return {
      success: false as const,
      error: "NFT minting disabled in DB-only mode",
    };
  };

  return { mintContributionCertificate, isMinting, mintedNFTs };
}

export {};
