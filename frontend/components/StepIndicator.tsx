interface Step {
  number: number;
  title: string;
  description: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

export default function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center">
      <div className="flex items-center space-x-4">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full border-2 font-semibold transition-all ${
                  step.number === currentStep
                    ? 'border-purple-600 bg-purple-600 text-white shadow-lg scale-110'
                    : step.number < currentStep
                    ? 'border-green-500 bg-green-500 text-white'
                    : 'border-gray-300 bg-white text-gray-400'
                }`}
              >
                {step.number < currentStep ? '✓' : step.number}
              </div>
              <div className="mt-2 text-center">
                <div
                  className={`text-sm font-semibold ${
                    step.number === currentStep
                      ? 'text-purple-600'
                      : step.number < currentStep
                      ? 'text-green-600'
                      : 'text-gray-400'
                  }`}
                >
                  {step.title}
                </div>
                <div className="text-xs text-gray-500">{step.description}</div>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`h-0.5 w-16 mx-4 ${
                  step.number < currentStep ? 'bg-green-500' : 'bg-gray-300'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
