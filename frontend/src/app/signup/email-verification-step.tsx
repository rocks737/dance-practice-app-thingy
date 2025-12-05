"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface EmailVerificationStepProps {
  email: string;
  onVerified: () => void;
}

export function EmailVerificationStep({ email, onVerified }: EmailVerificationStepProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(60);

  // Check for email verification every 5 seconds
  useEffect(() => {
    const checkVerification = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user?.email_confirmed_at) {
        console.log("[EMAIL VERIFICATION] Email verified");
        onVerified();
      }
    };

    // Initial check
    checkVerification();

    // Set up polling
    const interval = setInterval(checkVerification, 5000);

    return () => clearInterval(interval);
  }, [onVerified]);

  // Countdown for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleResendEmail = async () => {
    setIsResending(true);
    
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) {
        toast.error(error.message || "Failed to resend verification email");
      } else {
        toast.success("Verification email sent! Please check your inbox.");
        setCanResend(false);
        setCountdown(60);
      }
    } catch (err) {
      console.error("[RESEND ERROR]", err);
      toast.error("Failed to resend verification email");
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckNow = async () => {
    setIsChecking(true);
    
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user?.email_confirmed_at) {
        toast.success("Email verified successfully!");
        onVerified();
      } else {
        toast.error("Email not yet verified. Please check your inbox.");
      }
    } catch (err) {
      console.error("[CHECK ERROR]", err);
      toast.error("Failed to check verification status");
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="text-center">
      <div className="mb-6">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
            <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Verify Your Email
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          We've sent a verification link to:
        </p>
        <p className="text-base font-medium text-gray-900 dark:text-gray-100 mt-1">
          {email}
        </p>
      </div>

      <div className="space-y-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm text-gray-700 dark:text-gray-300">
          <p className="font-medium mb-2">What to do next:</p>
          <ol className="list-decimal list-inside space-y-1 text-left">
            <li>Check your email inbox (and spam folder)</li>
            <li>Click the verification link in the email</li>
            <li>Return to this page to continue</li>
          </ol>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            onClick={handleCheckNow}
            disabled={isChecking}
            className="w-full"
          >
            {isChecking ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Checking...
              </>
            ) : (
              "I've Verified My Email"
            )}
          </Button>

          <Button
            onClick={handleResendEmail}
            disabled={!canResend || isResending}
            variant="outline"
            className="w-full"
          >
            {isResending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Resending...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                {canResend ? "Resend Verification Email" : `Resend in ${countdown}s`}
              </>
            )}
          </Button>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
          This page will automatically continue once your email is verified
        </p>
      </div>
    </div>
  );
}

