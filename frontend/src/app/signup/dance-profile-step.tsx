"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Check, ArrowLeft } from "lucide-react";
import { createUserProfile } from "@/lib/profiles/onboarding";
import {
  signupDanceProfileSchema,
  type SignupDanceProfileFormData,
  type SignupPersonalInfoFormData,
} from "@/lib/profiles/validation";
import {
  PRIMARY_ROLE_OPTIONS,
  WSDC_SKILL_LEVEL_OPTIONS,
} from "@/lib/profiles/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface DanceProfileStepProps {
  initialData: Partial<SignupDanceProfileFormData>;
  authUserId: string;
  email: string;
  personalInfo: SignupPersonalInfoFormData;
  onComplete: (profileId: string) => void;
  onBack: () => void;
}

export function DanceProfileStep({
  initialData,
  authUserId,
  email,
  personalInfo,
  onComplete,
  onBack,
}: DanceProfileStepProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    setValue,
    watch,
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<SignupDanceProfileFormData>({
    resolver: zodResolver(signupDanceProfileSchema),
    defaultValues: {
      primaryRole: initialData.primaryRole ?? 0,
      competitivenessLevel: initialData.competitivenessLevel ?? 3,
      wsdcLevel: initialData.wsdcLevel ?? undefined,
      bio: initialData.bio ?? "",
      danceGoals: initialData.danceGoals ?? "",
    },
  });

  const primaryRole = watch("primaryRole");
  const competitivenessLevel = watch("competitivenessLevel");
  const wsdcLevel = watch("wsdcLevel");
  const bio = watch("bio") || "";
  const danceGoals = watch("danceGoals") || "";

  const onSubmit = async (data: SignupDanceProfileFormData) => {
    setIsSubmitting(true);

    try {
      // Create the user profile
      console.log("[PROFILE CREATION] Creating profile for user:", authUserId);
      
      const profile = await createUserProfile({
        authUserId,
        email,
        firstName: personalInfo.firstName,
        lastName: personalInfo.lastName,
        displayName: personalInfo.displayName,
        birthDate: personalInfo.birthDate,
        primaryRole: data.primaryRole,
        competitivenessLevel: data.competitivenessLevel,
        wsdcLevel: data.wsdcLevel ?? null,
        bio: data.bio,
        danceGoals: data.danceGoals,
      });

      console.log("[PROFILE CREATION] Profile created successfully:", profile.id);
      toast.success("Profile created successfully!");
      
      // Pass profile ID to next step
      onComplete(profile.id);
    } catch (error) {
      console.error("[PROFILE CREATION ERROR]", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create profile. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Your Dance Profile
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Tell us about your dancing so we can match you with the right partners
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Primary Role */}
        <div>
          <Label className="text-base">
            Primary Dance Role <span className="text-red-500">*</span>
          </Label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Your preferred role when dancing
          </p>
          <RadioGroup
            value={primaryRole?.toString()}
            onValueChange={(value) => setValue("primaryRole", parseInt(value), { shouldValidate: true })}
          >
            <div className="grid grid-cols-2 gap-4">
              {PRIMARY_ROLE_OPTIONS.map((option) => (
                <div key={option.value}>
                  <RadioGroupItem
                    value={option.value.toString()}
                    id={`role-${option.value}`}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={`role-${option.value}`}
                    className="flex items-center justify-center rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all"
                  >
                    <span className="font-medium">{option.label}</span>
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
          {errors.primaryRole && (
            <p className="mt-1 text-sm text-red-500">{errors.primaryRole.message}</p>
          )}
        </div>

        {/* Competitiveness Level */}
        <div>
          <Label className="text-base">
            How Competitive Are You? <span className="text-red-500">*</span>
          </Label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Helps us match you with dancers who have similar goals
          </p>
          <div className="pt-2 px-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold text-primary">{competitivenessLevel}</span>
            </div>
            <Slider
              min={1}
              max={5}
              step={1}
              value={[competitivenessLevel]}
              onValueChange={(value) =>
                setValue("competitivenessLevel", value[0], { shouldValidate: true })
              }
              disabled={isSubmitting}
              className="mb-2"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span className="text-left w-20">1 - Social dancer</span>
              <span className="text-center">3 - Balanced</span>
              <span className="text-right w-20">5 - Very competitive</span>
            </div>
          </div>
          {errors.competitivenessLevel && (
            <p className="mt-1 text-sm text-red-500">{errors.competitivenessLevel.message}</p>
          )}
        </div>

        {/* WSDC Skill Level */}
        <div>
          <Label htmlFor="wsdcLevel" className="text-base">
            WSDC Skill Level (optional)
          </Label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            Your current West Coast Swing competition division
          </p>
          <Select
            value={wsdcLevel?.toString() ?? "unranked"}
            onValueChange={(value) => {
              const level = value === "unranked" ? undefined : parseInt(value);
              setValue("wsdcLevel", level, { shouldValidate: true });
            }}
            disabled={isSubmitting}
          >
            <SelectTrigger id="wsdcLevel">
              <SelectValue placeholder="Select your skill level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unranked">Unranked / Not applicable</SelectItem>
              {WSDC_SKILL_LEVEL_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.wsdcLevel && (
            <p className="mt-1 text-sm text-red-500">{errors.wsdcLevel.message}</p>
          )}
        </div>

        {/* About You */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="bio" className="text-base">
              About You (optional)
            </Label>
            <span
              className={`text-xs ${bio.length > 1000 ? "text-red-500" : "text-gray-500 dark:text-gray-400"}`}
            >
              {bio.length} / 1000
            </span>
          </div>
          <Textarea
            id="bio"
            {...register("bio")}
            disabled={isSubmitting}
            placeholder="Tell potential practice partners about yourself - your dance background, what you enjoy most about dancing, or any other relevant information..."
            rows={4}
            className={errors.bio ? "border-red-500" : ""}
          />
          {errors.bio && <p className="mt-1 text-sm text-red-500">{errors.bio.message}</p>}
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Share your story, experience level, or what you'd like practice partners to know
          </p>
        </div>

        {/* Dance Goals */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="danceGoals" className="text-base">
              Dance Goals (optional)
            </Label>
            <span
              className={`text-xs ${danceGoals.length > 500 ? "text-red-500" : "text-gray-500 dark:text-gray-400"}`}
            >
              {danceGoals.length} / 500
            </span>
          </div>
          <Textarea
            id="danceGoals"
            {...register("danceGoals")}
            disabled={isSubmitting}
            placeholder="What are you working towards? Competitions, social dancing, technique improvement, learning new moves..."
            rows={3}
            className={errors.danceGoals ? "border-red-500" : ""}
          />
          {errors.danceGoals && (
            <p className="mt-1 text-sm text-red-500">{errors.danceGoals.message}</p>
          )}
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            What you're working towards helps us find compatible practice partners
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={isSubmitting}
            className="flex-1"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Profile...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Complete Setup
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

