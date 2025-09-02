"use client";

import { useState, useEffect } from "react";
import { useAuth, useWallet } from "@crossmint/client-sdk-react-ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Vote,
  Clock,
  Users,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  MessageSquare,
  Award,
  Target,
} from "lucide-react";

// Mock DAO proposals data
const mockProposals: Proposal[] = [
  {
    id: 1,
    title: "Fund Ocean Cleanup Robot Development",
    description:
      "Proposal to fund the development of autonomous robots for ocean plastic cleanup. This innovative technology will help address SDG 14: Life Below Water.",
    proposer: "BlueOcean.sol",
    requestedAmount: 100000,
    category: "Technology",
    status: "active" as const,
    votesFor: 1250,
    votesAgainst: 350,
    totalVotingPower: 2000,
    timeLeft: 5,
    created: "2024-01-15",
    minimumThreshold: 1000,
    requiredMajority: 66,
    sdgGoals: ["Life Below Water", "Innovation"],
    businessPlan: "Detailed 50-page business plan attached",
    teamExperience: "15+ years in marine technology",
    impactMetrics: "Target: 1000 tons of plastic removal per year",
  },
  {
    id: 2,
    title: "Regenerative Agriculture Education Program",
    description:
      "Create educational materials and workshops to teach regenerative farming practices to smallholder farmers across developing nations.",
    proposer: "GreenGrow.sol",
    requestedAmount: 50000,
    category: "Education",
    status: "active" as const,
    votesFor: 890,
    votesAgainst: 120,
    totalVotingPower: 1500,
    timeLeft: 12,
    created: "2024-01-20",
    minimumThreshold: 750,
    requiredMajority: 60,
    sdgGoals: ["Zero Hunger", "Quality Education", "Climate Action"],
    businessPlan: "Community-driven curriculum development",
    teamExperience: "Agricultural experts with 20+ years",
    impactMetrics: "Train 5000 farmers in first year",
  },
  {
    id: 3,
    title: "Solar Microgrids for Remote Communities",
    description:
      "Deploy solar-powered microgrids to provide clean energy access to remote communities without grid connectivity.",
    proposer: "SolarPower.sol",
    requestedAmount: 150000,
    category: "Energy",
    status: "passed" as const,
    votesFor: 1800,
    votesAgainst: 200,
    totalVotingPower: 2100,
    timeLeft: 0,
    created: "2024-01-10",
    minimumThreshold: 1500,
    requiredMajority: 70,
    sdgGoals: ["Affordable and Clean Energy", "Reduced Inequalities"],
    businessPlan: "Proven technology with 3 pilot installations",
    teamExperience: "International development + engineering",
    impactMetrics: "Power 50 communities, 10,000 people",
  },
];

interface Proposal {
  id: number;
  title: string;
  description: string;
  proposer: string;
  requestedAmount: number;
  category: string;
  status: "active" | "passed" | "rejected" | "expired";
  votesFor: number;
  votesAgainst: number;
  totalVotingPower: number;
  timeLeft: number;
  created: string;
  minimumThreshold: number;
  requiredMajority: number;
  sdgGoals: string[];
  businessPlan: string;
  teamExperience: string;
  impactMetrics: string;
}

