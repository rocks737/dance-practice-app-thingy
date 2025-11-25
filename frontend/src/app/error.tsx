"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-md space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Something went wrong!</AlertTitle>
          <AlertDescription>
            {error.message || "An unexpected error occurred. Please try again."}
          </AlertDescription>
        </Alert>

        <div className="flex flex-col gap-3">
          <Button onClick={reset} className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try again
          </Button>
          <Button variant="outline" asChild className="w-full">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go home
            </Link>
          </Button>
        </div>

        {process.env.NODE_ENV === "development" && error.stack && (
          <details className="mt-4 rounded-md border bg-muted p-4 text-xs">
            <summary className="cursor-pointer font-mono text-muted-foreground">
              Error details (development only)
            </summary>
            <pre className="mt-2 overflow-auto whitespace-pre-wrap break-words">
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
