"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase, type ProfileRow } from "@/lib/supabaseClient";

export function useProfile(walletAddress?: string | null) {
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!walletAddress) {
        setProfile(null);
        return;
      }
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("wallet_address", walletAddress)
        .maybeSingle();
      if (!active) return;
      if (error) setError(error.message);
      setProfile(data ?? null);
      setLoading(false);
    }
    load();
    return () => {
      active = false;
    };
  }, [walletAddress]);

  const fetchProfile = useCallback(async () => {
    if (!walletAddress) {
      setProfile(null);
      return { data: null, exists: false, error: null as any };
    }
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("wallet_address", walletAddress)
      .maybeSingle();

    if (error) {
      setError(error.message);
      setProfile(null);
      setLoading(false);
      return { data: null, exists: false, error };
    }

    setProfile((data as ProfileRow) ?? null);
    setLoading(false);
    return { data: data as ProfileRow | null, exists: !!data, error: null };
  }, [walletAddress]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const ensureProfileExists = useCallback(async () => {
    const { data, exists, error } = await fetchProfile();
    return {
      exists,
      profile: data,
      error: error?.message as string | undefined,
    };
  }, [fetchProfile]);

  const upsertProfile = async (input: { name: string; email: string }) => {
    if (!walletAddress) throw new Error("No wallet connected");
    const { data, error } = await supabase
      .from("profiles")
      .upsert({
        wallet_address: walletAddress,
        name: input.name,
        email: input.email,
      })
      .select("*")
      .maybeSingle();
    if (error) throw error;
    setProfile(data as ProfileRow);
    return data as ProfileRow;
  };

  return { profile, loading, error, ensureProfileExists, upsertProfile };
}
