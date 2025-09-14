"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function CreateProposalForm() {
  // DB-only placeholder: governance proposals are disabled client-side.
  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Governance Disabled
          </CardTitle>
          <CardDescription>
            Creating on-chain governance proposals is disabled in DB-only mode.
          </CardDescription>
        </CardHeader>
        <CardContent>
          Please use the Discussions area to share ideas, or the Admin →
          Proposals flow to manage off-chain project proposals.
        </CardContent>
      </Card>
    </div>
  );
}
