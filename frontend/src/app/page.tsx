import { Button } from "@/components/ui/button";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Users, Calendar, Home, Shield, LucideIcon } from "lucide-react";

const features: { name: string; description: string; icon: LucideIcon }[] = [
  {
    name: "Smart Matching",
    description:
      "Find partners based on skill level, goals, and compatibility. Our algorithm connects you with dancers who complement your practice style.",
    icon: Users,
  },
  {
    name: "Schedule Management",
    description:
      "Set your availability and find partners with matching schedules. Coordinate practice times effortlessly across different time zones.",
    icon: Calendar,
  },
  {
    name: "Session Coordination",
    description:
      "Create, join, and manage practice sessions effortlessly. Track your progress and keep notes on what you've worked on together.",
    icon: Home,
  },
  {
    name: "Safe Community",
    description:
      "Verified profiles and community moderation for peace of mind. Dance with confidence knowing our community standards are enforced.",
    icon: Shield,
  },
];

export default async function Index() {
  // If user is logged in, redirect to profile
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/profile");
  }

  return (
    <div className="flex min-h-screen w-full flex-1 flex-col">
      {/* Navigation */}
      <nav className="w-full border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Dance Practice
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
              >
                Sign In
              </Link>
              <Link href="/login">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-white py-24 dark:bg-gray-900 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base/7 font-semibold text-blue-600 dark:text-blue-400">
              Dance Practice App
            </h2>
            <p className="mt-2 text-pretty text-4xl font-semibold tracking-tight text-gray-900 dark:text-gray-100 sm:text-5xl lg:text-balance">
              Find Your Perfect Practice Partner
            </p>
            <p className="mt-6 text-lg/8 text-gray-600 dark:text-gray-400">
              Connect with dancers who match your skill level, availability, and
              location. Make practice sessions more productive and enjoyable.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link href="/login">
                <Button size="lg" className="px-6 sm:px-8">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>

          {/* Features */}
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
              {features.map((feature) => (
                <div key={feature.name} className="relative pl-16">
                  <dt className="text-base/7 font-semibold text-gray-900 dark:text-gray-100">
                    <div className="absolute left-0 top-0 flex size-10 items-center justify-center rounded-lg bg-blue-600 dark:bg-blue-500">
                      <feature.icon
                        aria-hidden="true"
                        className="size-6 text-white"
                      />
                    </div>
                    {feature.name}
                  </dt>
                  <dd className="mt-2 text-base/7 text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <p className="text-center text-gray-600 dark:text-gray-400">
            © 2025 Dance Practice App.
          </p>
        </div>
      </footer>
    </div>
  );
}
