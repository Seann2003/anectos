"use client";

import { useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";

export type Post = {
  id: string;
  reference_type: "project" | "proposal";
  reference_id: string;
  title: string;
  body: string;
  author_wallet: string;
  created_at: string;
  updated_at: string;
};

export type Comment = {
  id: string;
  post_id: string;
  body: string;
  author_wallet: string;
  created_at: string;
  updated_at: string;
};

export function useDiscussions() {
  const listPosts = useCallback(
    async (opts?: { reference_type?: string; reference_id?: string }) => {
      let q = supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false });
      if (opts?.reference_type) q = q.eq("reference_type", opts.reference_type);
      if (opts?.reference_id) q = q.eq("reference_id", opts.reference_id);
      const { data, error } = await q;
      if (error) throw error;
      return data as Post[];
    },
    []
  );

  const getPost = useCallback(async (id: string) => {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data as Post | null;
  }, []);

  const createPost = useCallback(
    async (input: {
      reference_type: "project" | "proposal";
      reference_id: string;
      title: string;
      body: string;
      author_wallet: string;
    }) => {
      const { data, error } = await supabase
        .from("posts")
        .insert(input)
        .select("*")
        .maybeSingle();
      if (error) throw error;
      return data as Post;
    },
    []
  );

  const listComments = useCallback(async (post_id: string) => {
    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .eq("post_id", post_id)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data as Comment[];
  }, []);

  const addComment = useCallback(
    async (input: { post_id: string; body: string; author_wallet: string }) => {
      const { data, error } = await supabase
        .from("comments")
        .insert(input)
        .select("*")
        .maybeSingle();
      if (error) throw error;
      return data as Comment;
    },
    []
  );

  return { listPosts, getPost, createPost, listComments, addComment };
}
