import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if user has admin role
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  if (profile) {
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", profile.id);

    const isAdmin = roles?.some((r) => r.role === "ADMIN");

    if (!isAdmin) {
      redirect("/profile");
    }
  } else {
    redirect("/profile");
  }

  return <>{children}</>;
}

