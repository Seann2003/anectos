import {
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import {
  getProgram,
  findProjectPDA,
  findProjectVaultPDA,
  findContributionPDA,
  findFundingRoundPDA,
  findFundingRoundMetaPDA,
  findProjectMetaPDA,
  solToLamports,
  lamportsToSol,
} from "./solana";

// Custom wallet interface that matches what we need
interface WalletInterface {
  publicKey: PublicKey | null;
  signTransaction(tx: Transaction): Promise<Transaction>;
  signAllTransactions(txs: Transaction[]): Promise<Transaction[]>;
}

export interface CreateProjectParams {
  projectId: string;
  area: string;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  fundingGoal: number; // in SOL
  fundingDeadline: Date;
  fundingRoundSeed: string;
}

export interface ContributeParams {
  projectId: string;
  amount: number; // in SOL
  fundingRoundSeed: string;
}

export interface InitializeFundingRoundParams {
  seed: string;
  title: string;
  description: string;
  applicationStart: Date;
  applicationEnd: Date;
  votingStart: Date;
  votingEnd: Date;
  maxParticipants: number;
}

// Create a new project
export async function createProject(
  wallet: WalletInterface,
  params: CreateProjectParams
): Promise<string> {
  if (!wallet.publicKey) {
    throw new Error("Wallet not connected");
  }

  const program = getProgram(wallet);

  // Derive PDAs
  const [fundingRound] = findFundingRoundPDA(params.fundingRoundSeed);
  const [project] = findProjectPDA(params.projectId, fundingRound);
  const [projectVault] = findProjectVaultPDA(project);
  const [projectMeta] = findProjectMetaPDA(project);

  const tx = await program.methods
    .createProject(
      params.projectId,
      params.area,
      params.title,
      params.description,
      params.imageUrl,
      params.category,
      new BN(solToLamports(params.fundingGoal)),
      new BN(params.fundingDeadline.getTime() / 1000)
    )
    .accounts({
      owner: wallet.publicKey,
      project,
      projectVault,
      projectMeta,
      fundingRound,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  return tx;
}

// Contribute to a project
export async function contributeToProject(
  wallet: WalletInterface,
  params: ContributeParams
): Promise<string> {
  if (!wallet.publicKey) {
    throw new Error("Wallet not connected");
  }

  const program = getProgram(wallet);

  // Derive PDAs
  const [fundingRound] = findFundingRoundPDA(params.fundingRoundSeed);
  const [project] = findProjectPDA(params.projectId, fundingRound);
  const [projectVault] = findProjectVaultPDA(project);
  const [contribution] = findContributionPDA(wallet.publicKey, project);

  const tx = await program.methods
    .contribute(new BN(solToLamports(params.amount)))
    .accounts({
      fundingRound,
      project,
      projectVault,
      contribution,
      contributor: wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  return tx;
}

// Initialize a funding round
export async function initializeFundingRound(
  wallet: WalletInterface,
  params: InitializeFundingRoundParams
): Promise<string> {
  if (!wallet.publicKey) {
    throw new Error("Wallet not connected");
  }

  const program = getProgram(wallet);

  // Derive PDAs
  const [fundingRound] = findFundingRoundPDA(params.seed);
  const [fundingRoundMeta] = findFundingRoundMetaPDA(fundingRound);

  const tx = await program.methods
    .initializeFundingRound(
      params.seed,
      params.title,
      params.description,
      new BN(params.applicationStart.getTime() / 1000),
      new BN(params.applicationEnd.getTime() / 1000),
      new BN(params.votingStart.getTime() / 1000),
      new BN(params.votingEnd.getTime() / 1000),
      params.maxParticipants
    )
    .accounts({
      authority: wallet.publicKey,
      fundingRound,
      fundingRoundMeta,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  return tx;
}

// Complete a milestone
export async function completeMilestone(
  wallet: WalletInterface,
  projectId: string,
  fundingRoundSeed: string,
  milestoneIndex: number,
  currentFunding: number // in SOL
): Promise<string> {
  if (!wallet.publicKey) {
    throw new Error("Wallet not connected");
  }

  const program = getProgram(wallet);

  // Derive PDAs
  const [fundingRound] = findFundingRoundPDA(fundingRoundSeed);
  const [project] = findProjectPDA(projectId, fundingRound);

  const tx = await program.methods
    .completeMilestone(milestoneIndex, new BN(solToLamports(currentFunding)))
    .accounts({
      owner: wallet.publicKey,
      project,
    })
    .rpc();

  return tx;
}

// Close a funding round
export async function closeFundingRound(
  wallet: WalletInterface,
  fundingRoundSeed: string
): Promise<string> {
  if (!wallet.publicKey) {
    throw new Error("Wallet not connected");
  }

  const program = getProgram(wallet);

  // Derive PDAs
  const [fundingRound] = findFundingRoundPDA(fundingRoundSeed);

  const tx = await program.methods
    .closeRound()
    .accounts({
      owner: wallet.publicKey,
      fundingRound,
    })
    .rpc();

  return tx;
}

// Fetch project data
export async function fetchProject(
  wallet: WalletInterface,
  projectId: string,
  fundingRoundSeed: string
) {
  const program = getProgram(wallet);

  // Derive PDAs
  const [fundingRound] = findFundingRoundPDA(fundingRoundSeed);
  const [project] = findProjectPDA(projectId, fundingRound);
  const [projectMeta] = findProjectMetaPDA(project);

  try {
    // Fetch account data using connection directly
    const [projectAccountInfo, projectMetaAccountInfo] = await Promise.all([
      program.provider.connection.getAccountInfo(project),
      program.provider.connection.getAccountInfo(projectMeta),
    ]);

    if (!projectAccountInfo) {
      return null;
    }

    // Decode the account data using the program's coder
    const coder = program.coder.accounts;
    const projectData = coder.decode("Project", projectAccountInfo.data);
    const projectMetaData = projectMetaAccountInfo
      ? coder.decode("ProjectMeta", projectMetaAccountInfo.data)
      : null;

    return {
      address: project,
      data: projectData,
      meta: projectMetaData,
    };
  } catch (error) {
    console.error("Error fetching project:", error);
    return null;
  }
}

// Fetch funding round data
export async function fetchFundingRound(
  wallet: WalletInterface,
  fundingRoundSeed: string
) {
  const program = getProgram(wallet);

  // Derive PDAs
  const [fundingRound] = findFundingRoundPDA(fundingRoundSeed);
  const [fundingRoundMeta] = findFundingRoundMetaPDA(fundingRound);

  try {
    // Fetch account data using connection directly
    const [roundAccountInfo, roundMetaAccountInfo] = await Promise.all([
      program.provider.connection.getAccountInfo(fundingRound),
      program.provider.connection.getAccountInfo(fundingRoundMeta),
    ]);

    if (!roundAccountInfo) {
      return null;
    }

    // Decode the account data using the program's coder
    const coder = program.coder.accounts;
    const roundData = coder.decode("FundingRound", roundAccountInfo.data);
    const roundMetaData = roundMetaAccountInfo
      ? coder.decode("FundingRoundMeta", roundMetaAccountInfo.data)
      : null;

    return {
      address: fundingRound,
      data: roundData,
      meta: roundMetaData,
    };
  } catch (error) {
    console.error("Error fetching funding round:", error);
    return null;
  }
}

// Fetch user's contribution to a project
export async function fetchUserContribution(
  wallet: WalletInterface,
  projectId: string,
  fundingRoundSeed: string
) {
  if (!wallet.publicKey) {
    return null;
  }

  const program = getProgram(wallet);

  // Derive PDAs
  const [fundingRound] = findFundingRoundPDA(fundingRoundSeed);
  const [project] = findProjectPDA(projectId, fundingRound);
  const [contribution] = findContributionPDA(wallet.publicKey, project);

  try {
    // Fetch account data using connection directly
    const contributionAccountInfo =
      await program.provider.connection.getAccountInfo(contribution);

    if (!contributionAccountInfo) {
      return null;
    }

    // Decode the account data using the program's coder
    const coder = program.coder.accounts;
    const contributionData = coder.decode(
      "Contribution",
      contributionAccountInfo.data
    );

    return contributionData;
  } catch (error) {
    console.error("Error fetching contribution:", error);
    return null;
  }
}

// Get all projects for a funding round
export async function fetchAllProjects(
  wallet: WalletInterface,
  fundingRoundSeed: string
) {
  const program = getProgram(wallet);

  try {
    // Derive the funding round PDA
    const [fundingRound] = findFundingRoundPDA(fundingRoundSeed);

    // Get all program accounts using getProgramAccounts
    // Project account discriminator: [205, 168, 189, 202, 181, 247, 142, 19]
    const discriminator = Buffer.from([205, 168, 189, 202, 181, 247, 142, 19]);

    const projectAccounts =
      await program.provider.connection.getProgramAccounts(program.programId, {
        filters: [
          {
            memcmp: {
              offset: 0,
              bytes: discriminator.toString("base64"),
            },
          },
        ],
      });

    // Decode and filter projects
    const coder = program.coder.accounts;
    const projectsWithMeta = await Promise.all(
      projectAccounts
        .map((accountInfo) => {
          try {
            const projectData = coder.decode(
              "Project",
              accountInfo.account.data
            );
            return {
              publicKey: accountInfo.pubkey,
              account: projectData,
            };
          } catch (error) {
            return null;
          }
        })
        .filter(
          (project) => project && project.account.round.equals(fundingRound)
        )
        .map(async (project) => {
          if (!project) return null;

          const [projectMeta] = findProjectMetaPDA(project.publicKey);
          try {
            const metaAccountInfo =
              await program.provider.connection.getAccountInfo(projectMeta);
            const metaData = metaAccountInfo
              ? coder.decode("ProjectMeta", metaAccountInfo.data)
              : null;

            return {
              address: project.publicKey,
              data: project.account,
              meta: metaData,
            };
          } catch (error) {
            return {
              address: project.publicKey,
              data: project.account,
              meta: null,
            };
          }
        })
    );

    return projectsWithMeta.filter((project) => project !== null);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return [];
  }
}
