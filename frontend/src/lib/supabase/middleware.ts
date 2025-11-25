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
 * Ensures user profile exists in database
 * Creates profile with defaults if it doesn't exist
 */
async function ensureUserProfileExists(supabase: any, userId: string, email: string) {
  try {
    // Check if profile exists
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("auth_user_id", userId)
      .single();

    if (profile) {
      return; // Profile exists, nothing to do
    }

    // Create profile with defaults
    const { data: newProfile, error: profileError } = await supabase
      .from("user_profiles")
      .insert({
        auth_user_id: userId,
        email: email,
        first_name: "",
        last_name: "",
        primary_role: 0, // LEADER
        wsdc_level: 1, // NOVICE (since NEWCOMER is 0)
        competitiveness_level: 3,
        profile_visible: true,
        account_status: 0, // ACTIVE
      })
      .select()
      .single();

    if (profileError) {
      console.error("Error creating user profile:", profileError);
      return;
    }

    // Add default DANCER role
    await supabase.from("user_roles").insert({
      user_id: newProfile.id,
      role: "DANCER",
    });

    console.log("Created profile for new user:", email);
  } catch (error) {
    console.error("Error ensuring user profile:", error);
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

    // If user is authenticated, ensure their profile exists
    if (user && user.email) {
      await ensureUserProfileExists(supabase, user.id, user.email);
    }

    const protectedRoutes = [
      "/invitation",
      "/profile",
      "/schedule",
      "/matches",
      "/sessions",
      "/admin",
      "/settings",
    ];

    if (
      !user &&
      protectedRoutes.some((path) => request.nextUrl.pathname.startsWith(path))
    ) {
      // redirect to /login
      return forceLoginWithReturn(request);
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
