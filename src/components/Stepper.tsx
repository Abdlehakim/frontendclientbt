import React from "react";

export interface StepperProps {
  steps: string[];
  currentStep: number; // 1-based
  onStepClick?: (step: number) => void;
}

export default function Stepper({ steps, currentStep, onStepClick }: StepperProps) {
  return (
    <div className="max-w-5xl mx-auto my-4 pt-4">
      <div className="flex items-start justify-center gap-4 w-full">
        {steps.map((label, idx) => {
          const stepNum = idx + 1;
          const isActive = currentStep === stepNum;
          const isCompleted = currentStep > stepNum;

          return (
            <React.Fragment key={label}>
              <div
                onClick={() => onStepClick?.(stepNum)}
                className={`flex flex-col items-center cursor-pointer ${
                  onStepClick ? "hover:opacity-80" : ""
                } w-40`}
              >
                <div
                  className={`w-8 h-8 flex items-center justify-center rounded-full border-2 ${
                    isCompleted || isActive
                      ? "border-(--tertiary)  bg-(--tertiary) text-white"
                      : "border-gray-300 bg-white text-gray-500"
                  }`}
                >
                  {stepNum}
                </div>

                <span
                  className={`mt-2 max-md:hidden text-sm text-center leading-tight ${
                    isActive ? "text-(--tertiary)" : "text-gray-500"
                  }`}
                >
                  {label}
                </span>
              </div>

              {stepNum < steps.length && <div className="flex-1 min-w-10 h-0.5 bg-gray-300 mt-4" />}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
