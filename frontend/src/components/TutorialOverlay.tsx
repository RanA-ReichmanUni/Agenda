import React, { useEffect, useState, useRef } from 'react';
import { useTutorial } from '../context/TutorialContext';

export function TutorialOverlay() {
  const { isActive, currentStep, nextStep, prevStep, endTutorial, stepIndex, totalSteps } = useTutorial();
  const [position, setPosition] = useState<{ top: number; left: number; placement: string } | null>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset position when step changes to prevent ghosting/jumping
    setPosition(null);
    
    if (!isActive || !currentStep) return;

        const updatePosition = () => {
            const element = document.getElementById(currentStep.targetId);
            if (!element) return;

            const rect = element.getBoundingClientRect();
            // Default to 'bottom' if not specified
            let placement = currentStep.position || 'bottom';
            
            // ZOOM CORRECTION:
            // The global zoom: 0.8 on html means fixed elements are also scaled.
            // getBoundingClientRect returns visual viewport pixels.
            // We must divide by 0.8 to convert visual pixels to the CSS pixel value needed for the fix element.
            const zoomFactor = 0.8;
            
            const rTop = rect.top / zoomFactor;
            const rBottom = rect.bottom / zoomFactor;
            const rLeft = rect.left / zoomFactor;
            const rRight = rect.right / zoomFactor;

            // Initial calculation
            let top = rBottom + 10; 
            let left = rLeft;

            if (placement === 'top') {
                top = rTop - 10; 
            } else if (placement === 'right') {
                top = rTop;
                left = rRight + 10;
            } else if (placement === 'left') {
                top = rTop;
                left = rLeft - 10;
            }

            // Auto-Flip Vertical Logic
            // If placed top but too close to edge, move to bottom
            const bubbleHeightApprox = 250;
            if (placement === 'top' && top < bubbleHeightApprox) {
                placement = 'bottom';
                top = rBottom + 10;
            }
            // If placed bottom but too low? (Handling bottom overflow is harder as we don't know window height perfectly in scaled space, but top is more critical)

            // Clamp Horizontally
            const bubbleWidth = 320; 
            // Available width in CSS pixels
            const windowWidth = window.innerWidth / zoomFactor; 
            
            if (left + bubbleWidth > windowWidth) {
                left = windowWidth - bubbleWidth - 20;
            }
            if (left < 10) left = 10;

            setPosition({ top, left, placement });

            // Keep target in view
            // Use block: 'start' or 'nearest' to avoid centering large elements which pushes them out of top view
            element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        };

    // Initial update
    const timer = setTimeout(updatePosition, 100); 
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [isActive, currentStep]);

  if (!isActive || !currentStep || !position) return null;

  // Use the calculated placement or fallback
  const finalPlacement = position.placement;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* The Bubble */}
      <div 
        ref={bubbleRef}
        className="absolute transition-all duration-300 ease-in-out pointer-events-auto bg-white/95 backdrop-blur-sm p-6 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-blue-200 w-80 z-50"
        style={{ 
            top: position.top, 
            left: position.left,
            transform: finalPlacement === 'top' ? 'translateY(-100%)' : 
                       finalPlacement === 'left' ? 'translateX(-100%)' : 'none'
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
                finalPlacement === 'top' ? 'bottom-[-9px] border-b border-r border-t-0 border-l-0' :
                finalPlacement === 'right' ? 'left-[-9px] border-b-0 border-r-0 border-t-0 border-l-[1px] bg-transparent' : 
                'top-[-9px] left-8 border-t border-l border-b-0 border-r-0' // Default bottom
            }`}
        />
      </div>
    </div>
  );
}