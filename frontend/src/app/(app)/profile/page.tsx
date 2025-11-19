import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileEditor } from "@/components/profile/ProfileEditor";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <ProfileEditor user={user} />;
}

