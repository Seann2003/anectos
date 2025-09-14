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
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  Users,
  Vote,
  TrendingUp,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Eye,
} from "lucide-react";
import { CreateProposalForm } from "@/components/governance/CreateProposalForm";
import { useGovernance } from "@/hooks/useGovernance";
import {
  checkAdminPrivileges,
  getActsTokenBalance,
  formatActsAmount,
} from "@/lib/token-utils";
import { AdminOnly } from "@/components/middleware/RoleMiddleware";
import { useUserRole } from "@/hooks/useUserRole";
import Link from "next/link";

interface Project {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  category: string;
  sdgGoals: string[];
  isWhitelisted: boolean;
  hasActiveProposal: boolean;
  proposalId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Mock data - in real app, this would come from your database
const mockProjects: Project[] = [
  {
    id: "proj-1",
    title: "Solar Energy Initiative",
    description:
      "Installing solar panels in rural communities to provide clean, renewable energy access.",
    targetAmount: 50.5,
    currentAmount: 12.3,
    category: "Energy",
    sdgGoals: ["Affordable and Clean Energy", "Climate Action"],
    isWhitelisted: true,
    hasActiveProposal: false,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-20"),
  },
  {
    id: "proj-2",
    title: "Clean Water Wells",
    description:
      "Building water wells and purification systems in underserved areas.",
    targetAmount: 75.0,
    currentAmount: 0,
    category: "Water & Sanitation",
    sdgGoals: ["Clean Water and Sanitation", "Good Health and Well-being"],
    isWhitelisted: false,
    hasActiveProposal: true,
    proposalId: "proposal-2",
    createdAt: new Date("2024-01-18"),
    updatedAt: new Date("2024-01-22"),
  },
  {
    id: "proj-3",
    title: "Digital Education Platform",
    description:
      "Creating online learning resources for remote communities worldwide.",
    targetAmount: 30.0,
    currentAmount: 0,
    category: "Education",
    sdgGoals: ["Quality Education", "Reduced Inequalities"],
    isWhitelisted: false,
    hasActiveProposal: false,
    createdAt: new Date("2024-01-20"),
    updatedAt: new Date("2024-01-20"),
  },
];

export function AdminGovernancePage() {
  const { user } = useAuth();
  const { wallet } = useWallet();
  const { proposals, userActsBalance, loading } = useGovernance();
  const { userRole, isAdmin, actsBalance } = useUserRole();

  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "projects" | "proposals"
  >("overview");

  const stats = {
    totalProjects: projects.length,
    whitelistedProjects: projects.filter((p) => p.isWhitelisted).length,
    pendingProposals: projects.filter((p) => p.hasActiveProposal).length,
    totalFunding: projects.reduce((sum, p) => sum + p.currentAmount, 0),
  };

  const handleCreateProposal = (project: Project) => {
    setSelectedProject(project);
    setShowCreateForm(true);
  };

  const handleProposalSuccess = (proposalId: string) => {
    if (selectedProject) {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === selectedProject.id
            ? { ...p, hasActiveProposal: true, proposalId }
            : p
        )
      );
    }
    setShowCreateForm(false);
    setSelectedProject(null);
  };

  if (showCreateForm) {
    return (
      <div className="container mx-auto px-4 py-8">
        <CreateProposalForm
          projectData={
            selectedProject
              ? {
                  id: selectedProject.id,
                  title: selectedProject.title,
                  description: selectedProject.description,
                  targetAmount: selectedProject.targetAmount,
                  category: selectedProject.category,
                  sdgGoals: selectedProject.sdgGoals,
                }
              : undefined
          }
          onClose={() => {
            setShowCreateForm(false);
            setSelectedProject(null);
          }}
          onSuccess={handleProposalSuccess}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">
          Manage projects and governance proposals for the Anectos platform.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 mb-6 border-b">
        {[
          { id: "overview", label: "Overview", icon: TrendingUp },
          { id: "projects", label: "Projects", icon: FileText },
          { id: "proposals", label: "Proposals", icon: Vote },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium ${
              activeTab === id
                ? "bg-blue-500 text-white"
                : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Projects</p>
                    <p className="text-2xl font-bold">{stats.totalProjects}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Whitelisted</p>
                    <p className="text-2xl font-bold">
                      {stats.whitelistedProjects}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Pending Proposals</p>
                    <p className="text-2xl font-bold">
                      {stats.pendingProposals}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Funding</p>
                    <p className="text-2xl font-bold">
                      {stats.totalFunding.toFixed(1)} SOL
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Your Balance */}
          <Card>
            <CardHeader>
              <CardTitle>Your Admin Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">ACTS Tokens</p>
                  <p className="text-xl font-bold">
                    {userActsBalance.toLocaleString()}
                  </p>
                </div>
                <Badge
                  variant={userActsBalance >= 100 ? "default" : "destructive"}
                >
                  {userActsBalance >= 100
                    ? "Can Create Proposals"
                    : "Need More ACTS"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Projects Tab */}
      {activeTab === "projects" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Project Management</h2>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create New Proposal
            </Button>
          </div>

          <div className="space-y-4">
            {projects.map((project) => (
              <Card key={project.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">
                          {project.title}
                        </h3>
                        <Badge
                          variant={
                            project.isWhitelisted ? "default" : "secondary"
                          }
                        >
                          {project.isWhitelisted
                            ? "Whitelisted"
                            : "Not Whitelisted"}
                        </Badge>
                        {project.hasActiveProposal && (
                          <Badge variant="outline">
                            <Clock className="h-3 w-3 mr-1" />
                            Proposal Pending
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-600 mb-3">
                        {project.description}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {project.sdgGoals.map((goal) => (
                          <Badge
                            key={goal}
                            variant="outline"
                            className="text-xs"
                          >
                            {goal}
                          </Badge>
                        ))}
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Target:</span>
                          <span className="font-medium ml-1">
                            {project.targetAmount} SOL
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Raised:</span>
                          <span className="font-medium ml-1">
                            {project.currentAmount} SOL
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Category:</span>
                          <span className="font-medium ml-1">
                            {project.category}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      {!project.isWhitelisted && !project.hasActiveProposal && (
                        <Button
                          size="sm"
                          onClick={() => handleCreateProposal(project)}
                        >
                          Create Proposal
                        </Button>
                      )}
                      {project.hasActiveProposal && (
                        <Link
                          href={`/governance?proposal=${project.proposalId}`}
                        >
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
                            View Proposal
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Proposals Tab */}
      {activeTab === "proposals" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Active Proposals</h2>
            <Link href="/governance">
              <Button variant="outline">
                <Vote className="h-4 w-4 mr-2" />
                View Public Governance
              </Button>
            </Link>
          </div>

          <div className="space-y-4">
            {proposals
              .filter((p) => p.status === "voting")
              .map((proposal) => (
                <Card key={proposal.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">
                          {proposal.name}
                        </h3>
                        <p className="text-gray-600 mb-3">
                          {proposal.description}
                        </p>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Yes Votes:</span>
                            <span className="font-medium ml-1">
                              {proposal.votesFor}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">No Votes:</span>
                            <span className="font-medium ml-1">
                              {proposal.votesAgainst}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Total Votes:</span>
                            <span className="font-medium ml-1">
                              {proposal.votesFor + proposal.votesAgainst}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Time Left:</span>
                            <span className="font-medium ml-1">
                              {proposal.timeLeft} days
                            </span>
                          </div>
                        </div>
                      </div>
                      <Link href={`/governance?proposal=${proposal.id}`}>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminGovernancePageWithAuth() {
  return (
    <AdminOnly fallbackPath="/" showFallback={true}>
      <AdminGovernancePage />
    </AdminOnly>
  );
}
