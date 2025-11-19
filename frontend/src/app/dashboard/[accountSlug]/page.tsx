import { redirect } from "next/navigation";

export default function PersonalAccountPage() {
    // Redirect to the profile page instead of showing the default Basejump page
    // TODO - maybe have an onboarding flow here?
    redirect("/profile");
}