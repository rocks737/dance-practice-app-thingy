import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LoginButton } from "./login-buttons";

// Helper to check if error is a Next.js redirect (which should not be caught)
function isRedirectError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  const err = error as Error & { digest?: string };
  return (
    error.message === "NEXT_REDIRECT" ||
    (err.digest?.startsWith("NEXT_REDIRECT") ?? false)
  );
}

export default function Login({
  searchParams,
}: {
  searchParams: { message: string; returnUrl?: string };
}) {
  const safeReturnUrl =
    typeof searchParams?.returnUrl === "string" &&
    searchParams.returnUrl &&
    searchParams.returnUrl !== "undefined"
      ? searchParams.returnUrl
      : undefined;

  const signIn = async (formData: FormData) => {
    "use server";

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const returnUrl = formData.get("returnUrl") as string | null;

    if (!email || !password) {
      const params = new URLSearchParams();
      params.set("message", "Email and password are required");
      if (returnUrl) {
        params.set("returnUrl", returnUrl);
      }
      redirect(`/login?${params.toString()}`);
    }

    try {
      const supabase = createClient();

      console.log("[LOGIN] Attempting sign in for:", email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("[LOGIN ERROR] Supabase auth error:", {
          message: error.message,
          status: error.status,
          code: (error as any).code,
          fullError: error,
        });

        const params = new URLSearchParams();
        // Show user-friendly error messages based on error code
        let errorMessage = "Could not authenticate user";
        if ((error as any).code === "invalid_credentials") {
          errorMessage = "Invalid email or password";
        } else if (error.message) {
          errorMessage = error.message;
        }

        params.set("message", errorMessage);
        if (returnUrl) {
          params.set("returnUrl", returnUrl);
        }
        redirect(`/login?${params.toString()}`);
      }

      if (!data.user) {
        console.error("[LOGIN ERROR] No user returned from sign in");
        const params = new URLSearchParams();
        params.set("message", "Authentication failed: No user returned");
        if (returnUrl) {
          params.set("returnUrl", returnUrl);
        }
        redirect(`/login?${params.toString()}`);
      }

      console.log("[LOGIN SUCCESS] User signed in:", data.user.email);
      redirect(returnUrl || "/matches");
    } catch (err) {
      // Don't catch redirect errors - let them propagate
      if (isRedirectError(err)) {
        throw err;
      }

      console.error("[LOGIN ERROR] Unexpected error:", {
        error: err,
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      });

      const params = new URLSearchParams();
      params.set(
        "message",
        err instanceof Error ? err.message : "An unexpected error occurred",
      );
      if (returnUrl) {
        params.set("returnUrl", returnUrl);
      }
      redirect(`/login?${params.toString()}`);
    }
  };


  return (
    <div className="flex-1 flex flex-col w-full px-4 sm:px-8 sm:max-w-md justify-center gap-2">
      <Link
        href="/"
        className="absolute left-4 sm:left-8 top-4 sm:top-8 py-2 px-3 sm:px-4 rounded-md no-underline text-foreground bg-btn-background hover:bg-btn-background-hover flex items-center group text-sm"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>{" "}
        Back
      </Link>

      <form className="animate-in flex-1 flex flex-col w-full justify-center gap-2 text-foreground py-8">
        {safeReturnUrl && <input type="hidden" name="returnUrl" value={safeReturnUrl} />}
        <label className="text-md" htmlFor="email">
          Email
        </label>
        <Input id="email" name="email" placeholder="you@example.com" required />
        <label className="text-md" htmlFor="password">
          Password
        </label>
        <Input
          id="password"
          type="password"
          name="password"
          placeholder="••••••••"
          required
        />
        <LoginButton formAction={signIn} pendingText="Signing In...">
          Sign In
        </LoginButton>
        <Link
          href={`/signup${safeReturnUrl ? `?returnUrl=${encodeURIComponent(safeReturnUrl)}` : ""}`}
          className="w-full"
        >
          <Button type="button" variant="outline" className="w-full">
            Sign Up
          </Button>
        </Link>
        {searchParams?.message && (
          <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-destructive text-center font-medium">
              {searchParams.message}
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
