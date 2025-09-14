"use client";

import { useState } from "react";
import { useAuth } from "@crossmint/client-sdk-react-ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Filter,
  X,
  ChevronDown,
  Target,
  Coins,
  Leaf,
  Heart,
  Users,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

// SDG Goals mapping for display
const sdgGoalsDisplay: { [key: string]: string } = {
  NoPoverty: "No Poverty",
  ZeroHunger: "Zero Hunger",
  GoodHealthAndWellBeing: "Good Health and Well-Being",
  QualityEducation: "Quality Education",
  GenderEquality: "Gender Equality",
  CleanWaterAndSanitation: "Clean Water and Sanitation",
  AffordableAndCleanEnergy: "Affordable and Clean Energy",
  DecentWorkAndEconomicGrowth: "Decent Work and Economic Growth",
  IndustryInnovationAndInfrastructure:
    "Industry, Innovation and Infrastructure",
  ReducedInequalities: "Reduced Inequalities",
  SustainableCitiesAndCommunities: "Sustainable Cities and Communities",
  ResponsibleConsumptionAndProduction: "Responsible Consumption and Production",
  ClimateAction: "Climate Action",
  LifeBelowWater: "Life Below Water",
  LifeOnLand: "Life on Land",
  PeaceJusticeAndStrongInstitutions: "Peace, Justice and Strong Institutions",
  PartnershipsForTheGoals: "Partnerships for the Goals",
};

// Category colors and icons
const categoryConfig: {
  [key: string]: { color: string; icon: React.ComponentType };
} = {
  "Clean Energy": { color: "bg-yellow-100 text-yellow-800", icon: Coins },
  Environment: { color: "bg-green-100 text-green-800", icon: Leaf },
  Agriculture: { color: "bg-orange-100 text-orange-800", icon: Heart },
  "Water & Energy": { color: "bg-blue-100 text-blue-800", icon: Users },
  "Urban Development": {
    color: "bg-purple-100 text-purple-800",
    icon: TrendingUp,
  },
  Default: { color: "bg-gray-100 text-gray-800", icon: Target },
};

