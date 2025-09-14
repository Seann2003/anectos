"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useDiscussions, type Post } from "@/hooks/useDiscussions";
import { Button } from "@/components/ui/button";

export default function DiscussionsListPage() {
  const { listPosts } = useDiscussions();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await listPosts();
        setPosts(data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [listPosts]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Discussions</h1>
        <Link href="/discussions/new">
          <Button>New Post</Button>
        </Link>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : posts.length === 0 ? (
        <div>No posts yet.</div>
      ) : (
        <ul className="space-y-4">
          {posts.map((p) => (
            <li key={p.id} className="border rounded p-4 bg-white/70">
              <Link
                href={`/discussions/${p.id}`}
                className="text-lg font-medium hover:underline"
              >
                {p.title}
              </Link>
              <div className="text-sm text-gray-500">
                Ref: {p.reference_type} / {p.reference_id}
              </div>
              <div className="text-sm text-gray-500">
                By: {p.author_wallet} •{" "}
                {new Date(p.created_at).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