export default function DAOGovernance() {
  const { user } = useAuth();
  const { wallet } = useWallet();
  const [proposals, setProposals] = useState<Proposal[]>(mockProposals);
  const [userVotingPower, setUserVotingPower] = useState(0);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(
    null
  );
  const [voteAmount, setVoteAmount] = useState("");
  const [showCreateProposal, setShowCreateProposal] = useState(false);

  // Mock user voting power based on wallet activity
  useEffect(() => {
    if (wallet) {
      // In real implementation, calculate based on:
      // - SPL token holdings
      // - NFT rewards owned
      // - Historical donation amounts
      // - DAO participation history
      setUserVotingPower(450); // Mock value
    }
  }, [wallet]);

  const handleVote = async (proposalId: number, support: boolean) => {
    if (!user || !wallet) {
      alert("Please connect wallet to vote");
      return;
    }

    if (!voteAmount || parseFloat(voteAmount) <= 0) {
      alert("Please enter a valid vote amount");
      return;
    }

    const voteWeight = Math.min(parseFloat(voteAmount), userVotingPower);

    // Mock vote submission - in real implementation, call Solana program
    setProposals((prev) =>
      prev.map((proposal) => {
        if (proposal.id === proposalId) {
          return {
            ...proposal,
            votesFor: support
              ? proposal.votesFor + voteWeight
              : proposal.votesFor,
            votesAgainst: !support
              ? proposal.votesAgainst + voteWeight
              : proposal.votesAgainst,
          };
        }
        return proposal;
      })
    );

    setUserVotingPower((prev) => prev - voteWeight);
    setVoteAmount("");
    alert(`Vote submitted! Used ${voteWeight} voting power.`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-blue-500";
      case "passed":
        return "bg-green-500";
      case "rejected":
        return "bg-red-500";
      case "expired":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <Clock className="h-4 w-4" />;
      case "passed":
        return <CheckCircle className="h-4 w-4" />;
      case "rejected":
        return <XCircle className="h-4 w-4" />;
      case "expired":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const calculateProgress = (proposal: Proposal) => {
    const totalVotes = proposal.votesFor + proposal.votesAgainst;
    return totalVotes > 0 ? (proposal.votesFor / totalVotes) * 100 : 0;
  };

  const isProposalPassing = (proposal: Proposal) => {
    const progress = calculateProgress(proposal);
    const hasMinimumVotes =
      proposal.votesFor + proposal.votesAgainst >= proposal.minimumThreshold;
    return progress >= proposal.requiredMajority && hasMinimumVotes;
  };

  if (showCreateProposal) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Button
          onClick={() => setShowCreateProposal(false)}
          className="mb-6"
          variant="outline"
        >
          ← Back to Proposals
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Create New Proposal</CardTitle>
            <CardDescription>
              Submit a proposal for DAO funding. Requires 100 voting power to
              submit.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
              <Target className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">Proposal Creation</h3>
              <p className="text-gray-600 mb-4">
                This feature connects to your Solana program for proposal
                submission.
              </p>
              <p className="text-sm text-gray-500">
                Integration with Anchor framework and SPL token governance
                required.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (selectedProposal) {
    const progress = calculateProgress(selectedProposal);
    const isPassing = isProposalPassing(selectedProposal);

    return (
      <div className="max-w-4xl mx-auto p-6">
        <Button
          onClick={() => setSelectedProposal(null)}
          className="mb-6"
          variant="outline"
        >
          ← Back to All Proposals
        </Button>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl mb-2">
                      {selectedProposal.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 mb-4">
                      <Badge variant="outline">
                        {selectedProposal.category}
                      </Badge>
                      <Badge
                        className={getStatusColor(selectedProposal.status)}
                      >
                        {getStatusIcon(selectedProposal.status)}
                        <span className="ml-1 capitalize">
                          {selectedProposal.status}
                        </span>
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">
                      {selectedProposal.requestedAmount.toLocaleString()} SOL
                    </p>
                    <p className="text-sm text-gray-500">Requested</p>
                  </div>
                </div>
                <CardDescription className="text-base">
                  {selectedProposal.description}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">SDG Goals</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedProposal.sdgGoals.map((goal, index) => (
                      <Badge key={index} variant="secondary">
                        {goal}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2">Business Plan</h4>
                  <p className="text-gray-600">
                    {selectedProposal.businessPlan}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Team Experience</h4>
                  <p className="text-gray-600">
                    {selectedProposal.teamExperience}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Expected Impact</h4>
                  <p className="text-gray-600">
                    {selectedProposal.impactMetrics}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Voting Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Support</span>
                    <span>{progress.toFixed(1)}%</span>
                  </div>
                  <Progress value={progress} className="h-3" />
                  <div className="flex justify-between text-sm text-gray-500 mt-1">
                    <span>{selectedProposal.votesFor} For</span>
                    <span>{selectedProposal.votesAgainst} Against</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Required Majority</p>
                    <p className="font-bold">
                      {selectedProposal.requiredMajority}%
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Time Left</p>
                    <p className="font-bold">
                      {selectedProposal.timeLeft} days
                    </p>
                  </div>
                </div>

                <div
                  className={`p-3 rounded-lg ${
                    isPassing ? "bg-green-50" : "bg-red-50"
                  }`}
                >
                  <p
                    className={`text-sm font-medium ${
                      isPassing ? "text-green-800" : "text-red-800"
                    }`}
                  >
                    {isPassing ? "✓ Currently Passing" : "✗ Not Yet Passing"}
                  </p>
                  <p
                    className={`text-xs ${
                      isPassing ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {isPassing
                      ? "Meets majority and threshold requirements"
                      : `Needs ${
                          selectedProposal.minimumThreshold -
                          (selectedProposal.votesFor +
                            selectedProposal.votesAgainst)
                        } more votes`}
                  </p>
                </div>
              </CardContent>
            </Card>

            {selectedProposal.status === "active" && user && (
              <Card>
                <CardHeader>
                  <CardTitle>Cast Your Vote</CardTitle>
                  <CardDescription>
                    Your voting power: {userVotingPower} tokens
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="voteAmount">Vote Amount</Label>
                    <Input
                      id="voteAmount"
                      type="number"
                      placeholder="Enter voting power to use"
                      value={voteAmount}
                      onChange={(e) => setVoteAmount(e.target.value)}
                      max={userVotingPower}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleVote(selectedProposal.id, true)}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      disabled={!voteAmount || parseFloat(voteAmount) <= 0}
                    >
                      Vote For
                    </Button>
                    <Button
                      onClick={() => handleVote(selectedProposal.id, false)}
                      className="flex-1 bg-red-600 hover:bg-red-700"
                      disabled={!voteAmount || parseFloat(voteAmount) <= 0}
                    >
                      Vote Against
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">DAO Governance</h1>
          <p className="text-xl text-gray-600">
            Vote on funding proposals for regenerative businesses
          </p>
        </div>

        {user && (
          <div className="text-right">
            <Button
              onClick={() => setShowCreateProposal(true)}
              className="mb-2"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Proposal
            </Button>
            <div className="text-sm text-gray-600">
              <p>
                Your Voting Power:{" "}
                <span className="font-bold">{userVotingPower}</span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      {user && (
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">3</p>
              <p className="text-sm text-gray-500">Active Proposals</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">1</p>
              <p className="text-sm text-gray-500">Passed This Month</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-purple-600">
                {userVotingPower}
              </p>
              <p className="text-sm text-gray-500">Your Voting Power</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-orange-600">5</p>
              <p className="text-sm text-gray-500">Votes Cast</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Proposals List */}
      <div className="space-y-6">
        {proposals.map((proposal) => {
          const progress = calculateProgress(proposal);
          const isPassing = isProposalPassing(proposal);

          return (
            <Card
              key={proposal.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedProposal(proposal)}
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold">{proposal.title}</h3>
                      <Badge variant="outline">{proposal.category}</Badge>
                      <Badge className={getStatusColor(proposal.status)}>
                        {getStatusIcon(proposal.status)}
                        <span className="ml-1 capitalize">
                          {proposal.status}
                        </span>
                      </Badge>
                    </div>
                    <p className="text-gray-600 mb-3 line-clamp-2">
                      {proposal.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>By {proposal.proposer}</span>
                      <span>•</span>
                      <span>Created {proposal.created}</span>
                      {proposal.status === "active" && (
                        <>
                          <span>•</span>
                          <span>{proposal.timeLeft} days left</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="text-right ml-6">
                    <p className="text-2xl font-bold mb-1">
                      {proposal.requestedAmount.toLocaleString()} SOL
                    </p>
                    <p className="text-sm text-gray-500">Requested</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Support: {progress.toFixed(1)}%</span>
                      <span
                        className={
                          isPassing
                            ? "text-green-600 font-medium"
                            : "text-red-600"
                        }
                      >
                        {isPassing ? "Passing" : "Not Passing"}
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>
                        {proposal.votesFor} For • {proposal.votesAgainst}{" "}
                        Against
                      </span>
                      <span>
                        {proposal.votesFor + proposal.votesAgainst} /{" "}
                        {proposal.minimumThreshold} minimum votes
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      {proposal.sdgGoals.slice(0, 3).map((goal, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs"
                        >
                          {goal}
                        </Badge>
                      ))}
                      {proposal.sdgGoals.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{proposal.sdgGoals.length - 3}
                        </Badge>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Discuss
                      </Button>
                      {proposal.status === "active" && user && (
                        <Button size="sm">
                          <Vote className="h-4 w-4 mr-1" />
                          Vote
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!user && (
        <div className="text-center mt-12">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-8">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">Join the DAO</h3>
              <p className="text-gray-600 mb-4">
                Connect your wallet to participate in governance and vote on
                funding proposals.
              </p>
              <p className="text-sm text-gray-500">
                Voting power is earned through donations, NFT rewards, and
                community participation.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
