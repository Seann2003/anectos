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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Vote,
  Clock,
  Users,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Gavel,
  Coins,
} from "lucide-react";
import { useGovernance, type GovernanceProposal } from "@/hooks/useGovernance";
import { CreateProposalForm } from "@/components/governance/CreateProposalForm";

export default function GovernancePage() {
  const { user } = useAuth();
  const {
    proposals,
    userVotingPower,
    userActsBalance,
    hasVoted,
    loading,
    castVote,
    executeProposal,
    canExecuteProposal,
    getProposalStats,
  } = useGovernance();

  const [selectedProposal, setSelectedProposal] = useState<string | null>(null);
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
        return "bg-gray-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "voting":
        return <Vote className="h-4 w-4" />;
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      case "draft":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">DAO Governance</CardTitle>
              <CardDescription>
                Please connect your wallet to participate in governance
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 dark:text-gray-400">
                Connect your wallet to view and participate in governance
                proposals
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (showCreateProposal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-4xl mx-auto">
          <CreateProposalForm
            onClose={() => setShowCreateProposal(false)}
            onSuccess={(proposalId) => {
              setShowCreateProposal(false);
              alert(`Proposal ${proposalId} created successfully!`);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl flex items-center justify-center gap-2">
              <Gavel className="h-8 w-8" />
              Anectos DAO Governance
            </CardTitle>
            <CardDescription>
              Participate in project funding decisions with your ACTS tokens
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Coins className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <h3 className="font-semibold">Your ACTS Balance</h3>
                <p className="text-2xl font-bold text-blue-600">
                  {userActsBalance.toLocaleString()}
                </p>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <h3 className="font-semibold">Voting Power</h3>
                <p className="text-2xl font-bold text-green-600">
                  {userVotingPower.toLocaleString()}
                </p>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <Users className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <h3 className="font-semibold">Active Proposals</h3>
                <p className="text-2xl font-bold text-purple-600">
                  {
                    proposals.filter(
                      (p: GovernanceProposal) => p.status === "voting"
                    ).length
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Governance Proposals</h2>
          <Button
            onClick={() => setShowCreateProposal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Proposal
          </Button>
        </div>

        {/* Proposals */}
        <div className="grid gap-6">
          {proposals.map((proposal: GovernanceProposal) => {
            const stats = getProposalStats(proposal);
            const userHasVoted = hasVoted[proposal.id];
            const canExecute = canExecuteProposal(proposal);

            return (
              <Card key={proposal.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          className={`${getStatusColor(
                            proposal.status
                          )} text-white`}
                        >
                          {getStatusIcon(proposal.status)}
                          <span className="ml-1 capitalize">
                            {proposal.status}
                          </span>
                        </Badge>
                        <Badge variant="outline">{proposal.category}</Badge>
                      </div>
                      <CardTitle className="text-xl">{proposal.name}</CardTitle>
                      <CardDescription className="mt-2">
                        {proposal.description}
                      </CardDescription>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      {proposal.timeLeft > 0 ? (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {proposal.timeLeft} days left
                        </div>
                      ) : (
                        "Voting ended"
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Voting Results */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Approval Progress</span>
                      <span>
                        {(
                          (proposal.votesFor /
                            (proposal.votesFor + proposal.votesAgainst)) *
                          100
                        ).toFixed(1)}
                        % (Threshold: {proposal.voteThreshold}%)
                      </span>
                    </div>
                    <Progress
                      value={
                        (proposal.votesFor /
                          (proposal.votesFor + proposal.votesAgainst)) *
                        100
                      }
                      className="h-2"
                    />
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>For: {proposal.votesFor.toLocaleString()}</span>
                      <span>
                        Against: {proposal.votesAgainst.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Project Details */}
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Requested Amount:</span>
                        <p className="text-green-600 font-semibold">
                          ${proposal.requestedAmount.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium">SDG Goals:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {proposal.sdgGoals.map((goal: string) => (
                            <Badge
                              key={goal}
                              variant="secondary"
                              className="text-xs"
                            >
                              {goal}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Voting Actions */}
                  {proposal.status === "voting" && !userHasVoted && (
                    <div className="space-y-3 border-t pt-4">
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          placeholder="Vote amount (ACTS)"
                          value={voteAmount}
                          onChange={(e) => setVoteAmount(e.target.value)}
                          max={userVotingPower}
                          className="flex-1"
                        />
                        <span className="text-sm text-gray-500">
                          Max: {userVotingPower.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleVote(proposal.id, "yes")}
                          disabled={loading}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Vote Yes
                        </Button>
                        <Button
                          onClick={() => handleVote(proposal.id, "no")}
                          disabled={loading}
                          variant="destructive"
                          className="flex-1"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Vote No
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Execute Proposal */}
                  {canExecute && (
                    <div className="border-t pt-4">
                      <Button
                        onClick={() => handleExecuteProposal(proposal.id)}
                        disabled={loading}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                      >
                        Execute Proposal
                      </Button>
                    </div>
                  )}

                  {/* Already Voted */}
                  {userHasVoted && (
                    <div className="text-center text-green-600 font-medium border-t pt-4">
                      ✓ You have already voted on this proposal
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {proposals.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Vote className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">No proposals yet</h3>
              <p className="text-gray-600 mb-4">
                Be the first to create a governance proposal for project funding
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
