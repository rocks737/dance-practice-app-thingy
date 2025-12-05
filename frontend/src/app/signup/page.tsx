"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { SignupProgress } from "@/components/signup/signup-progress";
import { AuthStep } from "./auth-step";
import { PersonalInfoStep } from "./personal-info-step";
import { DanceProfileStep } from "./dance-profile-step";
import { EmailVerificationStep } from "./email-verification-step";
import { SchedulePreferenceStep } from "./schedule-preference-step";
import type { SignupAuthFormData, SignupPersonalInfoFormData, SignupDanceProfileFormData } from "@/lib/profiles/validation";
import { Loader2 } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl");

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [step, setStep] = useState(1);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false);
  
  const [formData, setFormData] = useState<{
    auth: Partial<SignupAuthFormData>;
    personal: Partial<SignupPersonalInfoFormData>;
    dance: Partial<SignupDanceProfileFormData>;
  }>({
    auth: {},
    personal: {},
    dance: {
      competitivenessLevel: 3, // Default to balanced
    },
  });

  // Check if user is already authenticated (resuming onboarding)
  useEffect(() => {
    const checkExistingAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        console.log("[SIGNUP] User already authenticated, resuming onboarding:", user.email);
        setAuthUserId(user.id);
        setFormData((prev) => ({ 
          ...prev, 
          auth: { email: user.email || "", password: "" } 
        }));
        setStep(2); // Skip to personal info step
      }
      
      setIsCheckingAuth(false);
    };

    checkExistingAuth();
  }, []);

  const handleAuthComplete = (data: SignupAuthFormData, userId: string, needsVerification: boolean) => {
    setFormData((prev) => ({ ...prev, auth: data }));
    setAuthUserId(userId);
    setNeedsEmailVerification(needsVerification);
    
    if (needsVerification) {
      setStep(1.5); // Email verification step
    } else {
      setStep(2);
    }
  };

  const handleEmailVerified = () => {
    setNeedsEmailVerification(false);
    setStep(2);
  };

  const handlePersonalInfoComplete = (data: SignupPersonalInfoFormData) => {
    setFormData((prev) => ({ ...prev, personal: data }));
    setStep(3);
  };

  const handleDanceProfileComplete = async (createdProfileId: string) => {
    setProfileId(createdProfileId);
    setStep(4);
  };

  const handleSchedulePreferenceComplete = async () => {
    // Navigate to the return URL or default to schedule
    const destination = returnUrl || "/schedule";
    router.push(destination);
  };

  const handleBack = () => {
    if (step === 4) {
      setStep(3);
    } else if (step === 3) {
      setStep(2);
    } else if (step === 2) {
      // Can't go back to auth step after account is created
      return;
    }
  };

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 lg:px-8 py-8">
      {/* Back to Login Link - Only show on step 1 */}
      {step === 1 && (
        <Link
          href="/login"
          className="absolute left-4 sm:left-8 top-4 sm:top-8 py-2 px-3 sm:px-4 rounded-md no-underline text-foreground bg-btn-background hover:bg-btn-background-hover flex items-center group text-sm"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span className="hidden sm:inline">Back to Login</span>
          <span className="sm:hidden">Back</span>
        </Link>
      )}

      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Create Your Account
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Join our dance community and start practicing with partners
          </p>
        </div>

        {/* Progress Indicator - Only show after auth step */}
        {step >= 2 && <SignupProgress currentStep={step} totalSteps={4} />}

        {/* Step Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6 lg:p-8">
          {step === 1 && (
            <AuthStep
              initialData={formData.auth}
              onComplete={handleAuthComplete}
              returnUrl={returnUrl}
            />
          )}

          {step === 1.5 && (
            <EmailVerificationStep
              email={formData.auth.email || ""}
              onVerified={handleEmailVerified}
            />
          )}

          {step === 2 && authUserId && (
            <PersonalInfoStep
              initialData={formData.personal}
              onComplete={handlePersonalInfoComplete}
            />
          )}

          {step === 3 && authUserId && (
            <DanceProfileStep
              initialData={formData.dance}
              authUserId={authUserId}
              email={formData.auth.email || ""}
              personalInfo={formData.personal as SignupPersonalInfoFormData}
              onComplete={handleDanceProfileComplete}
              onBack={handleBack}
            />
          )}

          {step === 4 && profileId && (
            <SchedulePreferenceStep
              profileId={profileId}
              onComplete={handleSchedulePreferenceComplete}
              onBack={handleBack}
            />
          )}
        </div>

        {/* Additional Info */}
        {step === 1 && (
          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

