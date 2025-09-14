import { useState, useCallback, useRef, useMemo } from "react";
import { useWallet } from "@crossmint/client-sdk-react-ui";
import { PublicKey, Transaction, Keypair } from "@solana/web3.js";
import {
  createProject,
  contributeToProject,
  initializeFundingRound,
  completeMilestone,
  closeFundingRound,
  fetchProject,
  fetchFundingRound,
  fetchUserContribution,
  fetchAllProjects,
  CreateProjectParams,
  ContributeParams,
  InitializeFundingRoundParams,
} from "../lib/program-interactions";

// Performance cache
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
const CACHE_TTL = 30000; // 30 seconds

function getFromCache<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data as T;
  }
  cache.delete(key);
  return null;
}

function setCache<T>(key: string, data: T, ttl: number = CACHE_TTL): void {
  cache.set(key, { data, timestamp: Date.now(), ttl });
}

// Create a proper wallet interface that matches Anchor's expectations
interface WalletInterface {
  publicKey: PublicKey | null;
  signTransaction(tx: Transaction): Promise<Transaction>;
  signAllTransactions(txs: Transaction[]): Promise<Transaction[]>;
}

// Custom wallet adapter for Crossmint
class CrossmintWalletAdapter implements WalletInterface {
  constructor(private crossmintWallet: any) {}

  get publicKey(): PublicKey | null {
    return this.crossmintWallet?.address
      ? new PublicKey(this.crossmintWallet.address)
      : null;
  }

  async signTransaction(tx: Transaction): Promise<Transaction> {
    return await this.crossmintWallet.signTransaction(tx);
  }

  async signAllTransactions(txs: Transaction[]): Promise<Transaction[]> {
    return await this.crossmintWallet.signAllTransactions(txs);
  }
}

interface UseAnectosProgramReturn {
  // State
  loading: boolean;
  error: string | null;

  // Actions
  createProject: (params: CreateProjectParams) => Promise<string | null>;
  contribute: (params: ContributeParams) => Promise<string | null>;
  initializeFundingRound: (
    params: InitializeFundingRoundParams
  ) => Promise<string | null>;
  completeMilestone: (
    projectId: string,
    fundingRoundSeed: string,
    milestoneIndex: number,
    currentFunding: number
  ) => Promise<string | null>;
  closeRound: (fundingRoundSeed: string) => Promise<string | null>;

  // Queries
  getProject: (
    projectId: string,
    fundingRoundSeed: string
  ) => Promise<any | null>;
  getFundingRound: (fundingRoundSeed: string) => Promise<any | null>;
  getUserContribution: (
    projectId: string,
    fundingRoundSeed: string
  ) => Promise<any | null>;
  getAllProjects: (fundingRoundSeed: string) => Promise<any[] | null>;
}

export function useAnectosProgram(): UseAnectosProgramReturn {
  const { wallet } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use refs to maintain stable references
  const loadingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Memoize wallet adapter to prevent recreations
  const walletAdapter = useMemo(() => {
    return wallet ? new CrossmintWalletAdapter(wallet) : null;
  }, [wallet]);

  const handleAsync = useCallback(
    async <T>(
      asyncFn: () => Promise<T>,
      errorMessage = "An error occurred",
      cacheKey?: string
    ): Promise<T | null> => {
      // Check cache first
      if (cacheKey) {
        const cached = getFromCache<T>(cacheKey);
        if (cached) {
          return cached;
        }
      }

      if (!walletAdapter) {
        setError("Wallet not connected");
        return null;
      }

      // Prevent multiple simultaneous calls
      if (loadingRef.current) {
        return null;
      }

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      loadingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const result = await asyncFn();

        // Cache successful results
        if (cacheKey && result) {
          setCache(cacheKey, result);
        }

        return result;
      } catch (err) {
        // Don't show error if request was aborted
        if (err instanceof Error && err.name === "AbortError") {
          return null;
        }

        console.error(errorMessage, err);
        setError(err instanceof Error ? err.message : errorMessage);
        return null;
      } finally {
        loadingRef.current = false;
        setLoading(false);
        abortControllerRef.current = null;
      }
    },
    [walletAdapter]
  );

  const createProjectAction = useCallback(
    (params: CreateProjectParams) => {
      return handleAsync(
        () => createProject(walletAdapter!, params),
        "Failed to create project"
      );
    },
    [handleAsync, walletAdapter]
  );

  const contributeAction = useCallback(
    (params: ContributeParams) => {
      return handleAsync(
        () => contributeToProject(walletAdapter!, params),
        "Failed to contribute to project"
      );
    },
    [handleAsync, walletAdapter]
  );

  const initializeFundingRoundAction = useCallback(
    (params: InitializeFundingRoundParams) => {
      return handleAsync(
        () => initializeFundingRound(walletAdapter!, params),
        "Failed to initialize funding round"
      );
    },
    [handleAsync, walletAdapter]
  );

  const completeMilestoneAction = useCallback(
    (
      projectId: string,
      fundingRoundSeed: string,
      milestoneIndex: number,
      currentFunding: number
    ) => {
      return handleAsync(
        () =>
          completeMilestone(
            walletAdapter!,
            projectId,
            fundingRoundSeed,
            milestoneIndex,
            currentFunding
          ),
        "Failed to complete milestone"
      );
    },
    [handleAsync, walletAdapter]
  );

  const closeRoundAction = useCallback(
    (fundingRoundSeed: string) => {
      return handleAsync(
        () => closeFundingRound(walletAdapter!, fundingRoundSeed),
        "Failed to close funding round"
      );
    },
    [handleAsync, walletAdapter]
  );

  const getProject = useCallback(
    (projectId: string, fundingRoundSeed: string) => {
      const cacheKey = `project:${projectId}:${fundingRoundSeed}`;
      return handleAsync(
        () => fetchProject(walletAdapter!, projectId, fundingRoundSeed),
        "Failed to fetch project",
        cacheKey
      );
    },
    [handleAsync, walletAdapter]
  );

  const getFundingRound = useCallback(
    (fundingRoundSeed: string) => {
      const cacheKey = `funding-round:${fundingRoundSeed}`;
      return handleAsync(
        () => fetchFundingRound(walletAdapter!, fundingRoundSeed),
        "Failed to fetch funding round",
        cacheKey
      );
    },
    [handleAsync, walletAdapter]
  );

  const getUserContribution = useCallback(
    (projectId: string, fundingRoundSeed: string) => {
      const cacheKey = `contribution:${projectId}:${fundingRoundSeed}:${walletAdapter?.publicKey?.toString()}`;
      return handleAsync(
        () =>
          fetchUserContribution(walletAdapter!, projectId, fundingRoundSeed),
        "Failed to fetch user contribution",
        cacheKey
      );
    },
    [handleAsync, walletAdapter]
  );

  const getAllProjects = useCallback(
    (fundingRoundSeed: string) => {
      const cacheKey = `all-projects:${fundingRoundSeed}`;
      return handleAsync(
        () => fetchAllProjects(walletAdapter!, fundingRoundSeed),
        "Failed to fetch projects",
        cacheKey
      );
    },
    [handleAsync, walletAdapter]
  );

  return {
    loading,
    error,
    createProject: createProjectAction,
    contribute: contributeAction,
    initializeFundingRound: initializeFundingRoundAction,
    completeMilestone: completeMilestoneAction,
    closeRound: closeRoundAction,
    getProject,
    getFundingRound,
    getUserContribution,
    getAllProjects,
  };
}
