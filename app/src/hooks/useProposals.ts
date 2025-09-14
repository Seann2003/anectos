"use client";

import { useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";

export type ProposalStatus = "pending" | "approved" | "rejected" | "finalized";

export type ProposalRow = {
  id: string;
  owner_wallet: string;
  project_id: string;
  area: string;
  title: string;
  description: string;
  image_url: string;
  category: string;
  funding_goal: number;
  funding_deadline: string; // ISO string
  funding_round_seed: string;
  status: ProposalStatus;
  reviewer_wallet: string | null;
  review_note: string | null;
  reviewed_at: string | null;
  onchain_tx: string | null;
  project_pda: string | null;
  created_at: string;
  updated_at: string;
};

export function useProposals() {
  const createProposal = useCallback(
    async (
      input: Omit<
        ProposalRow,
        | "id"
        | "status"
        | "reviewer_wallet"
        | "review_note"
        | "reviewed_at"
        | "onchain_tx"
        | "project_pda"
        | "created_at"
        | "updated_at"
      >
    ) => {
      const { data, error } = await supabase
        .from("project_proposals")
        .insert({ ...input })
        .select("*")
        .maybeSingle();
      if (error) throw error;
      return data as ProposalRow;
    },
    []
  );

  const listMyProposals = useCallback(async (owner_wallet: string) => {
    const { data, error } = await supabase
      .from("project_proposals")
      .select("*")
      .eq("owner_wallet", owner_wallet)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as ProposalRow[];
  }, []);

  const listAllProposals = useCallback(
    async (opts?: { status?: ProposalStatus }) => {
      let q = supabase
        .from("project_proposals")
        .select("*")
        .order("created_at", { ascending: false });
      if (opts?.status) q = q.eq("status", opts.status);
      const { data, error } = await q;
      if (error) throw error;
      return data as ProposalRow[];
    },
    []
  );

  const getProposal = useCallback(async (id: string) => {
    const { data, error } = await supabase
      .from("project_proposals")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data as ProposalRow | null;
  }, []);

  const approveProposal = useCallback(
    async (id: string, reviewer_wallet: string, review_note?: string) => {
      const { data, error } = await supabase
        .from("project_proposals")
        .update({
          status: "approved",
          reviewer_wallet,
          review_note: review_note || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select("*")
        .maybeSingle();
      if (error) throw error;
      return data as ProposalRow;
    },
    []
  );

  const rejectProposal = useCallback(
    async (id: string, reviewer_wallet: string, review_note?: string) => {
      const { data, error } = await supabase
        .from("project_proposals")
        .update({
          status: "rejected",
          reviewer_wallet,
          review_note: review_note || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select("*")
        .maybeSingle();
      if (error) throw error;
      return data as ProposalRow;
    },
    []
  );

  const markFinalized = useCallback(
    async (id: string, onchain_tx: string, project_pda: string) => {
      const { data, error } = await supabase
        .from("project_proposals")
        .update({ status: "finalized", onchain_tx, project_pda })
        .eq("id", id)
        .select("*")
        .maybeSingle();
      if (error) throw error;
      return data as ProposalRow;
    },
    []
  );

  return {
    createProposal,
    listMyProposals,
    listAllProposals,
    getProposal,
    approveProposal,
    rejectProposal,
    markFinalized,
  };
}
