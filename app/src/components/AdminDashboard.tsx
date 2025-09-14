"use client";

import { useState } from "react";
import { useWallet } from "@crossmint/client-sdk-react-ui";
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
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useAnectosProgram } from "@/hooks/useAnectosProgram";

export default function AdminDashboard() {
  const { wallet } = useWallet();
  const [formData, setFormData] = useState({
    seed: "round-2024-q4",
    title: "Q4 2024 Regenerative Funding Round",
    description:
      "Supporting sustainable and regenerative projects for climate action",
    applicationStart: "",
    applicationEnd: "",
    votingStart: "",
    votingEnd: "",
    maxParticipants: 50,
  });
  const [createProjectData, setCreateProjectData] = useState({
    projectId: "",
    area: "",
    title: "",
    description: "",
    imageUrl: "",
    category: "",
    fundingGoal: "",
    fundingDeadline: "",
    fundingRoundSeed: "round-2024-q4",
  });

  const {
    loading,
    error,
    initializeFundingRound,
    createProject,
    getFundingRound,
  } = useAnectosProgram();

  const [status, setStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const handleInitializeFundingRound = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!wallet) {
      setStatus({ type: "error", message: "Please connect your wallet" });
      return;
    }

    try {
      const params = {
        ...formData,
        applicationStart: new Date(formData.applicationStart),
        applicationEnd: new Date(formData.applicationEnd),
        votingStart: new Date(formData.votingStart),
        votingEnd: new Date(formData.votingEnd),
      };

      const txSignature = await initializeFundingRound(params);

      if (txSignature) {
        setStatus({
          type: "success",
          message: `Funding round initialized! Transaction: ${txSignature}`,
        });
      }
    } catch (err) {
      setStatus({
        type: "error",
        message: `Failed to initialize funding round: ${err}`,
      });
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!wallet) {
      setStatus({ type: "error", message: "Please connect your wallet" });
      return;
    }

    try {
      const params = {
        ...createProjectData,
        fundingGoal: parseFloat(createProjectData.fundingGoal),
        fundingDeadline: new Date(createProjectData.fundingDeadline),
      };

      const txSignature = await createProject(params);

      if (txSignature) {
        setStatus({
          type: "success",
          message: `Project created! Transaction: ${txSignature}`,
        });

        // Reset form
        setCreateProjectData({
          projectId: "",
          area: "",
          title: "",
          description: "",
          imageUrl: "",
          category: "",
          fundingGoal: "",
          fundingDeadline: "",
          fundingRoundSeed: "round-2024-q4",
        });
      }
    } catch (err) {
      setStatus({
        type: "error",
        message: `Failed to create project: ${err}`,
      });
    }
  };

  const handleCheckFundingRound = async () => {
    try {
      const roundData = await getFundingRound(formData.seed);
      if (roundData) {
        setStatus({
          type: "success",
          message: `Funding round exists! Authority: ${roundData.data.authority.toString()}, Projects: ${
            roundData.data.projectCount
          }`,
        });
      } else {
        setStatus({
          type: "error",
          message: "Funding round not found",
        });
      }
    } catch (err) {
      setStatus({
        type: "error",
        message: `Error checking funding round: ${err}`,
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
        <p className="text-gray-600">
          Initialize funding rounds and create test projects
        </p>
      </div>

      {/* Status Messages */}
      {status.type && (
        <div
          className={`p-4 rounded-lg flex items-center gap-2 ${
            status.type === "success"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {status.type === "success" ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <p className="text-sm break-all">{status.message}</p>
        </div>
      )}

      {/* Wallet Status */}
      <Card>
        <CardHeader>
          <CardTitle>Wallet Status</CardTitle>
        </CardHeader>
        <CardContent>
          {wallet ? (
            <div className="text-green-600">
              Connected: {wallet.address?.slice(0, 20)}...
            </div>
          ) : (
            <div className="text-red-600">
              Not connected - Please connect your wallet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Initialize Funding Round */}
      <Card>
        <CardHeader>
          <CardTitle>Initialize Funding Round</CardTitle>
          <CardDescription>
            Create a new funding round for projects to join
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInitializeFundingRound} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="seed">Seed</Label>
                <Input
                  id="seed"
                  value={formData.seed}
                  onChange={(e) =>
                    setFormData({ ...formData, seed: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="maxParticipants">Max Participants</Label>
                <Input
                  id="maxParticipants"
                  type="number"
                  value={formData.maxParticipants}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxParticipants: parseInt(e.target.value),
                    })
                  }
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="applicationStart">Application Start</Label>
                <Input
                  id="applicationStart"
                  type="datetime-local"
                  value={formData.applicationStart}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      applicationStart: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="applicationEnd">Application End</Label>
                <Input
                  id="applicationEnd"
                  type="datetime-local"
                  value={formData.applicationEnd}
                  onChange={(e) =>
                    setFormData({ ...formData, applicationEnd: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="votingStart">Voting Start</Label>
                <Input
                  id="votingStart"
                  type="datetime-local"
                  value={formData.votingStart}
                  onChange={(e) =>
                    setFormData({ ...formData, votingStart: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="votingEnd">Voting End</Label>
                <Input
                  id="votingEnd"
                  type="datetime-local"
                  value={formData.votingEnd}
                  onChange={(e) =>
                    setFormData({ ...formData, votingEnd: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={loading || !wallet}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Initializing...
                  </>
                ) : (
                  "Initialize Funding Round"
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleCheckFundingRound}
              >
                Check Existing Round
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Create Test Project */}
      <Card>
        <CardHeader>
          <CardTitle>Create Test Project</CardTitle>
          <CardDescription>
            Add a test project to the funding round
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateProject} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="projectId">Project ID</Label>
                <Input
                  id="projectId"
                  value={createProjectData.projectId}
                  onChange={(e) =>
                    setCreateProjectData({
                      ...createProjectData,
                      projectId: e.target.value,
                    })
                  }
                  placeholder="e.g., solar-water-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="area">Area</Label>
                <Input
                  id="area"
                  value={createProjectData.area}
                  onChange={(e) =>
                    setCreateProjectData({
                      ...createProjectData,
                      area: e.target.value,
                    })
                  }
                  placeholder="e.g., Water & Energy"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="projectTitle">Project Title</Label>
              <Input
                id="projectTitle"
                value={createProjectData.title}
                onChange={(e) =>
                  setCreateProjectData({
                    ...createProjectData,
                    title: e.target.value,
                  })
                }
                placeholder="e.g., Solar Water Purification System"
                required
              />
            </div>

            <div>
              <Label htmlFor="projectDescription">Description</Label>
              <Textarea
                id="projectDescription"
                value={createProjectData.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setCreateProjectData({
                    ...createProjectData,
                    description: e.target.value,
                  })
                }
                placeholder="Describe your project..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input
                  id="imageUrl"
                  value={createProjectData.imageUrl}
                  onChange={(e) =>
                    setCreateProjectData({
                      ...createProjectData,
                      imageUrl: e.target.value,
                    })
                  }
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={createProjectData.category}
                  onChange={(e) =>
                    setCreateProjectData({
                      ...createProjectData,
                      category: e.target.value,
                    })
                  }
                  placeholder="e.g., Environment"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fundingGoal">Funding Goal (SOL)</Label>
                <Input
                  id="fundingGoal"
                  type="number"
                  step="0.001"
                  value={createProjectData.fundingGoal}
                  onChange={(e) =>
                    setCreateProjectData({
                      ...createProjectData,
                      fundingGoal: e.target.value,
                    })
                  }
                  placeholder="10.0"
                  required
                />
              </div>
              <div>
                <Label htmlFor="fundingDeadline">Funding Deadline</Label>
                <Input
                  id="fundingDeadline"
                  type="datetime-local"
                  value={createProjectData.fundingDeadline}
                  onChange={(e) =>
                    setCreateProjectData({
                      ...createProjectData,
                      fundingDeadline: e.target.value,
                    })
                  }
                  required
                />
              </div>
            </div>

            <Button type="submit" disabled={loading || !wallet}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                "Create Project"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
