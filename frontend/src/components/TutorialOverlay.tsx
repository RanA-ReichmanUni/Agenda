import React, { useEffect, useState, useRef } from 'react';
import { useTutorial } from '../context/TutorialContext';
import { useAutoPilot } from '../context/AutoPilotContext';

export function TutorialOverlay() {
  const { isActive, currentStep, nextStep, prevStep, endTutorial, stepIndex, totalSteps, isGhostControlled } = useTutorial();
  const { isRunning: isAutoPilotRunning } = useAutoPilot();
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

            // When AutoPilot is running, position bubbles further away to avoid blocking rainbow highlights
            const offset = isAutoPilotRunning ? 30 : 10;

            // Initial calculation
            let top = rBottom + offset; 
            let left = rLeft;

            if (placement === 'top') {
                top = rTop - offset; 
            } else if (placement === 'right') {
                top = rTop;
                left = rRight + offset;
            } else if (placement === 'left') {
                top = rTop;
                left = rLeft - offset;
            }

            // Auto-Flip Vertical Logic
            // If placed top but too close to edge, move to bottom
            const bubbleHeightApprox = 250;
            if (placement === 'top' && top < bubbleHeightApprox) {
                placement = 'bottom';
                top = rBottom + offset;
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

  // Auto-dismiss after 3 seconds (only for non-ghost-controlled tutorials)
  useEffect(() => {
    if (!isActive || !currentStep || isGhostControlled) return;
    
    const dismissTimer = setTimeout(() => {
      nextStep();
    }, 3000);

    return () => clearTimeout(dismissTimer);
  }, [isActive, currentStep, nextStep, isGhostControlled]);

  if (!isActive || !currentStep || !position) return null;

  // Use the calculated placement or fallback
  const finalPlacement = position.placement;

  // Ghost mode uses larger, more prominent styling
  const isGhostMode = isGhostControlled;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* The Bubble */}
      <div 
        ref={bubbleRef}
        className={`absolute transition-all duration-300 ease-in-out pointer-events-auto backdrop-blur-sm rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] z-50 ${
          isGhostMode 
            ? 'bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-300 p-8 w-[420px]' 
            : 'bg-white/95 border border-blue-200 p-6 w-80'
        }`}
        style={{ 
            top: position.top, 
            left: position.left,
            transform: finalPlacement === 'top' ? 'translateY(-100%)' : 
                       finalPlacement === 'left' ? 'translateX(-100%)' : 'none'
        }}
      >
        <div className={`flex justify-between items-start ${isGhostMode ? 'mb-4' : 'mb-3'}`}>
            <h3 className={`font-bold tracking-tight ${
              isGhostMode 
                ? 'text-2xl text-purple-800' 
                : 'text-lg text-slate-800'
            }`}>{currentStep.title}</h3>
            {!isGhostMode && (
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full border border-blue-100">
                  {stepIndex + 1} / {totalSteps}
              </span>
            )}
        </div>
        
        <p className={`leading-relaxed ${
          isGhostMode 
            ? 'text-lg text-purple-900 font-medium' 
            : 'text-slate-600 text-sm'
        }`}>
            {currentStep.content}
        </p>

        {/* Arrow (Visual only, simplified) */}
        {!isGhostMode && (
          <div 
              className={`absolute w-4 h-4 bg-white border-blue-200 transform rotate-45 ${
                  finalPlacement === 'top' ? 'bottom-[-9px] border-b border-r border-t-0 border-l-0' :
                  finalPlacement === 'right' ? 'left-[-9px] border-b-0 border-r-0 border-t-0 border-l-[1px] bg-transparent' : 
                  'top-[-9px] left-8 border-t border-l border-b-0 border-r-0'
              }`}
          />
        )}
      </div>
    </div>
  );
}