"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { signupAuthSchema, type SignupAuthFormData } from "@/lib/profiles/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface AuthStepProps {
  initialData: Partial<SignupAuthFormData>;
  onComplete: (data: SignupAuthFormData, userId: string, needsEmailVerification: boolean) => void;
  returnUrl: string | null;
}

export function AuthStep({ initialData, onComplete, returnUrl }: AuthStepProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupAuthFormData>({
    resolver: zodResolver(signupAuthSchema),
    defaultValues: initialData,
  });

  const onSubmit = async (data: SignupAuthFormData) => {
    setIsLoading(true);

    try {
      const supabase = createClient();
      const origin = window.location.origin;

      console.log("[SIGNUP] Attempting sign up for:", data.email);

      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${origin}/auth/callback${
            returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ""
          }`,
        },
      });

      if (error) {
        console.error("[SIGNUP ERROR]", error);
        toast.error(error.message || "Failed to create account");
        setIsLoading(false);
        return;
      }

      if (!authData.user) {
        toast.error("Failed to create account. Please try again.");
        setIsLoading(false);
        return;
      }

      console.log("[SIGNUP SUCCESS] User created:", authData.user.id);

      // Check if email confirmation is required
      const needsEmailVerification = !authData.session;

      if (needsEmailVerification) {
        console.log("[SIGNUP] Email confirmation required");
        toast.success("Please check your email to verify your account");
      } else {
        toast.success("Account created successfully!");
      }

      onComplete(data, authData.user.id, needsEmailVerification);
    } catch (err) {
      console.error("[SIGNUP ERROR] Unexpected error:", err);
      toast.error(err instanceof Error ? err.message : "An unexpected error occurred");
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Create Your Account
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Enter your email and create a password to get started
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email */}
        <div>
          <Label htmlFor="email">
            Email <span className="text-red-500">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            {...register("email")}
            disabled={isLoading}
            className={errors.email ? "border-red-500" : ""}
            autoComplete="email"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <Label htmlFor="password">
            Password <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              {...register("password")}
              disabled={isLoading}
              className={errors.password ? "border-red-500 pr-10" : "pr-10"}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              disabled={isLoading}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
          )}
          <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <p>Password must contain:</p>
            <ul className="list-disc list-inside space-y-0.5 ml-2">
              <li>At least 8 characters</li>
              <li>One uppercase letter</li>
              <li>One lowercase letter</li>
              <li>One number</li>
            </ul>
          </div>
        </div>

        {/* Submit Button */}
        <Button type="submit" className="w-full mt-6" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating Account...
            </>
          ) : (
            "Create Account"
          )}
        </Button>
      </form>
    </div>
  );
}

