"use client";

import { cn } from "@/lib/utils";
import { User } from "@supabase/supabase-js";
import {
  Calendar,
  Home,
  LogOut,
  Settings,
  Shield,
  Users,
  UserCircle,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useUserRoles } from "@/lib/hooks/useUserRoles";
import { useUserProfile } from "@/lib/hooks/useUserProfile";
import { createClient } from "@/lib/supabase/client";

interface AppSidebarProps {
  user: User;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  {
    href: "/profile",
    label: "Profile",
    icon: UserCircle,
  },
  {
    href: "/schedule",
    label: "Schedule",
    icon: Calendar,
  },
  {
    href: "/matches",
    label: "Matches",
    icon: Users,
  },
  {
    href: "/sessions",
    label: "Sessions",
    icon: Home,
  },
  {
    href: "/admin",
    label: "Admin",
    icon: Shield,
    adminOnly: true,
  },
];

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useUserProfile(user.id);
  const { isAdmin, loading: rolesLoading } = useUserRoles(profile?.id);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const displayName =
    profile?.display_name ||
    `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() ||
    user.email;

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo/Header */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">Dance Practice</h1>
        <p className="text-sm text-gray-500 mt-1">thingy</p>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <UserCircle className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {displayName}
            </p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          // Hide admin link if user is not admin
          if (item.adminOnly && (!isAdmin || rolesLoading)) {
            return null;
          }

          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        <Link
          href="/settings"
          className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </Link>
        <Button
          variant="ghost"
          className="w-full justify-start text-sm font-medium"
          onClick={handleSignOut}
        >
          <LogOut className="w-5 h-5 mr-3" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}

