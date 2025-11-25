"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function SessionsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Sessions page error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <Alert variant="destructive" className="max-w-md">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error loading sessions</AlertTitle>
        <AlertDescription>
          {error.message || "Failed to load sessions. Please try again."}
        </AlertDescription>
      </Alert>
      <Button onClick={reset}>
        <RefreshCw className="mr-2 h-4 w-4" />
        Try again
      </Button>
    </div>
  );
}
