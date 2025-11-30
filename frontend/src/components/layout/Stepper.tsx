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
                ${isActive ? 'bg-white dark:bg-blue-600 border-blue-600 text-blue-600 dark:text-white' : ''}
                ${!isActive && !isCompleted ? 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-400' : ''}`}
              >
                {isCompleted ? '✓' : stepNumber}
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
