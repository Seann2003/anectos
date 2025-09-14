"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDiscussions } from "@/hooks/useDiscussions";
import { useWallet, useAuth } from "@crossmint/client-sdk-react-ui";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function NewDiscussionPage() {
  const { user } = useAuth();
  const { wallet } = useWallet();
  const router = useRouter();
  const params = useSearchParams();
  const { createPost } = useDiscussions();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [reference_type, setRefType] = useState<"project" | "proposal">(
    (params.get("type") as "project" | "proposal") || "project"
  );
  const [reference_id, setRefId] = useState(params.get("ref") || "");
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !wallet?.address)
      return alert("Please log in and connect wallet");
    setSaving(true);
    try {
      const post = await createPost({
        reference_type,
        reference_id,
        title,
        body,
        author_wallet: wallet.address,
      });
      router.replace(`/discussions/${post.id}`);
    } catch (e) {
      console.error(e);
      alert("Failed to create post");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-4">New Discussion</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Reference Type</label>
          <select
            className="w-full border rounded p-2"
            value={reference_type}
            onChange={(e) => setRefType(e.target.value as any)}
          >
            <option value="project">Project</option>
            <option value="proposal">Proposal</option>
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Reference ID</label>
          <Input
            value={reference_id}
            onChange={(e) => setRefId(e.target.value)}
            placeholder="Project pubkey or proposal id"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Title</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Body</label>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            rows={10}
          />
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? "Publishing..." : "Publish"}
        </Button>
      </form>
    </div>
  );
}
