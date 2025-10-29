
import React from 'react';

interface OnboardingProgressProps {
    currentStep: number;
}

const progressSteps = [
  { step: 1, label: "INITIATE SETUP" },
  { step: 2, label: "CONNECT BRAND INTELLIGENCE" },
  { step: 3, label: "DEFINE BRAND PERSONA" },
  { step: 4, label: "CONFIGURE WORKFLOWS" },
];


export const OnboardingProgress: React.FC<OnboardingProgressProps> = ({ currentStep }) => {
    return (
        <div className="w-full md:w-1/3 font-mono text-sm text-[#B2D3DE]">
            <p className="text-[#71C9C5]">SYSTEM BOOT SEQUENCE...</p>
            <div className="mt-2 pl-2 border-l-2 border-[#71C9C5]/30">
                {progressSteps.map(({ step: stepNumber, label }) => {
                    const isComplete = currentStep > stepNumber;
                    const isActive = currentStep === stepNumber;
                    
                    let textColor = 'text-[#575757]'; // Pending
                    if (isActive) textColor = 'text-[#FACA78] text-glow';
                    if (isComplete) textColor = 'text-green-400';

                    return (
                        <div key={label} className={`flex items-center transition-all duration-300 ${textColor}`}>
                            {isComplete ? (
                                <span className="mr-2">[OK]</span>
                            ) : (
                                <span className="mr-2">{isActive ? '>' : ' '}</span>
                            )}
                            <p>{label}</p>
                            {isActive && <span className="blinking-cursor ml-1">▋</span>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
