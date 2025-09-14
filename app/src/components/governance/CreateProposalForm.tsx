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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Checkbox } from "@/components/ui/checkbox";
import {
  Gavel,
  Plus,
  FileText,
  DollarSign,
  Tag,
  Target,
  CheckCircle,
} from "lucide-react";
import { useGovernance } from "@/hooks/useGovernance";

interface CreateProposalFormProps {
  projectData?: {
    id: string;
    title: string;
    description: string;
    targetAmount: number;
    category: string;
    sdgGoals: string[];
  };
  onClose?: () => void;
  onSuccess?: (proposalId: string) => void;
}

const SDG_GOALS = [
  "No Poverty",
  "Zero Hunger",
  "Good Health and Well-being",
  "Quality Education",
  "Gender Equality",
  "Clean Water and Sanitation",
  "Affordable and Clean Energy",
  "Decent Work and Economic Growth",
  "Industry, Innovation and Infrastructure",
  "Reduced Inequalities",
  "Sustainable Cities and Communities",
  "Responsible Consumption and Production",
  "Climate Action",
  "Life Below Water",
  "Life on Land",
  "Peace, Justice and Strong Institutions",
  "Partnerships for the Goals",
];

const PROJECT_CATEGORIES = [
  "Environmental",
  "Energy",
  "Education",
  "Healthcare",
  "Technology",
  "Agriculture",
  "Infrastructure",
  "Social Impact",
  "Climate",
  "Water & Sanitation",
];

export function CreateProposalForm({
  projectData,
  onClose,
  onSuccess,
}: CreateProposalFormProps) {
  const { user } = useAuth();
  const { createProposal, loading, userActsBalance } = useGovernance();

  const [formData, setFormData] = useState({
    title: projectData?.title || "",
    description: projectData?.description || "",
    targetAmount: projectData?.targetAmount || 0,
    category: projectData?.category || "",
    sdgGoals: projectData?.sdgGoals || [],
    projectId: projectData?.id || "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleSdgToggle = (goal: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      sdgGoals: checked
        ? [...prev.sdgGoals, goal]
        : prev.sdgGoals.filter((g) => g !== goal),
    }));
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.title.trim()) {
      newErrors.title = "Project title is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Project description is required";
    }

    if (formData.targetAmount <= 0) {
      newErrors.targetAmount = "Target amount must be greater than 0";
    }

    if (!formData.category) {
      newErrors.category = "Project category is required";
    }

    if (formData.sdgGoals.length === 0) {
      newErrors.sdgGoals = "At least one SDG goal must be selected";
    }

    if (userActsBalance < 100) {
      newErrors.general =
        "You need at least 100 ACTS tokens to create a proposal";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const proposalId = await createProposal({
        id: formData.projectId || `project-${Date.now()}`,
        title: formData.title,
        description: formData.description,
        targetAmount: formData.targetAmount,
        sdgGoals: formData.sdgGoals,
        category: formData.category,
      });

      onSuccess?.(proposalId);

      // Reset form if not pre-filled
      if (!projectData) {
        setFormData({
          title: "",
          description: "",
          targetAmount: 0,
          category: "",
          sdgGoals: [],
          projectId: "",
        });
      }
    } catch (error) {
      setErrors({
        general:
          error instanceof Error ? error.message : "Failed to create proposal",
      });
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Gavel className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium mb-2">Connect Wallet Required</h3>
          <p className="text-gray-600">
            You need to connect your wallet to create governance proposals.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Gavel className="h-5 w-5" />
                Create Governance Proposal
              </CardTitle>
              <CardDescription>
                Submit a proposal to whitelist a project for funding. Requires
                100 ACTS tokens minimum.
              </CardDescription>
            </div>
            {onClose && (
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {/* User Stats */}
          <div className="grid md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <p className="text-sm text-gray-500">Your ACTS Balance</p>
              <p className="text-xl font-bold">
                {userActsBalance.toLocaleString()}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Required to Create</p>
              <p className="text-xl font-bold">100</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Status</p>
              <div className="flex items-center justify-center gap-1">
                {userActsBalance >= 100 ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-green-600 font-medium">Eligible</span>
                  </>
                ) : (
                  <>
                    <span className="text-red-600 font-medium">
                      Need More ACTS
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Project Title */}
            <div>
              <Label htmlFor="title" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Project Title
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Enter the project title"
                className={errors.title ? "border-red-500" : ""}
                disabled={!!projectData}
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title}</p>
              )}
            </div>

            {/* Project Description */}
            <div>
              <Label htmlFor="description">Project Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Provide a detailed description of the project and its impact"
                rows={4}
                className={errors.description ? "border-red-500" : ""}
                disabled={!!projectData}
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.description}
                </p>
              )}
            </div>

            {/* Target Amount and Category */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label
                  htmlFor="targetAmount"
                  className="flex items-center gap-2"
                >
                  <DollarSign className="h-4 w-4" />
                  Funding Target (SOL)
                </Label>
                <Input
                  id="targetAmount"
                  type="number"
                  value={formData.targetAmount}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      targetAmount: parseFloat(e.target.value) || 0,
                    }))
                  }
                  placeholder="0"
                  min="0"
                  step="0.01"
                  className={errors.targetAmount ? "border-red-500" : ""}
                  disabled={!!projectData}
                />
                {errors.targetAmount && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.targetAmount}
                  </p>
                )}
              </div>

              <div>
                <Label className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Category
                </Label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                  disabled={!!projectData}
                  className={`w-full p-2 border rounded-md ${
                    errors.category ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <option value="">Select project category</option>
                  {PROJECT_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="text-red-500 text-sm mt-1">{errors.category}</p>
                )}
              </div>
            </div>

            {/* SDG Goals */}
            <div>
              <Label className="flex items-center gap-2 mb-3">
                <Target className="h-4 w-4" />
                Sustainable Development Goals (SDGs)
              </Label>
              <div className="grid md:grid-cols-3 gap-2 p-4 border rounded-lg max-h-48 overflow-y-auto">
                {SDG_GOALS.map((goal) => (
                  <div key={goal} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={goal}
                      checked={formData.sdgGoals.includes(goal)}
                      onChange={(e) => handleSdgToggle(goal, e.target.checked)}
                      disabled={!!projectData}
                      className="rounded"
                    />
                    <Label htmlFor={goal} className="text-sm">
                      {goal}
                    </Label>
                  </div>
                ))}
              </div>
              {errors.sdgGoals && (
                <p className="text-red-500 text-sm mt-1">{errors.sdgGoals}</p>
              )}
            </div>

            {/* Selected SDGs Preview */}
            {formData.sdgGoals.length > 0 && (
              <div>
                <Label className="text-sm text-gray-500">Selected SDGs:</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.sdgGoals.map((goal) => (
                    <Badge key={goal} variant="secondary">
                      {goal}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Governance Info */}
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">
                Governance Requirements
              </h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Voting period: 3 days</li>
                <li>• Required majority: 60% approval</li>
                <li>• Minimum quorum: 1,000 ACTS tokens</li>
                <li>• Cost to create: 100 ACTS tokens</li>
                <li>
                  • Upon approval, project will be automatically whitelisted
                </li>
              </ul>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <Button
                type="submit"
                className="flex items-center gap-2"
                disabled={loading || userActsBalance < 100}
              >
                <Plus className="h-4 w-4" />
                {loading ? "Creating Proposal..." : "Create Proposal"}
              </Button>

              {onClose && (
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default CreateProposalForm;
