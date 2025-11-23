"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import type { ComponentProps } from "react";

type LoginButtonProps = ComponentProps<typeof Button> & {
  pendingText?: string;
};

export function LoginButton({ 
  children, 
  pendingText = "Submitting...", 
  ...props 
}: LoginButtonProps) {
  const { pending } = useFormStatus();
  
  return (
    <Button {...props} type="submit" disabled={pending}>
      {pending ? pendingText : children}
    </Button>
  );
}

