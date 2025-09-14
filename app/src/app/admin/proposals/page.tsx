"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Proposal = {
  id: string;
  owner_privy_user_id: string;
  title: string;
  description: string;
  target_amount: number;
  sdg_goals: number[];
  image_metadata_uri?: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: number; // unix ms
};

// Seed a few fake proposals based on the create/proposal fields
const SEED: Proposal[] = [
  {
    id: "p1",
    owner_privy_user_id: "user_abc",
    title: "Solar Water Purification for Rural Communities",
    description: "Deploy solar purification units for 10 villages.",
    target_amount: 50000,
    sdg_goals: [6, 7, 13],
    image_metadata_uri: null,
    status: "pending",
    created_at: Date.now() - 1000 * 60 * 60 * 6,
  },
  {
    id: "p2",
    owner_privy_user_id: "user_xyz",
    title: "Regenerative Agriculture Training Program",
    description: "Train 100 farmers on regenerative practices.",
    target_amount: 30000,
    sdg_goals: [2, 12, 15],
    image_metadata_uri: null,
    status: "pending",
    created_at: Date.now() - 1000 * 60 * 60 * 24,
  },
  {
    id: "p3",
    owner_privy_user_id: "user_mno",
    title: "Ocean Plastic Cleanup Technology",
    description: "Pilot coastal cleanup with AI sorting.",
    target_amount: 75000,
    sdg_goals: [14, 9, 13],
    image_metadata_uri: null,
    status: "pending",
    created_at: Date.now() - 1000 * 60 * 60 * 2,
  },
];

const STORAGE_KEY = "admin.proposals.v1";

function loadProposals(): Proposal[] {
  if (typeof window === "undefined") return SEED;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return SEED;
  try {
    const parsed = JSON.parse(raw) as Proposal[];
    return parsed.length ? parsed : SEED;
  } catch {
    return SEED;
  }
}

export default function AdminProposalsPage() {
  const [items, setItems] = useState<Proposal[]>([]);

  useEffect(() => {
    setItems(loadProposals());
  }, []);

  const pending = useMemo(
    () => items.filter((p) => p.status === "pending"),
    [items]
  );

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <Toaster position="top-right" richColors closeButton />
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Pending Proposals</h1>
        <Link href="/admin">
          <Button variant="outline">Back to Admin</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Awaiting Review</CardTitle>
        </CardHeader>
        <CardContent>
          {pending.length === 0 ? (
            <div className="text-gray-600">No pending proposals.</div>
          ) : (
            <div className="overflow-auto">
              <table className="min-w-full border divide-y">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
                      Title
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
                      Owner
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
                      Target (USD)
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
                      SDGs
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
                      Submitted
                    </th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {pending.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-sm font-medium">
                        {p.title}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-700">
                        {p.owner_privy_user_id}
                      </td>
                      <td className="px-3 py-2 text-sm font-mono">
                        {p.target_amount.toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-sm">
                        {p.sdg_goals.join(", ")}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-600">
                        {new Date(p.created_at).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Link
                          className="inline-block"
                          href={`/admin/proposals/${p.id}`}
                        >
                          <Button size="sm">Review</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
