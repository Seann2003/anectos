export type Project = {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  sdgs: number[]; // 1..17
  fundingRaised: number; // USD
  fundingGoal: number; // USD
  milestones: number[]; // thresholds in USD
};



export const PROJECTS: Project[] = [
  {
    id: "p1",
    title: "Ocean Plastic Cleanup Technology",
    description:
      "Deploy modular river barriers and AI sorting to intercept plastic before it reaches the ocean, and recycle collected waste into construction materials.",
    imageUrl: "/Ocean Plastic Cleanup Technology.png",
    sdgs: [12, 14, 13],
    fundingRaised: 420_000,
    fundingGoal: 1_000_000,
    milestones: [250_000, 500_000, 800_000],
  },
  {
    id: "p2",
    title: "Regenerative Agriculture Training Program",
    description:
      "Train smallholder farmers in soil regeneration, agroforestry, and water management to boost yields and restore ecosystems.",
    sdgs: [2, 12, 15],
    fundingRaised: 180_000,
    fundingGoal: 300_000,
    milestones: [100_000, 200_000, 270_000],
  },
  {
    id: "p3",
    title: "Solar Water Purification for Rural Communities",
    description:
      "Install standalone solar-powered purification units to provide safe drinking water to remote villages with minimal maintenance.",
    sdgs: [6, 7, 3],
    fundingRaised: 75_000,
    fundingGoal: 200_000,
    milestones: [50_000, 120_000, 180_000],
  },
  {
    id: "p4",
    title: "Mangrove Reforestation Initiative",
    description:
      "Restore degraded coastlines with native mangrove species to enhance biodiversity, protect communities, and sequester carbon.",
    sdgs: [13, 14, 15],
    fundingRaised: 520_000,
    fundingGoal: 750_000,
    milestones: [200_000, 450_000, 700_000],
  },
  {
    id: "p5",
    title: "Green Schools Energy Efficiency Upgrades",
    description:
      "Retrofit schools with LED lighting, insulation, and smart controls to cut energy use and reinvest savings into education.",
    sdgs: [7, 11, 13],
    fundingRaised: 95_000,
    fundingGoal: 150_000,
    milestones: [50_000, 120_000, 150_000],
  },
  {
    id: "p6",
    title: "Community Composting and Food Rescue",
    description:
      "Create local compost hubs and redistribute surplus food to reduce landfill waste and support vulnerable households.",
    sdgs: [2, 11, 12],
    fundingRaised: 12_000,
    fundingGoal: 50_000,
    milestones: [10_000, 30_000, 45_000],
  },
];

export function getProjectById(id: string): Project | undefined {
  return PROJECTS.find((p) => p.id === id);
}

export function formatUSD(n: number): string {
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}