function ProjectsPage() {
  const { user } = useAuth();
  // DB-only: placeholder values
  const projects: any[] = [];
  const projectsLoading = false;
  const error: any = null;
  const getWhitelistedProjects = () => projects;

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSdgGoals, setSelectedSdgGoals] = useState<string[]>([]);
  const [contributionAmounts, setContributionAmounts] = useState<{
    [key: string]: string;
  }>({});

  // Filter projects based on selection
  const whitelistedProjects = getWhitelistedProjects();

  // Filter projects based on selection, search, and SDG goals
  const filteredProjects = whitelistedProjects.filter((project) => {
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const titleMatch = project.title?.toLowerCase().includes(query);
      const descriptionMatch = project.description
        ?.toLowerCase()
        .includes(query);
      if (!titleMatch && !descriptionMatch) return false;
    }

    // Category filter
    if (selectedCategory !== "all") {
      // Map category based on SDG goals or title content
      if (
        selectedCategory === "energy" &&
        !project.sdgGoals?.includes("AffordableAndCleanEnergy")
      )
        return false;
      if (
        selectedCategory === "environment" &&
        !(
          project.sdgGoals?.includes("LifeBelowWater") ||
          project.sdgGoals?.includes("LifeOnLand") ||
          project.sdgGoals?.includes("ClimateAction")
        )
      )
        return false;
      if (
        selectedCategory === "agriculture" &&
        !project.sdgGoals?.includes("ZeroHunger")
      )
        return false;
    }

    // SDG Goals filter
    if (selectedSdgGoals.length > 0) {
      const hasMatchingSdg = selectedSdgGoals.some((sdg) =>
        project.sdgGoals?.includes(sdg)
      );
      if (!hasMatchingSdg) return false;
    }

    return true;
  });

  // Helper functions for filtering
  const toggleSdgGoal = (sdgGoal: string) => {
    setSelectedSdgGoals((prev) =>
      prev.includes(sdgGoal)
        ? prev.filter((goal) => goal !== sdgGoal)
        : [...prev, sdgGoal]
    );
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedSdgGoals([]);
    setSelectedCategory("all");
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  const clearSdgFilters = () => {
    setSelectedSdgGoals([]);
  };

  // Get unique SDG goals from all projects for filter options
  const availableSdgGoals = Array.from(
    new Set(whitelistedProjects.flatMap((project) => project.sdgGoals || []))
  ).sort();

  const handleContribute = async (_projectId: string, _amount: string) => {
    alert("Contributions are disabled in the DB-only client.");
  };

  const getProjectProgress = (_project: any) => 0;
  const getCompletedMilestones = (_project: any) => 0;

  if (projectsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading projects from Solana...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">
            Error loading projects: {error}
          </p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Regenerative Impact Projects
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
            Discover and support verified regenerative projects that are
            creating positive impact worldwide. Built on Solana blockchain with
            transparent fund tracking.
          </p>

          {/* Stats section removed in DB-only mode */}
        </div>

        {/* Enhanced Filtering Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search projects by name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10"
                />
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* SDG Goals Filter Dropdown */}
            <div className="lg:w-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full lg:w-auto">
                    <Filter className="h-4 w-4 mr-2" />
                    SDG Goals
                    {selectedSdgGoals.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {selectedSdgGoals.length}
                      </Badge>
                    )}
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80 max-h-80 overflow-y-auto">
                  <DropdownMenuLabel>Select SDG Goals</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {availableSdgGoals.map((sdgGoal) => (
                    <DropdownMenuItem
                      key={sdgGoal}
                      className="flex items-center space-x-2"
                      onSelect={(e) => e.preventDefault()}
                    >
                      <Checkbox
                        id={sdgGoal}
                        checked={selectedSdgGoals.includes(sdgGoal)}
                        onCheckedChange={() => toggleSdgGoal(sdgGoal)}
                      />
                      <Label
                        htmlFor={sdgGoal}
                        className="text-sm font-normal cursor-pointer flex-1"
                      >
                        {sdgGoalsDisplay[sdgGoal] || sdgGoal}
                      </Label>
                    </DropdownMenuItem>
                  ))}
                  {selectedSdgGoals.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={clearSdgFilters}>
                        <X className="h-4 w-4 mr-2" />
                        Clear SDG Filters
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Clear All Filters */}
            {(searchQuery ||
              selectedSdgGoals.length > 0 ||
              selectedCategory !== "all") && (
              <Button
                variant="ghost"
                onClick={clearAllFilters}
                className="lg:w-auto"
              >
                <X className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            )}
          </div>

          {/* Active Filters Display */}
          {(searchQuery || selectedSdgGoals.length > 0) && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Active filters:
                </span>

                {searchQuery && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    Search: "{searchQuery}"
                    <button onClick={clearSearch} className="ml-1">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}

                {selectedSdgGoals.map((sdgGoal) => (
                  <Badge
                    key={sdgGoal}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {sdgGoalsDisplay[sdgGoal] || sdgGoal}
                    <button
                      onClick={() => toggleSdgGoal(sdgGoal)}
                      className="ml-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Category Buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { id: "all", label: "All Projects", icon: Target },
            { id: "energy", label: "Clean Energy", icon: Coins },
            { id: "environment", label: "Environment", icon: Leaf },
            { id: "agriculture", label: "Agriculture", icon: Heart },
          ].map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              onClick={() => setSelectedCategory(category.id)}
              className="flex items-center gap-2"
            >
              <category.icon className="h-4 w-4" />
              {category.label}
            </Button>
          ))}
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredProjects.length} of {whitelistedProjects.length}{" "}
            projects
          </p>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="text-gray-400 mb-4">
                <Search className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No projects found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Try adjusting your search or filter criteria to find projects.
              </p>
              <Button variant="outline" onClick={clearAllFilters}>
                Clear all filters
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project: any) => {
              const progress = getProjectProgress(project);
              const completedMilestones = getCompletedMilestones(project);

              return (
                <Card
                  key={project.publicKey.toString()}
                  className="h-full flex flex-col"
                >
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <CardTitle className="text-lg line-clamp-2">
                        {project.title || "Untitled Project"}
                      </CardTitle>
                      <Badge
                        className={
                          categoryConfig[project.category]?.color ||
                          categoryConfig.Default.color
                        }
                      >
                        {project.category || "General"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {project.description || "No description available"}
                    </p>
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col">
                    <div className="space-y-4 flex-1">
                      {/* Location */}
                      {/* Location removed in DB-only mode */}

                      {/* SDG Goals */}
                      {project.sdgGoals && project.sdgGoals.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {project.sdgGoals.slice(0, 3).map((goal: string) => (
                            <Badge
                              key={goal}
                              variant="outline"
                              className="text-xs"
                            >
                              {sdgGoalsDisplay[goal] || goal}
                            </Badge>
                          ))}
                          {project.sdgGoals.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{project.sdgGoals.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Progress removed in DB-only mode */}

                      {/* Milestones removed in DB-only mode */}

                      {/* Contribution Section removed in DB-only mode */}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex gap-2">
                        <Link href={`/discussions`} className="flex-1">
                          <Button variant="outline" className="w-full">
                            Explore Discussions
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Wallet prompt removed in DB-only mode */}
      </div>
    </div>
  );
}

export default ProjectsPage;
