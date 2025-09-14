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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Building,
  DollarSign,
  Users,
  TrendingUp,
  FileText,
  Plus,
  Eye,
  Settings,
  BarChart3,
  Calendar,
  CheckCircle,
} from "lucide-react";
import { BusinessOwnerOnly } from "@/components/middleware/RoleMiddleware";
import { useUserRole } from "@/hooks/useUserRole";

interface BusinessProject {
  id: string;
  title: string;
  description: string;
  category: string;
  targetAmount: number;
  currentAmount: number;
  status: "draft" | "submitted" | "whitelisted" | "funding" | "completed";
  contributors: number;
  milestones: {
    id: number;
    title: string;
    amount: number;
    completed: boolean;
    dueDate: string;
  }[];
  createdAt: string;
  lastUpdated: string;
}

// Mock business projects data
const mockBusinessProjects: BusinessProject[] = [
  {
    id: "bp-001",
    title: "Urban Vertical Farm Initiative",
    description:
      "Building sustainable vertical farms in urban areas to provide fresh produce to local communities.",
    category: "Agriculture",
    targetAmount: 75,
    currentAmount: 42.5,
    status: "funding",
    contributors: 156,
    milestones: [
      {
        id: 1,
        title: "Site Preparation",
        amount: 18.75,
        completed: true,
        dueDate: "2024-02-15",
      },
      {
        id: 2,
        title: "Infrastructure Setup",
        amount: 37.5,
        completed: true,
        dueDate: "2024-03-30",
      },
      {
        id: 3,
        title: "Equipment Installation",
        amount: 56.25,
        completed: false,
        dueDate: "2024-05-15",
      },
      {
        id: 4,
        title: "Production Launch",
        amount: 75,
        completed: false,
        dueDate: "2024-06-30",
      },
    ],
    createdAt: "2024-01-10",
    lastUpdated: "2024-01-25",
  },
  {
    id: "bp-002",
    title: "Solar Community Grid",
    description:
      "Implementing community-owned solar microgrids for energy independence.",
    category: "Clean Energy",
    targetAmount: 120,
    currentAmount: 15,
    status: "whitelisted",
    contributors: 32,
    milestones: [
      {
        id: 1,
        title: "Community Engagement",
        amount: 30,
        completed: false,
        dueDate: "2024-03-01",
      },
      {
        id: 2,
        title: "Technical Planning",
        amount: 60,
        completed: false,
        dueDate: "2024-04-15",
      },
      {
        id: 3,
        title: "Installation Phase 1",
        amount: 90,
        completed: false,
        dueDate: "2024-06-01",
      },
      {
        id: 4,
        title: "Grid Activation",
        amount: 120,
        completed: false,
        dueDate: "2024-07-30",
      },
    ],
    createdAt: "2024-01-20",
    lastUpdated: "2024-01-22",
  },
];

