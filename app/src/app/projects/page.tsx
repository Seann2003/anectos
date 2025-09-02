"use client";

import { useState, useEffect } from "react";
import {
  useAuth,
  useWallet,
  CrossmintEmbeddedCheckout,
  CrossmintCheckoutProvider,
} from "@crossmint/client-sdk-react-ui";
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
import {
  Leaf,
  Heart,
  Users,
  TrendingUp,
  Calendar,
  Target,
  Coins,
  Award,
  Vote,
  MessageCircle,
} from "lucide-react";

const mockProjects = [
  {
    id: 1,
    title: "Solar Water Purification for Rural Communities",
    description:
      "Providing clean water access through solar-powered purification systems in underserved rural areas.",
    sdgGoals: ["Clean Water and Sanitation", "Affordable and Clean Energy"],
    targetAmount: 50000,
    currentAmount: 32000,
    donorCount: 124,
    daysLeft: 15,
    founder: "GreenTech Solutions",
    category: "Water & Energy",
    image: "/Solar Water Purification for Rural Communities.png",
    quadraticMatch: 8500,
    nftReward: "Water Guardian NFT",
    verified: true,
  },
  {
    id: 2,
    title: "Regenerative Agriculture Training Program",
    description:
      "Teaching sustainable farming practices to help restore soil health and increase crop yields.",
    sdgGoals: ["Zero Hunger", "Climate Action", "Life on Land"],
    targetAmount: 25000,
    currentAmount: 18000,
    donorCount: 89,
    daysLeft: 22,
    founder: "EcoFarm Initiative",
    category: "Agriculture",
    image: "/Regenerative Agriculture Training Program.png",
    quadraticMatch: 5200,
    nftReward: "Soil Steward NFT",
    verified: true,
  },
  {
    id: 3,
    title: "Ocean Plastic Cleanup Technology",
    description:
      "Developing innovative technology to remove microplastics from ocean water.",
    sdgGoals: ["Life Below Water", "Responsible Consumption"],
    targetAmount: 75000,
    currentAmount: 12000,
    donorCount: 45,
    daysLeft: 30,
    founder: "Blue Ocean Tech",
    category: "Environment",
    image: "/Ocean Plastic Cleanup Technology.png",
    quadraticMatch: 3800,
    nftReward: "Ocean Protector NFT",
    verified: false,
  },
];

interface Project {
  id: number;
  title: string;
  description: string;
  sdgGoals: string[];
  targetAmount: number;
  currentAmount: number;
  donorCount: number;
  daysLeft: number;
  founder: string;
  category: string;
  image: string;
  quadraticMatch: number;
  nftReward: string;
  verified: boolean;
}

