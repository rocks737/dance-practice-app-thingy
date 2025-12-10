"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { getMessage } from "@/lib/messages";

/**
 * Client component that reads flash message from URL query params
 * and displays it as a toast notification.
 *
 * Place this component in a layout to handle flash messages for all child routes.
 *
 * @example
 * // In layout.tsx
 * <FlashMessage />
 * {children}
 */
export function FlashMessage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const messageKey = searchParams.get("message");

    if (!messageKey) {
      return;
    }

    const messageConfig = getMessage(messageKey);

    if (messageConfig) {
      // Show toast based on message type
      switch (messageConfig.type) {
        case "error":
          toast.error(messageConfig.content);
          break;
        case "success":
          toast.success(messageConfig.content);
          break;
        case "warning":
          toast.warning(messageConfig.content);
          break;
        case "info":
        default:
          toast.info(messageConfig.content);
          break;
      }
    } else {
      // Fallback: show the raw message key as info (for debugging or legacy URLs)
      toast.info(messageKey);
    }

    // Clear the message param from URL to prevent showing again on refresh
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.delete("message");

    const newUrl = newParams.toString()
      ? `${pathname}?${newParams.toString()}`
      : pathname;

    // Use replace to avoid adding to browser history
    router.replace(newUrl, { scroll: false });
  }, [searchParams, router, pathname]);

  // This component doesn't render anything - it just handles the side effect
  return null;
}
