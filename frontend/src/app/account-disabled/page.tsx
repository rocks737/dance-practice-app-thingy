import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function AccountDisabledPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("account_status,email,first_name,last_name,display_name")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  const status = profile?.account_status ?? 0;
  const title =
    status === 1 ? "Account suspended" : status === 2 ? "Account deleted" : "Account status";

  const signOut = async () => {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login?message=Signed%20out");
  };

  return (
    <div className="w-full max-w-xl p-6 mt-10">
      <Card>
        <CardContent className="p-6 space-y-4">
          <h1 className="text-2xl font-bold">{title}</h1>
          {status === 1 ? (
            <p className="text-muted-foreground">
              Your account has been suspended. If you believe this is a mistake, please contact
              support.
            </p>
          ) : status === 2 ? (
            <p className="text-muted-foreground">
              Your account has been marked as deleted. If you need to recover access, please
              contact support.
            </p>
          ) : (
            <p className="text-muted-foreground">
              Your account is currently unavailable. Please contact support.
            </p>
          )}

          <div className="pt-2">
            <form action={signOut}>
              <Button type="submit" variant="outline">
                Sign out
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


