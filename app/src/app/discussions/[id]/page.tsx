"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  useDiscussions,
  type Post,
  type Comment,
} from "@/hooks/useDiscussions";
import { useWallet, useAuth } from "@crossmint/client-sdk-react-ui";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function DiscussionDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { getPost, listComments, addComment } = useDiscussions();
  const { user } = useAuth();
  const { wallet } = useWallet();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const p = await getPost(id);
        setPost(p);
        if (p) {
          const cs = await listComments(p.id);
          setComments(cs);
        }
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id, getPost, listComments]);

  const onAddComment = async () => {
    if (!user || !wallet?.address)
      return alert("Please log in and connect wallet");
    if (!post) return;
    setSaving(true);
    try {
      await addComment({
        post_id: post.id,
        body: reply,
        author_wallet: wallet.address,
      });
      const cs = await listComments(post.id);
      setComments(cs);
      setReply("");
    } catch (e) {
      console.error(e);
      alert("Failed to add comment");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!post) return <div className="p-6">Post not found.</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-semibold mb-2">{post.title}</h1>
      <div className="text-sm text-gray-500 mb-6">
        Ref: {post.reference_type} / {post.reference_id} • By{" "}
        {post.author_wallet} • {new Date(post.created_at).toLocaleString()}
      </div>
      <article className="prose max-w-none whitespace-pre-wrap bg-white/70 rounded p-4 border mb-8">
        {post.body}
      </article>

      <section>
        <h2 className="text-xl font-medium mb-3">Comments</h2>
        <div className="space-y-4 mb-6">
          {comments.length === 0 ? (
            <div className="text-sm text-gray-500">No comments yet.</div>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="border rounded p-3 bg-white/60">
                <div className="text-xs text-gray-500 mb-1">
                  {c.author_wallet} • {new Date(c.created_at).toLocaleString()}
                </div>
                <div className="whitespace-pre-wrap">{c.body}</div>
              </div>
            ))
          )}
        </div>
        <div className="space-y-2">
          <Textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Write a reply..."
          />
          <Button onClick={onAddComment} disabled={saving || !reply.trim()}>
            {saving ? "Posting..." : "Post Comment"}
          </Button>
        </div>
      </section>
    </div>
  );
}