function BusinessDashboardPage() {
  const { user } = useAuth();
  const { wallet } = useWallet();
  const { userRole, businessInfo, actsBalance } = useUserRole();

  const [projects, setProjects] =
    useState<BusinessProject[]>(mockBusinessProjects);
  const [activeTab, setActiveTab] = useState<
    "overview" | "projects" | "create" | "analytics"
  >("overview");
  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    category: "",
    targetAmount: "",
  });

  // Calculate business metrics
  const totalFunding = projects.reduce((sum, p) => sum + p.currentAmount, 0);
  const totalContributors = projects.reduce(
    (sum, p) => sum + p.contributors,
    0
  );
  const activeProjects = projects.filter(
    (p) => p.status === "funding" || p.status === "whitelisted"
  ).length;
  const completedProjects = projects.filter(
    (p) => p.status === "completed"
  ).length;

  const handleCreateProject = async () => {
    if (
      !newProject.title ||
      !newProject.description ||
      !newProject.targetAmount
    ) {
      alert("Please fill in all required fields");
      return;
    }

    const project: BusinessProject = {
      id: `bp-${Date.now()}`,
      title: newProject.title,
      description: newProject.description,
      category: newProject.category || "Other",
      targetAmount: parseFloat(newProject.targetAmount),
      currentAmount: 0,
      status: "draft",
      contributors: 0,
      milestones: [],
      createdAt: new Date().toISOString().split("T")[0],
      lastUpdated: new Date().toISOString().split("T")[0],
    };

    setProjects((prev) => [...prev, project]);
    setNewProject({
      title: "",
      description: "",
      category: "",
      targetAmount: "",
    });
    setActiveTab("projects");
  };

  const getStatusColor = (status: BusinessProject["status"]) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "submitted":
        return "bg-yellow-100 text-yellow-800";
      case "whitelisted":
        return "bg-blue-100 text-blue-800";
      case "funding":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Building className="h-8 w-8" />
                Business Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Manage your regenerative projects and track their progress
              </p>
            </div>
            <Badge className="bg-blue-100 text-blue-800 border-blue-200">
              <Building className="h-3 w-3 mr-1" />
              Business Owner
            </Badge>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          {[
            { id: "overview", label: "Overview", icon: BarChart3 },
            { id: "projects", label: "My Projects", icon: FileText },
            { id: "create", label: "Create Project", icon: Plus },
            { id: "analytics", label: "Analytics", icon: TrendingUp },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Funding
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalFunding} SOL</div>
                  <p className="text-xs text-muted-foreground">
                    +12% from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Contributors
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalContributors}</div>
                  <p className="text-xs text-muted-foreground">
                    +8% from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Active Projects
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{activeProjects}</div>
                  <p className="text-xs text-muted-foreground">
                    Currently funding
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Completed
                  </CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{completedProjects}</div>
                  <p className="text-xs text-muted-foreground">
                    Successfully delivered
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Projects */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Projects</CardTitle>
                <CardDescription>Your latest project updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {projects.slice(0, 3).map((project) => (
                    <div
                      key={project.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <h4 className="font-medium">{project.title}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {project.category}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>
                            {project.currentAmount}/{project.targetAmount} SOL
                          </span>
                          <span>{project.contributors} contributors</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(project.status)}>
                          {project.status.charAt(0).toUpperCase() +
                            project.status.slice(1)}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          Updated {project.lastUpdated}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Projects Tab */}
        {activeTab === "projects" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">My Projects</h2>
              <Button onClick={() => setActiveTab("create")}>
                <Plus className="h-4 w-4 mr-2" />
                Create New Project
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {projects.map((project) => (
                <Card key={project.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {project.title}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          {project.description}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(project.status)}>
                        {project.status.charAt(0).toUpperCase() +
                          project.status.slice(1)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Progress Bar */}
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Funding Progress</span>
                          <span>
                            {(
                              (project.currentAmount / project.targetAmount) *
                              100
                            ).toFixed(1)}
                            %
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{
                              width: `${Math.min(
                                (project.currentAmount / project.targetAmount) *
                                  100,
                                100
                              )}%`,
                            }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>{project.currentAmount} SOL</span>
                          <span>{project.targetAmount} SOL</span>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Contributors:</span>
                          <span className="font-medium ml-1">
                            {project.contributors}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Category:</span>
                          <span className="font-medium ml-1">
                            {project.category}
                          </span>
                        </div>
                      </div>

                      {/* Milestones */}
                      {project.milestones.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-2">
                            Milestones
                          </h4>
                          <div className="space-y-1">
                            {project.milestones.slice(0, 2).map((milestone) => (
                              <div
                                key={milestone.id}
                                className="flex items-center text-xs"
                              >
                                <CheckCircle
                                  className={`h-3 w-3 mr-2 ${
                                    milestone.completed
                                      ? "text-green-500"
                                      : "text-gray-300"
                                  }`}
                                />
                                <span
                                  className={
                                    milestone.completed
                                      ? "line-through text-gray-500"
                                      : ""
                                  }
                                >
                                  {milestone.title}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Eye className="h-3 w-3 mr-1" />
                          View Details
                        </Button>
                        <Button size="sm" variant="outline">
                          <Settings className="h-3 w-3 mr-1" />
                          Manage
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Create Project Tab */}
        {activeTab === "create" && (
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Create New Project</CardTitle>
                <CardDescription>
                  Submit your regenerative project for community review and
                  funding
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Project Title</Label>
                  <Input
                    id="title"
                    value={newProject.title}
                    onChange={(e) =>
                      setNewProject((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="Enter your project title"
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={newProject.category}
                    onChange={(e) =>
                      setNewProject((prev) => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                    placeholder="e.g., Clean Energy, Agriculture, Education"
                  />
                </div>

                <div>
                  <Label htmlFor="targetAmount">Target Funding (SOL)</Label>
                  <Input
                    id="targetAmount"
                    type="number"
                    value={newProject.targetAmount}
                    onChange={(e) =>
                      setNewProject((prev) => ({
                        ...prev,
                        targetAmount: e.target.value,
                      }))
                    }
                    placeholder="Enter funding target in SOL"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Project Description</Label>
                  <Textarea
                    id="description"
                    value={newProject.description}
                    onChange={(e) =>
                      setNewProject((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Describe your project, its goals, and expected impact"
                    rows={4}
                  />
                </div>

                <Button onClick={handleCreateProject} className="w-full">
                  Create Project
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Project Analytics</h2>
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Analytics Coming Soon
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Detailed analytics and reporting features will be available
                    soon.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BusinessDashboardPageWithAuth() {
  return (
    <BusinessOwnerOnly fallbackPath="/" showFallback={true}>
      <BusinessDashboardPage />
    </BusinessOwnerOnly>
  );
}
