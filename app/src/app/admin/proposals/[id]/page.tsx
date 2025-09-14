"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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

const STORAGE_KEY = "admin.proposals.v1";
const GOV_QUEUE_KEY = "governance.approved.v1";

function loadProposals(): Proposal[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Proposal[];
  } catch {
    return [];
  }
}

function saveProposals(list: Proposal[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function pushToGovQueue(p: Proposal) {
  const raw = localStorage.getItem(GOV_QUEUE_KEY);
  let arr: Proposal[] = [];
  if (raw) {
    try {
      arr = JSON.parse(raw) as Proposal[];
    } catch {
      arr = [];
    }
  }
  arr = [p, ...arr].slice(0, 50);
  localStorage.setItem(GOV_QUEUE_KEY, JSON.stringify(arr));
}

export default function AdminProposalDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [items, setItems] = useState<Proposal[]>([]);
  const [actioning, setActioning] = useState(false);

  useEffect(() => {
    setItems(loadProposals());
  }, []);

  const item = useMemo(
    () => items.find((p) => p.id === params.id),
    [items, params.id]
  );

  function updateItemStatus(status: Proposal["status"]) {
    if (!item) return;
    const updated = items.map((p) => (p.id === item.id ? { ...p, status } : p));
    saveProposals(updated);
    setItems(updated);
  }

  async function handleApprove() {
    if (!item) return;
    setActioning(true);
    // Steps 5-8 simulated
    await new Promise((r) => setTimeout(r, 700));
    updateItemStatus("approved");
    // Step 6: set whitelisted true (implicit in approved status for this mock)
    // Step 7: push to governance page list
    pushToGovQueue({ ...item, status: "approved" });
    setActioning(false);
    toast.success("Proposal approved successfully");
    router.push("/admin/proposals");
  }

  async function handleReject() {
    if (!item) return;
    setActioning(true);
    await new Promise((r) => setTimeout(r, 500));
    updateItemStatus("rejected");
    setActioning(false);
    toast.info("Proposal rejected");
    router.push("/admin/proposals");
  }

  if (!item) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Toaster position="top-right" richColors closeButton />
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Proposal Details</h1>
          <Link href="/admin/proposals">
            <Button variant="outline">Back</Button>
          </Link>
        </div>
        <Card>
          <CardContent className="py-6">Proposal not found.</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <Toaster position="top-right" richColors closeButton />
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Proposal Details</h1>
        <Link href="/admin/proposals">
          <Button variant="outline">Back to list</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{item.title}</span>
            <span
              className={`text-xs px-2 py-1 rounded border ${
                item.status === "pending"
                  ? "bg-yellow-50 border-yellow-200 text-yellow-700"
                  : item.status === "approved"
                  ? "bg-green-50 border-green-200 text-green-700"
                  : "bg-red-50 border-red-200 text-red-700"
              }`}
            >
              {item.status.toUpperCase()}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-3">
              <div>
                <div className="text-xs text-gray-500">Description</div>
                <div className="mt-1 text-gray-800 whitespace-pre-wrap">
                  {item.description}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded border p-3">
                  <div className="text-xs text-gray-500">
                    Target Amount (USD)
                  </div>
                  <div className="mt-1 font-mono">
                    {item.target_amount.toLocaleString()}
                  </div>
                </div>
                <div className="rounded border p-3">
                  <div className="text-xs text-gray-500">Owner</div>
                  <div className="mt-1 break-all">
                    {item.owner_privy_user_id}
                  </div>
                </div>
                <div className="rounded border p-3 col-span-2">
                  <div className="text-xs text-gray-500">SDG Goals</div>
                  <div className="mt-1">{item.sdg_goals.join(", ")}</div>
                </div>
                {item.image_metadata_uri && (
                  <div className="rounded border p-3 col-span-2">
                    <div className="text-xs text-gray-500">
                      Image Metadata URI
                    </div>
                    <div className="mt-1 break-all">
                      {item.image_metadata_uri}
                    </div>
                  </div>
                )}
                <div className="rounded border p-3 col-span-2">
                  <div className="text-xs text-gray-500">Submitted</div>
                  <div className="mt-1 text-xs text-gray-700">
                    {new Date(item.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="rounded border p-3">
                <div className="font-medium mb-2">Actions</div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleApprove}
                    disabled={actioning || item.status !== "pending"}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Approve
                  </Button>
                  <Button
                    onClick={handleReject}
                    disabled={actioning || item.status !== "pending"}
                    variant="destructive"
                  >
                    Reject
                  </Button>
                </div>
                {item.status !== "pending" && (
                  <div className="mt-2 text-xs text-gray-600">
                    Action already taken.
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
