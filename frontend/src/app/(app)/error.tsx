"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App layout error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-md space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Application Error</AlertTitle>
          <AlertDescription>
            {error.message || "An error occurred in the application. Please try again."}
          </AlertDescription>
        </Alert>

        <div className="flex flex-col gap-3">
          <Button onClick={reset} className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try again
          </Button>
          <Button variant="outline" asChild className="w-full">
            <Link href="/profile">
              <Home className="mr-2 h-4 w-4" />
              Go to profile
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
