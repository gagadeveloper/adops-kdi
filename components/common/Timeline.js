'use client';

import { useState } from 'react';
import StatusBadge from './StatusBadge';

export default function Timeline({ steps, currentStep }) {
  const [expandedStep, setExpandedStep] = useState(null);

  const toggleExpand = (index) => {
    if (expandedStep === index) {
      setExpandedStep(null);
    } else {
      setExpandedStep(index);
    }
  };

  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
      
      <ul className="relative space-y-4">
        {steps.map((step, index) => {
          const isActive = index <= currentStep;
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          
          return (
            <li key={index} className="relative pl-10">
              <div className={`absolute left-0 rounded-full border-4 border-white shadow-sm h-8 w-8 flex items-center justify-center ${
                isCompleted ? 'bg-green-500' : isCurrent ? 'bg-blue-500' : 'bg-gray-200'
              }`}>
                {isCompleted ? (
                  <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                ) : (
                  <span className="text-sm font-semibold text-white">{index + 1}</span>
                )}
              </div>
              
              <div 
                className={`rounded-lg border ${isCurrent ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white'} p-4 cursor-pointer transition-all hover:shadow-md`}
                onClick={() => toggleExpand(index)}
              >
                <div className="flex items-center justify-between">
                  <h3 className={`font-semibold ${isActive ? 'text-gray-800' : 'text-gray-400'}`}>
                    {step.title}
                  </h3>
                  <StatusBadge status={step.status} />
                </div>
                
                {expandedStep === index && step.details && (
                  <div className="mt-3 pt-3 border-t">
                    {step.details}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}