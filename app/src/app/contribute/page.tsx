"use client";

import { useState } from "react";
import { ContributeWithNFT } from "@/components/ContributeWithNFT";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Leaf,
  Zap,
  GraduationCap,
  ArrowLeft,
  MapPin,
  Target,
  Users,
  Clock,
} from "lucide-react";
import Link from "next/link";

// Mock project data
const mockProject = {
  id: "solar-village-001",
  title: "Solar Village Initiative",
  description:
    "Installing solar panels and energy storage systems in remote rural communities to provide reliable, clean electricity access. This project will impact 500+ families across 3 villages.",
  category: "Clean Energy",
  targetAmount: 50,
  currentAmount: 23.5,
  milestones: [12.5, 25, 37.5, 50],
  isWhitelisted: true,
  location: "Rural Kenya",
  duration: "6 months",
  beneficiaries: 500,
  sdgGoals: ["Affordable and Clean Energy", "Sustainable Communities"],
  images: [
    "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800",
    "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=800",
  ],
  updates: [
    {
      id: 1,
      date: "2024-01-20",
      title: "Project Approved for Funding",
      description:
        "Community governance has approved this project for whitelisting.",
      milestone: 0,
    },
    {
      id: 2,
      date: "2024-01-18",
      title: "Site Survey Completed",
      description: "Technical team completed solar potential assessment.",
      milestone: 0,
    },
  ],
};

export default function ProjectContributePage() {
  const [contributionHistory, setContributionHistory] = useState<
    Array<{
      amount: number;
      nftAddress?: string;
      timestamp: string;
    }>
  >([]);

  const handleContributionSuccess = (amount: number, nftAddress?: string) => {
    setContributionHistory((prev) => [
      ...prev,
      {
        amount,
        nftAddress,
        timestamp: new Date().toISOString(),
      },
    ]);

    // Update project current amount (in real app, this would come from blockchain)
    mockProject.currentAmount += amount;
  };

  const progress = (mockProject.currentAmount / mockProject.targetAmount) * 100;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Project Contribution
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Support regenerative projects and earn NFT certificates
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Project Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Overview */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl mb-2">
                      {mockProject.title}
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {mockProject.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {mockProject.duration}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {mockProject.beneficiaries} beneficiaries
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant="default"
                    className="bg-green-100 text-green-800"
                  >
                    <Leaf className="h-3 w-3 mr-1" />
                    Whitelisted
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300 mb-6">
                  {mockProject.description}
                </p>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Progress
                    </span>
                    <span className="font-medium">{progress.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className="bg-green-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      {mockProject.currentAmount} SOL raised
                    </span>
                    <span className="font-medium">
                      {mockProject.targetAmount} SOL goal
                    </span>
                  </div>
                </div>

                {/* SDG Goals */}
                <div className="mt-6">
                  <h4 className="font-medium mb-2">
                    UN Sustainable Development Goals
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {mockProject.sdgGoals.map((goal) => (
                      <Badge key={goal} variant="outline">
                        {goal}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Project Images */}
            <Card>
              <CardHeader>
                <CardTitle>Project Gallery</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {mockProject.images.map((image, index) => (
                    <div
                      key={index}
                      className="aspect-video rounded-lg overflow-hidden"
                    >
                      <img
                        src={image}
                        alt={`Project image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Updates */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Updates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockProject.updates.map((update) => (
                    <div
                      key={update.id}
                      className="border-l-4 border-blue-500 pl-4"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-medium">{update.title}</h4>
                        <span className="text-xs text-gray-500">
                          {new Date(update.date).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {update.description}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Contribution Form */}
          <div className="space-y-6">
            <ContributeWithNFT
              project={mockProject}
              onContributionSuccess={handleContributionSuccess}
            />

            {/* Contribution History */}
            {contributionHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Contributions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {contributionHistory.map((contribution, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">
                            {contribution.amount} SOL
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(contribution.timestamp).toLocaleString()}
                          </p>
                        </div>
                        {contribution.nftAddress && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              window.open(
                                `https://explorer.solana.com/address/${contribution.nftAddress}?cluster=devnet`,
                                "_blank"
                              );
                            }}
                          >
                            View NFT
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Milestone Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Milestones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockProject.milestones.map((milestone, index) => {
                    const isReached = mockProject.currentAmount >= milestone;
                    return (
                      <div key={index} className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            isReached ? "bg-green-500" : "bg-gray-300"
                          }`}
                        />
                        <span
                          className={`text-sm ${
                            isReached
                              ? "text-green-700 dark:text-green-400 font-medium"
                              : "text-gray-600 dark:text-gray-400"
                          }`}
                        >
                          {milestone} SOL - Milestone {index + 1}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
