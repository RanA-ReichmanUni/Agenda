import React, { useEffect, useState, useRef } from 'react';
import { useTutorial } from '../context/TutorialContext';

export function TutorialOverlay() {
  const { isActive, currentStep, nextStep, prevStep, endTutorial, stepIndex, totalSteps } = useTutorial();
  const [position, setPosition] = useState<{ top: number; left: number; width?: number } | null>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset position when step changes to prevent ghosting/jumping
    setPosition(null);
    
    if (!isActive || !currentStep) return;

        const updatePosition = () => {
            const element = document.getElementById(currentStep.targetId);
            if (!element) return;

            const rect = element.getBoundingClientRect();
            const placement = currentStep.position || 'bottom';

            // Use viewport-relative coords directly (page is zoomed; overlay is in same zoomed context)
            let top = rect.bottom + 10; // default: below target
            let left = rect.left;

            if (placement === 'top') {
                top = rect.top - 10; // bubble translates up via CSS
            } else if (placement === 'right') {
                top = rect.top;
                left = rect.right + 10;
            } else if (placement === 'left') {
                top = rect.top;
                left = rect.left - 10;
            }

            // Basic vertical guard: if target is near top and placement is 'top', drop it below instead
            const bubbleHeight = 220; // rough
            if (placement === 'top' && top < bubbleHeight) {
                top = rect.bottom + 10;
            }

            // Clamp horizontally to viewport
            const bubbleWidth = 320;
            if (left + bubbleWidth > window.innerWidth) {
                left = window.innerWidth - bubbleWidth - 20;
            }
            if (left < 10) left = 10;

            setPosition({ top, left });

            // Keep target in view for context
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        };

    // Initial update
    const timer = setTimeout(updatePosition, 100); // Small delay to ensure DOM is ready
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [isActive, currentStep]);

  if (!isActive || !currentStep || !position) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Semi-transparent overlay mask - optional, maybe distracting
      <div className="absolute inset-0 bg-black bg-opacity-20" /> 
      */}

      {/* The Bubble */}
      <div 
        ref={bubbleRef}
        className="absolute transition-all duration-300 ease-in-out pointer-events-auto bg-white/95 backdrop-blur-sm p-6 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-blue-200 w-80 z-50"
        style={{ 
            top: position.top, 
            left: position.left,
            transform: currentStep.position === 'top' ? 'translateY(-100%)' : 
                       currentStep.position === 'left' ? 'translateX(-100%)' : 'none'
        }}
      >
        <div className="flex justify-between items-start mb-3">
            <h3 className="font-bold text-lg text-slate-800 tracking-tight">{currentStep.title}</h3>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full border border-blue-100">
                {stepIndex + 1} / {totalSteps}
            </span>
        </div>
        
        <p className="text-slate-600 mb-6 text-sm leading-relaxed">
            {currentStep.content}
        </p>

        <div className="flex justify-between items-center">
            <button 
                onClick={endTutorial}
                className="text-slate-400 hover:text-slate-600 text-sm font-medium transition-colors"
            >
                Skip
            </button>
            <div className="flex space-x-2">
                {stepIndex > 0 && (
                    <button 
                        onClick={prevStep}
                        className="px-3 py-1.5 rounded-lg border border-blue-100 text-blue-600 hover:bg-blue-50 text-sm font-semibold transition-colors"
                    >
                        Back
                    </button>
                )}
                <button 
                    onClick={nextStep}
                    className="px-4 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-semibold shadow-md shadow-blue-200 transition-all hover:shadow-lg"
                >
                    {stepIndex === totalSteps - 1 ? 'Finish' : 'Next'}
                </button>
            </div>
        </div>

        {/* Arrow (Visual only, simplified) */}
        <div 
            className={`absolute w-4 h-4 bg-white border-blue-200 transform rotate-45 ${
                currentStep.position === 'top' ? 'bottom-[-9px] border-b border-r border-t-0 border-l-0' :
                currentStep.position === 'right' ? 'left-[-9px] border-b-0 border-r-0 border-t-0 border-l-[1px] bg-transparent' : 
                'top-[-9px] left-8 border-t border-l border-b-0 border-r-0' // Default bottom
            }`}
        />
      </div>
    </div>
  );
}