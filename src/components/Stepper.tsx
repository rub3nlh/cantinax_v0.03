import React from 'react';
import { Check } from 'lucide-react';

interface StepperProps {
  steps: string[];
  currentStep: number;
}

export const Stepper: React.FC<StepperProps> = ({ steps, currentStep }) => {
  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-center space-x-2 sm:space-x-4">
        {steps.map((step, index) => (
          <React.Fragment key={step}>
            <div className="flex items-center">
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
                  index < currentStep
                    ? 'bg-red-500 text-white'
                    : index === currentStep
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {index < currentStep ? (
                  <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <span className="text-xs sm:text-sm">{index + 1}</span>
                )}
              </div>
              <span
                className={`ml-1 sm:ml-2 text-sm sm:text-base ${
                  index === currentStep ? 'text-red-500 font-medium' : 'text-gray-500'
                }`}
              >
                {step}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`h-1 w-10 sm:w-16 ${
                  index < currentStep ? 'bg-red-500' : 'bg-gray-200'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
