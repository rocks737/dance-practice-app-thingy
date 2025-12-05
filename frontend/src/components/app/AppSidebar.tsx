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
  MapPin,
  Menu,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useUserRoles } from "@/lib/hooks/useUserRoles";
import { useUserProfile } from "@/lib/hooks/useUserProfile";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

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
    href: "/locations",
    label: "Locations",
    icon: MapPin,
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

// Sidebar content component (shared between desktop and mobile)
function SidebarContent({
  user,
  displayName,
  pathname,
  isAdmin,
  rolesLoading,
  handleSignOut,
  onLinkClick,
}: {
  user: User;
  displayName: string;
  pathname: string;
  isAdmin: boolean;
  rolesLoading: boolean;
  handleSignOut: () => void;
  onLinkClick?: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo/Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Dance Practice
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">partnerly.dance</p>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
            <UserCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {displayName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {user.email}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
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
              onClick={onLinkClick}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100",
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
        <div className="flex items-center justify-between">
          <Link
            href="/settings"
            onClick={onLinkClick}
            className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 transition-colors flex-1"
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            <span>Settings</span>
          </Link>
          <ThemeToggle />
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-sm font-medium"
          onClick={() => {
            handleSignOut();
            onLinkClick?.();
          }}
        >
          <LogOut className="w-5 h-5 mr-3 flex-shrink-0" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useUserProfile(user.id);
  const { isAdmin, loading: rolesLoading } = useUserRoles(profile?.id);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const displayName =
    profile?.display_name ||
    `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() ||
    user.email;

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <>
      {/* Mobile Header with Hamburger */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-4 h-16">
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Dance Practice
          </h1>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <SidebarContent
                  user={user}
                  displayName={displayName}
                  pathname={pathname}
                  isAdmin={isAdmin}
                  rolesLoading={rolesLoading}
                  handleSignOut={handleSignOut}
                  onLinkClick={closeMobileMenu}
                />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex-col">
        <SidebarContent
          user={user}
          displayName={displayName}
          pathname={pathname}
          isAdmin={isAdmin}
          rolesLoading={rolesLoading}
          handleSignOut={handleSignOut}
        />
      </aside>
    </>
  );
}
