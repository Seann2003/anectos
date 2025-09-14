"use client";

import { useState } from "react";
import { useAuth } from "@crossmint/client-sdk-react-ui";
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
  Gavel,
  Coins,
} from "lucide-react";
import { useGovernance, GovernanceProposal } from "@/hooks/useGovernance";

export default function GovernancePage() {
  const { user } = useAuth();
  const {
    proposals,
    userVotingPower,
    userActsBalance,
    hasVoted,
    loading,
    createProposal,
    castVote,
    executeProposal,
    canExecuteProposal,
    getProposalStats,
  } = useGovernance();

  const [selectedProposal, setSelectedProposal] =
    useState<GovernanceProposal | null>(null);
  const [voteAmount, setVoteAmount] = useState("");
  const [showCreateProposal, setShowCreateProposal] = useState(false);

  const handleVote = async (proposalId: string, support: "yes" | "no") => {
    if (!user) {
      alert("Please connect wallet to vote");
      return;
    }

    if (!voteAmount || parseFloat(voteAmount) <= 0) {
      alert("Please enter a valid vote amount");
      return;
    }

    const voteWeight = Math.min(parseFloat(voteAmount), userVotingPower);

    try {
      await castVote(proposalId, support, voteWeight);
      setVoteAmount("");
      alert(`Vote submitted! Used ${voteWeight} voting power.`);
    } catch (error) {
      alert(
        `Error voting: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const handleExecuteProposal = async (proposalId: string) => {
    if (!user) {
      alert("Please connect wallet to execute proposal");
      return;
    }

    try {
      await executeProposal(proposalId);
      alert("Proposal executed successfully! Project has been whitelisted.");
    } catch (error) {
      alert(
        `Error executing proposal: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "voting":
        return "bg-blue-500";
      case "completed":
        return "bg-green-500";
      case "cancelled":
        return "bg-red-500";
      case "draft":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "voting":
        return <Clock className="h-4 w-4" />;
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      case "draft":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
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
            <CardTitle className="flex items-center gap-2">
              <Gavel className="h-5 w-5" />
              Create New Governance Proposal
            </CardTitle>
            <CardDescription>
              Submit a proposal for project whitelisting. Requires 100 ACTS
              tokens minimum to create.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
              <Target className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">Proposal Creation</h3>
              <p className="text-gray-600 mb-4">
                This feature will integrate with SPL Governance to create
                on-chain proposals.
              </p>
              <p className="text-sm text-gray-500">
                Each proposal requires a 60% majority vote with 1000 ACTS token
                quorum to pass.
              </p>
              <Button className="mt-4" disabled>
                Coming Soon - SPL Governance Integration
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (selectedProposal) {
    const stats = getProposalStats(selectedProposal);
    const userHasVoted = hasVoted[selectedProposal.id];

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
                      {selectedProposal.name}
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
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-gray-700 whitespace-pre-line">
                    {selectedProposal.description}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">SDG Goals</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedProposal.sdgGoals.map((goal, index) => (
                      <Badge key={index} variant="secondary">
                        {goal}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Proposer
                    </Label>
                    <p className="font-mono text-sm">
                      {selectedProposal.proposer}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Created
                    </Label>
                    <p className="text-sm">{selectedProposal.created}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Voting Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Vote className="h-5 w-5" />
                  Voting Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>
                      Approval: {stats.approvalPercentage.toFixed(1)}%
                    </span>
                    <span>Target: {selectedProposal.voteThreshold}%</span>
                  </div>
                  <Progress value={stats.approvalPercentage} className="h-2" />
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="flex items-center gap-1 text-green-600 mb-1">
                      <CheckCircle className="h-4 w-4" />
                      For
                    </div>
                    <p className="font-bold">
                      {selectedProposal.votesFor.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-red-600 mb-1">
                      <XCircle className="h-4 w-4" />
                      Against
                    </div>
                    <p className="font-bold">
                      {selectedProposal.votesAgainst.toLocaleString()}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Votes:</span>
                    <span className="font-medium">
                      {stats.totalVotes.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Quorum Required:</span>
                    <span className="font-medium">
                      {selectedProposal.quorumThreshold.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span
                      className={`font-medium ${
                        stats.quorumMet ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {stats.quorumMet ? "✓ Quorum Met" : "✗ Needs More Votes"}
                    </span>
                  </div>
                </div>

                {stats.timeRemaining > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4" />
                    <span>{stats.timeRemaining} days left</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Voting Interface */}
            {user && selectedProposal.status === "voting" && !userHasVoted && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Cast Your Vote</CardTitle>
                  <CardDescription>
                    Your voting power: {userVotingPower} ACTS
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="voteAmount">Vote Amount</Label>
                    <Input
                      id="voteAmount"
                      type="number"
                      placeholder="Enter ACTS tokens to vote with"
                      value={voteAmount}
                      onChange={(e) => setVoteAmount(e.target.value)}
                      max={userVotingPower}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => handleVote(selectedProposal.id, "yes")}
                      className="bg-green-600 hover:bg-green-700"
                      disabled={loading}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Vote Yes
                    </Button>
                    <Button
                      onClick={() => handleVote(selectedProposal.id, "no")}
                      variant="destructive"
                      disabled={loading}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Vote No
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Execute Proposal */}
            {canExecuteProposal(selectedProposal) && (
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-lg text-green-800">
                    Ready to Execute
                  </CardTitle>
                  <CardDescription className="text-green-700">
                    This proposal has passed and can be executed to whitelist
                    the project.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => handleExecuteProposal(selectedProposal.id)}
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={loading}
                  >
                    <Gavel className="h-4 w-4 mr-2" />
                    Execute Proposal
                  </Button>
                </CardContent>
              </Card>
            )}

            {userHasVoted && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-blue-800">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">
                      You have voted on this proposal
                    </span>
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
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">ANECTOS Governance</h1>
          <p className="text-gray-600">
            Participate in project whitelisting decisions using your ACTS tokens
          </p>
        </div>
        <Button
          onClick={() => setShowCreateProposal(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Proposal
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Your ACTS Balance
                </p>
                <p className="text-2xl font-bold">
                  {userActsBalance.toLocaleString()}
                </p>
              </div>
              <Coins className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Voting Power
                </p>
                <p className="text-2xl font-bold">
                  {userVotingPower.toLocaleString()}
                </p>
              </div>
              <Vote className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Active Proposals
                </p>
                <p className="text-2xl font-bold">
                  {proposals.filter((p) => p.status === "voting").length}
                </p>
              </div>
              <MessageSquare className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Passed Proposals
                </p>
                <p className="text-2xl font-bold">
                  {proposals.filter((p) => p.status === "completed").length}
                </p>
              </div>
              <Award className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Proposals List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          Project Whitelisting Proposals
        </h2>

        {proposals.map((proposal) => {
          const stats = getProposalStats(proposal);

          return (
            <Card
              key={proposal.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{proposal.name}</h3>
                      <Badge className={getStatusColor(proposal.status)}>
                        {getStatusIcon(proposal.status)}
                        <span className="ml-1 capitalize">
                          {proposal.status}
                        </span>
                      </Badge>
                    </div>

                    <p className="text-gray-600 mb-3 line-clamp-2">
                      {proposal.description.split("\n")[0]}
                    </p>

                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                      <span>By {proposal.proposer}</span>
                      <span>•</span>
                      <span>
                        {proposal.requestedAmount.toLocaleString()} SOL
                      </span>
                      <span>•</span>
                      <span>{proposal.created}</span>
                      {stats.timeRemaining > 0 && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {stats.timeRemaining} days left
                          </span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="flex-1">
                        <div className="flex justify-between text-xs mb-1">
                          <span>
                            Approval: {stats.approvalPercentage.toFixed(1)}%
                          </span>
                          <span>{stats.totalVotes.toLocaleString()} votes</span>
                        </div>
                        <Progress
                          value={stats.approvalPercentage}
                          className="h-1.5"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        {stats.canPass && (
                          <Badge
                            variant="outline"
                            className="text-green-600 border-green-600"
                          >
                            Can Pass
                          </Badge>
                        )}
                        {canExecuteProposal(proposal) && (
                          <Badge className="bg-green-600">
                            Ready to Execute
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => setSelectedProposal(proposal)}
                    variant="outline"
                    className="ml-4"
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {proposals.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">No Proposals Yet</h3>
              <p className="text-gray-600 mb-4">
                Be the first to create a governance proposal for project
                whitelisting.
              </p>
              <Button onClick={() => setShowCreateProposal(true)}>
                Create First Proposal
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
