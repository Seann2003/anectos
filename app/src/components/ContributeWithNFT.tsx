"use client";

import { useState } from "react";
import { useAuth, useWallet } from "@crossmint/client-sdk-react-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Gift,
  Coins,
  Award,
  CheckCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { useNFTMinting } from "@/hooks/useNFTMinting";
import { toast } from "sonner";

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  targetAmount: number;
  currentAmount: number;
  milestones: number[];
  isWhitelisted: boolean;
}

interface ContributeWithNFTProps {
  project: Project;
  onContributionSuccess?: (amount: number, nftAddress?: string) => void;
}

export function ContributeWithNFT({
  project,
  onContributionSuccess,
}: ContributeWithNFTProps) {
  const { user } = useAuth();
  const { wallet } = useWallet();
  const { mintContributionCertificate, isMinting } = useNFTMinting();

  const [contributionAmount, setContributionAmount] = useState<string>("");
  const [isContributing, setIsContributing] = useState(false);
  const [showNFTPreview, setShowNFTPreview] = useState(false);
  const [lastContribution, setLastContribution] = useState<{
    amount: number;
    nftAddress?: string;
  } | null>(null);

  const handleContribute = async () => {
    if (!wallet?.address || !user) {
      toast.error("Please connect your wallet first");
      return;
    }

    const amount = parseFloat(contributionAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid contribution amount");
      return;
    }

    if (!project.isWhitelisted) {
      toast.error("This project is not yet whitelisted for funding");
      return;
    }

    setIsContributing(true);

    try {
      // Step 1: Process the SOL contribution
      toast.loading("Processing your contribution...", {
        description: "Transferring SOL to the project vault",
      });

      // Simulate SOL transfer (replace with actual implementation)
      await simulateContribution(amount);

      toast.success("Contribution successful!", {
        description: `${amount} SOL contributed to ${project.title}`,
      });

      // Step 2: Mint the NFT certificate
      const nftResult = await mintContributionCertificate(
        {
          id: project.id,
          title: project.title,
          category: project.category,
        },
        amount
      );

      // Update state
      setLastContribution({
        amount,
        nftAddress: nftResult.nftAddress,
      });

      // Show NFT preview
      if (nftResult.success) {
        setShowNFTPreview(true);
      }

      // Reset form
      setContributionAmount("");

      // Notify parent component
      onContributionSuccess?.(amount, nftResult.nftAddress);
    } catch (error: any) {
      console.error("Contribution failed:", error);
      toast.error("Contribution failed", {
        description: error.message || "Please try again",
      });
    } finally {
      setIsContributing(false);
    }
  };

  // Simulate SOL contribution (replace with actual implementation)
  const simulateContribution = async (amount: number): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(
          `Simulated ${amount} SOL contribution to project ${project.id}`
        );
        resolve();
      }, 2000);
    });
  };

  const isProcessing = isContributing || isMinting;

  return (
    <div className="space-y-6">
      {/* Contribution Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Contribute to {project.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Project Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <Label className="text-sm text-gray-600 dark:text-gray-400">
                Target Amount
              </Label>
              <p className="font-semibold">{project.targetAmount} SOL</p>
            </div>
            <div>
              <Label className="text-sm text-gray-600 dark:text-gray-400">
                Current Amount
              </Label>
              <p className="font-semibold text-green-600">
                {project.currentAmount} SOL
              </p>
            </div>
            <div>
              <Label className="text-sm text-gray-600 dark:text-gray-400">
                Category
              </Label>
              <Badge variant="secondary">{project.category}</Badge>
            </div>
            <div>
              <Label className="text-sm text-gray-600 dark:text-gray-400">
                Status
              </Label>
              <Badge
                variant={project.isWhitelisted ? "default" : "destructive"}
              >
                {project.isWhitelisted ? "Whitelisted" : "Pending"}
              </Badge>
            </div>
          </div>

          {/* Contribution Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Contribution Amount (SOL)</Label>
            <Input
              id="amount"
              type="number"
              step="0.1"
              min="0.1"
              placeholder="Enter SOL amount"
              value={contributionAmount}
              onChange={(e) => setContributionAmount(e.target.value)}
              disabled={isProcessing}
            />
          </div>

          {/* NFT Reward Info */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <Gift className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-100">
                🎁 Contribution Certificate NFT
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                You'll receive a unique NFT certificate proving your
                contribution to this regenerative project. This certificate
                includes your contribution details and can be viewed in your
                wallet.
              </p>
            </div>
          </div>

          {/* Contribute Button */}
          <Button
            onClick={handleContribute}
            disabled={
              !wallet?.address || !project.isWhitelisted || isProcessing
            }
            className="w-full"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isContributing ? "Contributing..." : "Minting Certificate..."}
              </>
            ) : (
              <>
                <Award className="h-4 w-4 mr-2" />
                Contribute & Mint Certificate
              </>
            )}
          </Button>

          {!wallet?.address && (
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              Please connect your wallet to contribute
            </p>
          )}
        </CardContent>
      </Card>

      {/* NFT Success Preview */}
      {showNFTPreview && lastContribution && (
        <Card className="border-green-200 dark:border-green-800">
          <CardHeader className="bg-green-50 dark:bg-green-900/20">
            <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
              <CheckCircle className="h-5 w-5" />
              Contribution Certificate Minted!
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
                <div className="text-center">
                  <Award className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Anectos Contribution Certificate
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {lastContribution.amount} SOL • {project.title}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-gray-600 dark:text-gray-400">
                    Contribution Amount
                  </Label>
                  <p className="font-semibold">{lastContribution.amount} SOL</p>
                </div>
                <div>
                  <Label className="text-gray-600 dark:text-gray-400">
                    Project
                  </Label>
                  <p className="font-semibold">{project.title}</p>
                </div>
                <div>
                  <Label className="text-gray-600 dark:text-gray-400">
                    Category
                  </Label>
                  <p className="font-semibold">{project.category}</p>
                </div>
                <div>
                  <Label className="text-gray-600 dark:text-gray-400">
                    Date
                  </Label>
                  <p className="font-semibold">
                    {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>

              {lastContribution.nftAddress && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      window.open(
                        `https://explorer.solana.com/address/${lastContribution.nftAddress}?cluster=devnet`,
                        "_blank"
                      );
                    }}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View on Explorer
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowNFTPreview(false)}
                  >
                    Close
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
