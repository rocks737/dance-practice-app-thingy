/**
 * Progress indicator for multi-step signup flow
 */

import { Check } from "lucide-react";

interface SignupProgressProps {
  currentStep: number;
  totalSteps: number;
}

export function SignupProgress({ currentStep, totalSteps }: SignupProgressProps) {
  const steps = [
    { number: 1, label: "Create Account" },
    { number: 2, label: "Personal Info" },
    { number: 3, label: "Dance Profile" },
    { number: 4, label: "Availability" },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center flex-1">
            {/* Step Circle */}
            <div className="flex flex-col items-center">
              <div
                className={`
                  flex items-center justify-center w-10 h-10 rounded-full border-2 
                  transition-all duration-300
                  ${
                    step.number < currentStep
                      ? "bg-primary border-primary text-primary-foreground"
                      : step.number === currentStep
                        ? "bg-primary border-primary text-primary-foreground"
                        : "bg-background border-gray-300 dark:border-gray-600 text-gray-400"
                  }
                `}
              >
                {step.number < currentStep ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="font-semibold">{step.number}</span>
                )}
              </div>
              <span
                className={`
                  mt-2 text-xs font-medium text-center
                  ${
                    step.number <= currentStep
                      ? "text-gray-900 dark:text-gray-100"
                      : "text-gray-400 dark:text-gray-500"
                  }
                `}
              >
                {step.label}
              </span>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={`
                  flex-1 h-0.5 mx-4 transition-all duration-300
                  ${
                    step.number < currentStep
                      ? "bg-primary"
                      : "bg-gray-300 dark:bg-gray-600"
                  }
                `}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

