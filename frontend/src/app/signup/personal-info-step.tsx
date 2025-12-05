"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import { signupPersonalInfoSchema, type SignupPersonalInfoFormData } from "@/lib/profiles/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PersonalInfoStepProps {
  initialData: Partial<SignupPersonalInfoFormData>;
  onComplete: (data: SignupPersonalInfoFormData) => void;
}

export function PersonalInfoStep({ initialData, onComplete }: PersonalInfoStepProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupPersonalInfoFormData>({
    resolver: zodResolver(signupPersonalInfoSchema),
    defaultValues: initialData,
  });

  const onSubmit = (data: SignupPersonalInfoFormData) => {
    onComplete(data);
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Tell Us About Yourself
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Help us personalize your experience
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* First Name */}
        <div>
          <Label htmlFor="firstName">
            First Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="firstName"
            placeholder="John"
            {...register("firstName")}
            className={errors.firstName ? "border-red-500" : ""}
            autoComplete="given-name"
          />
          {errors.firstName && (
            <p className="mt-1 text-sm text-red-500">{errors.firstName.message}</p>
          )}
        </div>

        {/* Last Name */}
        <div>
          <Label htmlFor="lastName">
            Last Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="lastName"
            placeholder="Doe"
            {...register("lastName")}
            className={errors.lastName ? "border-red-500" : ""}
            autoComplete="family-name"
          />
          {errors.lastName && (
            <p className="mt-1 text-sm text-red-500">{errors.lastName.message}</p>
          )}
        </div>

        {/* Display Name */}
        <div>
          <Label htmlFor="displayName">Display Name (optional)</Label>
          <Input
            id="displayName"
            placeholder="How you'd like to be called"
            {...register("displayName")}
            className={errors.displayName ? "border-red-500" : ""}
          />
          {errors.displayName && (
            <p className="mt-1 text-sm text-red-500">{errors.displayName.message}</p>
          )}
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Leave blank to use your first name
          </p>
        </div>

        {/* Birth Date */}
        <div>
          <Label htmlFor="birthDate">Birth Date (optional)</Label>
          <Input
            id="birthDate"
            type="date"
            {...register("birthDate")}
            className={errors.birthDate ? "border-red-500" : ""}
          />
          {errors.birthDate && (
            <p className="mt-1 text-sm text-red-500">{errors.birthDate.message}</p>
          )}
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Helps us tailor your experience
          </p>
        </div>

        {/* Submit Button */}
        <Button type="submit" className="w-full mt-6">
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </form>
    </div>
  );
}

