import React from 'react';
import { AppStep } from '../types';
import { CheckCircle, Circle, ArrowRight } from 'lucide-react';

interface Props {
  currentStep: AppStep;
  setStep: (step: AppStep) => void;
  canNavigate: (step: AppStep) => boolean;
}

const steps = [
  { id: AppStep.SCRIPT, label: 'Script & Concept' },
  { id: AppStep.VOICE, label: 'Voice & Audio' },
  { id: AppStep.VISUALS, label: 'Visuals' },
  { id: AppStep.PREVIEW, label: 'Final Assembly' },
];

export const StepIndicator: React.FC<Props> = ({ currentStep, setStep, canNavigate }) => {
  return (
    <div className="w-full bg-slate-800 border-b border-slate-700">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isActive = step.id === currentStep;
            const isCompleted = steps.findIndex(s => s.id === currentStep) > index;
            const isNavigable = canNavigate(step.id);

            return (
              <div key={step.id} className="flex items-center flex-1 last:flex-none">
                <div 
                  className={`flex items-center gap-2 cursor-pointer transition-colors ${
                    isActive ? 'text-indigo-400' : isCompleted ? 'text-emerald-400' : 'text-slate-500'
                  } ${!isNavigable ? 'pointer-events-none opacity-50' : ''}`}
                  onClick={() => isNavigable && setStep(step.id)}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : isActive ? (
                    <div className="relative">
                      <Circle className="w-6 h-6" />
                      <div className="absolute inset-0 m-auto w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
                    </div>
                  ) : (
                    <Circle className="w-6 h-6" />
                  )}
                  <span className="font-medium text-sm hidden sm:block">{step.label}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className="flex-1 px-4 hidden sm:block">
                    <div className={`h-0.5 w-full ${isCompleted ? 'bg-emerald-400/30' : 'bg-slate-700'}`} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
