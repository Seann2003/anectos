"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@crossmint/client-sdk-react-ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Clock,
  Vote,
  AlertTriangle,
  ArrowRight,
  Target,
  Users,
} from "lucide-react";
import { useGovernance } from "@/hooks/useGovernance";
import { useGovernanceIntegration } from "@/lib/governance-integration";
import { Connection, PublicKey } from "@solana/web3.js";

interface GovernanceStatusProps {
  projectId: string;
  projectTitle: string;
}

export function GovernanceStatusWidget({
  projectId,
  projectTitle,
}: GovernanceStatusProps) {
  const { user } = useAuth();
  const { proposals, userActsBalance, castVote, executeProposal } =
    useGovernance();
  const { integration, checkProjectStatus } = useGovernanceIntegration();

  const [projectStatus, setProjectStatus] = useState<{
    isWhitelisted: boolean;
    proposalId?: string;
  } | null>(null);

  const [loading, setLoading] = useState(false);

  // Find active proposal for this project
  const activeProposal = proposals.find(
    (p) =>
      p.id === projectStatus?.proposalId ||
      p.name.toLowerCase().includes(projectTitle.toLowerCase())
  );

  useEffect(() => {
    if (integration) {
      loadProjectStatus();
    }
  }, [integration, projectId]);

  const loadProjectStatus = async () => {
    if (!integration) return;

    try {
      const status = await checkProjectStatus(projectId);
      setProjectStatus(status);
    } catch (error) {
      console.error("Failed to load project status:", error);
    }
  };

  const handleVote = async (proposalId: string, vote: "Yes" | "No") => {
    if (!user) return;

    setLoading(true);
    try {
      await castVote(
        proposalId,
        vote.toLowerCase() as "yes" | "no",
        userActsBalance
      );
      await loadProjectStatus(); // Refresh status
    } catch (error) {
      console.error("Failed to cast vote:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteProposal = async (proposalId: string) => {
    setLoading(true);
    try {
      await executeProposal(proposalId);
      await loadProjectStatus(); // Refresh status
    } catch (error) {
      console.error("Failed to execute proposal:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!projectStatus) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading governance status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (projectStatus.isWhitelisted) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <CardTitle className="text-green-800">Project Approved</CardTitle>
          </div>
          <CardDescription className="text-green-700">
            This project has been whitelisted through community governance and
            is eligible for funding.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">Status: Whitelisted ✅</p>
              <p className="text-sm text-green-600">Ready for funding</p>
            </div>
            <Badge variant="default" className="bg-green-600">
              Approved
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activeProposal) {
    const approvalPercentage =
      (activeProposal.votesFor /
        (activeProposal.votesFor + activeProposal.votesAgainst)) *
      100;
    const totalVotes = activeProposal.votesFor + activeProposal.votesAgainst;
    const quorumMet = totalVotes >= 1000;
    const canExecute =
      approvalPercentage >= 60 && quorumMet && activeProposal.timeLeft <= 0;

    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Vote className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-blue-800">
              Governance Voting Active
            </CardTitle>
          </div>
          <CardDescription className="text-blue-700">
            Community is voting on whether to whitelist this project for
            funding.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Voting Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-white rounded-lg">
              <p className="text-lg font-bold text-green-600">
                {activeProposal.votesFor}
              </p>
              <p className="text-xs text-gray-500">Yes Votes</p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <p className="text-lg font-bold text-red-600">
                {activeProposal.votesAgainst}
              </p>
              <p className="text-xs text-gray-500">No Votes</p>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Approval: {approvalPercentage.toFixed(1)}%</span>
              <span
                className={
                  approvalPercentage >= 60 ? "text-green-600" : "text-gray-500"
                }
              >
                Need 60%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  approvalPercentage >= 60 ? "bg-green-500" : "bg-blue-500"
                }`}
                style={{ width: `${Math.min(approvalPercentage, 100)}%` }}
              />
            </div>
          </div>

          {/* Quorum */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>Quorum: {totalVotes} / 1,000 ACTS</span>
            </div>
            {quorumMet ? (
              <Badge variant="default" className="bg-green-600">
                Met
              </Badge>
            ) : (
              <Badge variant="outline">Pending</Badge>
            )}
          </div>

          {/* Time Left */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>Time left: {activeProposal.timeLeft} days</span>
            </div>
          </div>

          {/* Voting Actions */}
          {user && userActsBalance > 0 && activeProposal.timeLeft > 0 && (
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600 mb-3">
                Your voting power: {userActsBalance.toLocaleString()} ACTS
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleVote(activeProposal.id, "Yes")}
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  Vote Yes
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleVote(activeProposal.id, "No")}
                  disabled={loading}
                  className="flex-1"
                >
                  Vote No
                </Button>
              </div>
            </div>
          )}

          {/* Execution */}
          {canExecute && (
            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">
                  Ready for execution!
                </span>
              </div>
              <Button
                onClick={() => handleExecuteProposal(activeProposal.id)}
                disabled={loading}
                className="w-full"
              >
                Execute Proposal
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // No active proposal - project is pending governance
  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          <CardTitle className="text-yellow-800">Pending Governance</CardTitle>
        </div>
        <CardDescription className="text-yellow-700">
          This project has not yet been submitted for community governance
          approval.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-yellow-600">
              Status: Not whitelisted
            </span>
            <Badge
              variant="outline"
              className="text-yellow-700 border-yellow-300"
            >
              Pending
            </Badge>
          </div>
          <p className="text-sm text-yellow-600">
            A governance proposal must be created and approved by the community
            before this project can receive funding.
          </p>
          {user && (
            <div className="pt-3 border-t border-yellow-200">
              <p className="text-xs text-yellow-600 mb-2">
                Admins can create governance proposals for project whitelisting.
              </p>
              <Button size="sm" variant="outline">
                View Governance Process
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default GovernanceStatusWidget;
