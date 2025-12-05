import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

function forceLoginWithReturn(request: NextRequest) {
  const originalUrl = new URL(request.url);
  const path = originalUrl.pathname;
  const query = originalUrl.searchParams.toString();
  return NextResponse.redirect(
    new URL(
      `/login?returnUrl=${encodeURIComponent(path + (query ? `?${query}` : ""))}`,
      request.url,
    ),
  );
}

/**
 * Check if user profile is complete
 * Returns true if profile exists and has required fields filled
 */
async function checkProfileComplete(supabase: any, userId: string): Promise<boolean> {
  try {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("id, first_name, last_name")
      .eq("auth_user_id", userId)
      .maybeSingle();

    // Profile doesn't exist
    if (!profile) {
      return false;
    }

    // Profile exists but missing required fields
    if (!profile.first_name || !profile.last_name) {
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error checking profile:", error);
    return false;
  }
}

export const validateSession = async (request: NextRequest) => {
  // This `try/catch` block is only here for the interactive tutorial.
  // Feel free to remove once you have Supabase connected.
  try {
    // Create an unmodified response
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            // If the cookie is updated, update the cookies for the request and response
            request.cookies.set({
              name,
              value,
              ...options,
            });
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            response.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name: string, options: CookieOptions) {
            // If the cookie is removed, update the cookies for the request and response
            request.cookies.set({
              name,
              value: "",
              ...options,
            });
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            response.cookies.set({
              name,
              value: "",
              ...options,
            });
          },
        },
      },
    );

    // This will refresh session if expired - required for Server Components
    // https://supabase.com/docs/guides/auth/server-side/nextjs
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const protectedRoutes = [
      "/invitation",
      "/profile",
      "/schedule",
      "/matches",
      "/sessions",
      "/admin",
      "/settings",
    ];

    const currentPath = request.nextUrl.pathname;
    const isProtectedRoute = protectedRoutes.some((path) => currentPath.startsWith(path));
    const isSignupRoute = currentPath.startsWith("/signup");
    const isAuthCallback = currentPath.startsWith("/auth/callback");

    // If not authenticated and trying to access protected route, redirect to login
    if (!user && isProtectedRoute) {
      return forceLoginWithReturn(request);
    }

    // If authenticated, check if profile is complete (except for signup and auth callback routes)
    if (user && !isSignupRoute && !isAuthCallback) {
      const profileComplete = await checkProfileComplete(supabase, user.id);
      
      if (!profileComplete && isProtectedRoute) {
        // Profile incomplete, redirect to signup to complete onboarding
        console.log("[MIDDLEWARE] Redirecting user to complete onboarding:", user.email);
        return NextResponse.redirect(
          new URL(
            `/signup?returnUrl=${encodeURIComponent(currentPath)}`,
            request.url,
          ),
        );
      }
    }

    return response;
  } catch (e) {
    // If you are here, a Supabase client could not be created!
    // This is likely because you have not set up environment variables.
    // Check out http://localhost:3000 for Next Steps.
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
};
