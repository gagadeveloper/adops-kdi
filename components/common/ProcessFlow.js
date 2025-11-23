'use client';

import { useState } from 'react';
import StatusBadge from './StatusBadge';

export default function ProcessFlow({ steps, currentStep }) {
  const [activeStep, setActiveStep] = useState(null);
  
  const handleStepClick = (index) => {
    setActiveStep(activeStep === index ? null : index);
  };
  
  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-max flex items-center py-4 space-x-2">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isActive = isCompleted || isCurrent;
          
          return (
            <div key={index} className="flex items-center">
              {index > 0 && (
                <div className={`w-8 h-0.5 ${isCompleted ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
              )}
              
              <div className="relative">
                <button
                  onClick={() => handleStepClick(index)}
                  className={`
                    relative z-10 flex flex-col items-center group 
                    ${isActive ? '' : 'opacity-60'}
                  `}
                >
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    ${isCompleted ? 'bg-green-500' : isCurrent ? 'bg-blue-500' : 'bg-gray-200'}
                    transition-all duration-200
                  `}>
                    {step.icon ? (
                      <span className="text-white">{step.icon}</span>
                    ) : (
                      <span className="text-white font-medium">{index + 1}</span>
                    )}
                  </div>
                  
                  <div className="mt-2 text-xs font-medium text-center">
                    {step.title}
                  </div>
                  
                  <StatusBadge status={step.status} className="mt-1" />
                </button>
                
                {activeStep === index && step.details && (
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-64 bg-white rounded-lg shadow-lg border p-3 z-20">
                    <div className="text-sm">{step.details}</div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}