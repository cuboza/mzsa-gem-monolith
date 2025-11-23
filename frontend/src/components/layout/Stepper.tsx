import { ReactNode } from 'react';

interface Step {
  label: string;
  icon?: ReactNode;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
}

export const Stepper = ({ steps, currentStep }: StepperProps) => {
  return (
    <div className="overflow-x-auto w-full">
      <div className="flex gap-4 min-w-[400px]">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;
          return (
            <div key={step.label} className="min-w-[80px] flex flex-col items-center text-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 border-2 text-sm font-bold transition-colors
                ${isCompleted ? 'bg-green-500 border-green-500 text-white' : ''}
                ${isActive ? 'bg-white border-blue-600 text-blue-600' : ''}
                ${!isActive && !isCompleted ? 'bg-white border-gray-300 text-gray-400' : ''}`}
              >
                {isCompleted ? '✓' : stepNumber}
              </div>
              <span className="text-xs text-gray-600 whitespace-nowrap">{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
