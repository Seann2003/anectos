"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function ProjectContributePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <Card className="max-w-xl w-full mx-4">
        <CardHeader>
          <CardTitle>Contributions are disabled</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-gray-300">
            This client is operating in DB-only mode. On-chain contribution and
            NFT minting features have been removed.
          </p>
          <p className="mt-4">You can still explore:</p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>
              <Link href="/discussions" className="underline">
                Discussions
              </Link>
            </li>
            <li>
              <Link href="/proposals" className="underline">
                Proposals
              </Link>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
