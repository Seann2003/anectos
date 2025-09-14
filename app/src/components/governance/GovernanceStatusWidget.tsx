"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Ban, Info } from "lucide-react";

interface GovernanceStatusProps {
  projectId: string;
  projectTitle: string;
}

export default function GovernanceStatusWidget(_props: GovernanceStatusProps) {
  // DB-only placeholder: Governance features are disabled client-side.
  return (
    <Card className="border-gray-200 bg-gray-50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Ban className="h-5 w-5 text-gray-600" />
          <CardTitle className="text-gray-800">Governance Disabled</CardTitle>
        </div>
        <CardDescription className="text-gray-700">
          Client-side governance is disabled in DB-only mode.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-700">
              No on-chain status available
            </p>
            <p className="text-sm text-gray-700 flex items-center gap-1">
              <Info className="h-4 w-4" />
              This is a static placeholder.
            </p>
          </div>
          <Badge variant="secondary">Disabled</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
