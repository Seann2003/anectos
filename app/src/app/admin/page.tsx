"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminPage() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <h1 className="text-3xl font-bold">Admin</h1>
      <Card>
        <CardHeader>
          <CardTitle>Administrative Tools</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            On-chain admin tools have been removed. Use database-backed tools
            below.
          </p>
          <div className="flex gap-3">
            <Link href="/admin/proposals">
              <Button variant="default">Review Proposals</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