export default function ProjectBrowser() {
  const { user } = useAuth();
  const { wallet } = useWallet();
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [donationAmount, setDonationAmount] = useState("");
  const [showCheckout, setShowCheckout] = useState(false);
  const [filter, setFilter] = useState("all");
  const [userNFTs, setUserNFTs] = useState<any[]>([]);

  // Fetch user's NFT rewards (mock implementation)
  useEffect(() => {
    if (wallet) {
      // In real implementation, fetch NFTs from wallet
      setUserNFTs([
        {
          id: 1,
          name: "Early Supporter NFT",
          project: "Solar Water",
          rarity: "Common",
        },
        {
          id: 2,
          name: "Climate Champion NFT",
          project: "RegenAg",
          rarity: "Rare",
        },
      ]);
    }
  }, [wallet]);

  const handleDonate = (project: Project) => {
    if (!user) {
      alert("Please log in to donate");
      return;
    }
    setSelectedProject(project);
    setShowCheckout(true);
  };

  const handleQuadraticVote = (projectId: number) => {
    if (!user) {
      alert("Please log in to participate in quadratic funding");
      return;
    }
    // Implement quadratic voting logic
    console.log("Quadratic vote for project:", projectId);
  };

  const calculateQuadraticBonus = (amount: string) => {
    // Simplified quadratic funding calculation
    return Math.sqrt(parseFloat(amount) || 0) * 10;
  };

  const filteredProjects = projects.filter((project) => {
    if (filter === "all") return true;
    return project.category.toLowerCase().includes(filter.toLowerCase());
  });

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return "bg-green-500";
    if (percentage >= 50) return "bg-blue-500";
    return "bg-yellow-500";
  };

  if (showCheckout && selectedProject) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Button
          onClick={() => setShowCheckout(false)}
          className="mb-6"
          variant="outline"
        >
          ← Back to Projects
        </Button>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <img
              src={selectedProject.image}
              alt={selectedProject.title}
              className="w-full h-64 object-cover rounded-lg mb-4"
            />
            <h2 className="text-2xl font-bold mb-2">{selectedProject.title}</h2>
            <p className="text-gray-600 mb-4">{selectedProject.description}</p>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span>Progress</span>
                  <span>
                    {Math.round(
                      (selectedProject.currentAmount /
                        selectedProject.targetAmount) *
                        100
                    )}
                    %
                  </span>
                </div>
                <Progress
                  value={
                    (selectedProject.currentAmount /
                      selectedProject.targetAmount) *
                    100
                  }
                  className="h-3"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Target Amount</p>
                  <p className="font-bold">
                    {selectedProject.targetAmount.toLocaleString()} SOL
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Quadratic Match</p>
                  <p className="font-bold text-green-600">
                    +{selectedProject.quadraticMatch.toLocaleString()} SOL
                  </p>
                </div>
              </div>

              <div>
                <p className="text-gray-500 mb-2">NFT Reward</p>
                <Badge variant="secondary" className="flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  {selectedProject.nftReward}
                </Badge>
              </div>
            </div>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Support This Project</CardTitle>
                <CardDescription>
                  Your donation will be amplified through quadratic funding
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="amount">Donation Amount (SOL)</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.0"
                      value={donationAmount}
                      onChange={(e) => setDonationAmount(e.target.value)}
                      step="0.001"
                    />
                    {donationAmount && (
                      <p className="text-sm text-green-600 mt-2">
                        Quadratic bonus: +
                        {calculateQuadraticBonus(donationAmount).toFixed(3)} SOL
                      </p>
                    )}
                  </div>

                  <CrossmintCheckoutProvider>
                    <CrossmintEmbeddedCheckout
                      lineItems={{
                        // This would be your donation/funding collection ID
                        collectionLocator: `crossmint:anectos-donation-${selectedProject.id}`,
                        callData: {
                          totalPrice: donationAmount || "0.001",
                          quantity: 1,
                          projectId: selectedProject.id,
                          donorAddress: wallet?.address,
                        },
                      }}
                      payment={{
                        crypto: {
                          enabled: true,
                          defaultChain: "solana",
                          defaultCurrency: "sol",
                        },
                        fiat: {
                          enabled: true,
                          defaultCurrency: "usd",
                        },
                      }}
                      recipient={{
                        email: user?.email || "",
                      }}
                      locale="en-US"
                    />
                  </CrossmintCheckoutProvider>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Regenerative Projects</h1>
        <p className="text-xl text-gray-600 mb-6">
          Support SDG-aligned businesses through transparent, quadratic funding
        </p>

        {/* User Stats */}
        {user && (
          <div className="flex justify-center gap-6 mb-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {userNFTs.length}
              </p>
              <p className="text-sm text-gray-500">NFT Rewards</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">12</p>
              <p className="text-sm text-gray-500">Projects Supported</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">450</p>
              <p className="text-sm text-gray-500">DAO Voting Power</p>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex justify-center gap-4 mb-8">
        {["all", "water", "agriculture", "environment", "energy"].map(
          (category) => (
            <Button
              key={category}
              variant={filter === category ? "default" : "outline"}
              onClick={() => setFilter(category)}
              className="capitalize"
            >
              {category}
            </Button>
          )
        )}
      </div>

      {/* Projects Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => {
          const progressPercentage =
            (project.currentAmount / project.targetAmount) * 100;

          return (
            <Card
              key={project.id}
              className="hover:shadow-lg transition-shadow"
            >
              <div className="relative">
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
                {project.verified && (
                  <Badge className="absolute top-2 right-2 bg-green-500">
                    Verified
                  </Badge>
                )}
              </div>

              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <CardTitle className="text-lg line-clamp-2">
                    {project.title}
                  </CardTitle>
                  <Badge variant="outline">{project.category}</Badge>
                </div>
                <CardDescription className="line-clamp-3">
                  {project.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* SDG Goals */}
                <div>
                  <p className="text-sm font-medium mb-2">SDG Goals:</p>
                  <div className="flex flex-wrap gap-1">
                    {project.sdgGoals.slice(0, 2).map((goal, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-xs"
                      >
                        {goal}
                      </Badge>
                    ))}
                    {project.sdgGoals.length > 2 && (
                      <Badge variant="secondary" className="text-xs">
                        +{project.sdgGoals.length - 2}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Progress */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>
                      {project.currentAmount.toLocaleString()} SOL raised
                    </span>
                    <span>{Math.round(progressPercentage)}%</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{project.donorCount} donors</span>
                    <span>{project.daysLeft} days left</span>
                  </div>
                </div>

                {/* Quadratic Match */}
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      Quadratic Match
                    </span>
                  </div>
                  <p className="text-lg font-bold text-green-600">
                    +{project.quadraticMatch.toLocaleString()} SOL
                  </p>
                  <p className="text-xs text-green-700">
                    Your small donation has big impact!
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleDonate(project)}
                    className="flex-1"
                    disabled={!user}
                  >
                    <Heart className="h-4 w-4 mr-2" />
                    Donate
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleQuadraticVote(project.id)}
                    disabled={!user}
                  >
                    <Vote className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" disabled={!user}>
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </div>

                {!user && (
                  <p className="text-xs text-center text-gray-500">
                    Login to donate and participate in governance
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
