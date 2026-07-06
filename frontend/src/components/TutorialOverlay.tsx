import React, { useEffect, useState, useRef } from 'react';
import { useTutorial } from '../context/TutorialContext';
import { useAutoPilot } from '../context/AutoPilotContext';

export function TutorialOverlay() {
  const { isActive, currentStep, nextStep, prevStep, endTutorial, stepIndex, totalSteps, isGhostControlled } = useTutorial();
  const { isRunning: isAutoPilotRunning, speedUp } = useAutoPilot();
  const [position, setPosition] = useState<{ top: number; left: number; placement: string; arrowLeft?: number } | null>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset position when step changes to prevent ghosting/jumping
    setPosition(null);
    
    if (!isActive || !currentStep) return;

        const updatePosition = (shouldScroll: boolean) => {
            const element = document.getElementById(currentStep.targetId);
            if (!element) return;

            // On step entry, force-scroll target to center so bubbles never open off-screen.
            const shouldSmoothScroll = stepIndex > 0;
            if (shouldScroll) {
              element.scrollIntoView({
                behavior: shouldSmoothScroll ? 'smooth' : 'auto',
                block: 'center',
                inline: 'nearest',
              });
            }

          const applyPosition = () => {
                const rect = element.getBoundingClientRect();
                // Default to 'bottom' if not specified
                let placement = currentStep.position || 'bottom';
                
                // Get the actual zoom level from the document
                const zoomFactor = parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
                
                const rTop = rect.top / zoomFactor;
                const rLeft = rect.left / zoomFactor;
                const rRight = rect.right / zoomFactor;
                const rWidth = rect.width / zoomFactor;
                const rHeight = rect.height / zoomFactor;

                // For large targets (like article grids), anchor to the top segment
                // so bubbles don't follow the last item off-screen.
                const anchorBottom = rTop + Math.min(rHeight, 140);

                // When AutoPilot is running, position bubbles further away to avoid blocking rainbow highlights
                const offset = isAutoPilotRunning ? 30 : 10;
                const bubbleWidth = isGhostControlled ? 420 : 320;

                // Initial calculation
                let top = anchorBottom + offset;
                let left = rLeft + (rWidth - bubbleWidth) / 2;

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
                    top = anchorBottom + offset;
                }

                // Clamp Horizontally
                const windowWidth = window.innerWidth / zoomFactor; 
                const windowHeight = window.innerHeight / zoomFactor;
                
                // If the bubble is placed to the left, its actual bounds are [left - bubbleWidth, left]
                // For top/bottom/right, bounds are [left, left + bubbleWidth]
                if (placement === 'left') {
                    if (left - bubbleWidth < 10) {
                        left = bubbleWidth + 10;
                    }
                } else {
                    if (left + bubbleWidth > windowWidth) {
                        left = windowWidth - bubbleWidth - 20;
                    }
                    if (left < 10) left = 10;
                }

                // Clamp Vertically to keep bubble reachable in viewport.
                if (top + bubbleHeightApprox > windowHeight - 10) {
                    top = Math.max(10, windowHeight - bubbleHeightApprox - 10);
                }
                if (top < 10) top = 10;

                // Dynamically calculate arrow position for top/bottom placements
                const targetCenter = rLeft + rWidth / 2;
                let arrowLeft = targetCenter - left;
                // Keep the arrow within the bubble bounds
                arrowLeft = Math.max(20, Math.min(bubbleWidth - 20, arrowLeft));

                setPosition({ top, left, placement, arrowLeft });
            };

            // Keep the first bubble snappy; allow short delay for smooth-scroll steps.
            const positionDelay = shouldScroll && shouldSmoothScroll ? 170 : 0;
            if (positionDelay === 0) {
              applyPosition();
              return;
            }

            const scrollTimer = setTimeout(applyPosition, positionDelay);
            
            return scrollTimer;
        };

    // Initial update
    const initialTimer = setTimeout(() => updatePosition(true), 0);
    const timers: ReturnType<typeof setTimeout>[] = [initialTimer];
    
    // Wrapper for event handlers to collect returned timers
    const updatePositionWithTracking = () => {
      const scrollTimer = updatePosition(false);
      if (scrollTimer) timers.push(scrollTimer);
    };
    
    window.addEventListener('resize', updatePositionWithTracking);
    window.addEventListener('scroll', updatePositionWithTracking);

    return () => {
      timers.forEach(t => clearTimeout(t));
      window.removeEventListener('resize', updatePositionWithTracking);
      window.removeEventListener('scroll', updatePositionWithTracking);
    };
  }, [isActive, currentStep, isAutoPilotRunning, isGhostControlled, stepIndex]);

  if (!isActive || !currentStep || !position) return null;

  // Use the calculated placement or fallback
  const finalPlacement = position.placement;

  // Ghost mode uses larger, more prominent styling; demo mode keeps classic sizing and controls
  const isGhostMode = isGhostControlled;

  const handleBubbleClick = () => {
    if (isGhostMode) {
      console.log('Bubble clicked - calling speedUp');
      speedUp();
    }
  };

  return (
    <div className={`fixed top-0 left-0 w-screen h-screen pointer-events-none ${isGhostMode ? 'z-[9995]' : 'z-50'}`}>
      {/* The Bubble */}
      <div 
        ref={bubbleRef}
        onClick={handleBubbleClick}
        className={`ghost-tutorial-bubble absolute transition-all duration-300 ease-in-out pointer-events-auto backdrop-blur-sm rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] ${
          isGhostMode 
            ? 'bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-300 p-8 w-[420px] cursor-pointer hover:border-purple-400 hover:shadow-purple-200/50' 
            : 'bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 border border-blue-700/50 p-6 w-80 z-50 shadow-2xl shadow-blue-900/40 text-white'
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
                : 'text-lg text-white'
            }`}>{currentStep.title}</h3>
            {!isGhostMode && (
              <span className="text-xs font-bold text-blue-100 bg-white/10 px-2 py-1 rounded-full border border-white/20">
                {stepIndex + 1} / {totalSteps}
              </span>
            )}
        </div>
        
        <p
          className={`leading-relaxed ${
            isGhostMode 
              ? 'text-xl text-purple-900 font-semibold' 
              : 'text-blue-100 text-sm'
          }`}
          dangerouslySetInnerHTML={{ __html: currentStep.content }}
        />

          {/* Speed up hint in ghost mode */}
          {isGhostMode && (
            <div className="mt-4 text-center text-sm text-purple-500 opacity-75">
              (Auto Progress - Click bubble to speed up)
            </div>
          )}

          {/* Controls only in manual demo mode */}
          {!isGhostMode && (
            <div className="flex justify-between items-center mt-6">
            <button 
              onClick={endTutorial}
              className="text-blue-300 hover:text-white text-sm font-medium transition-colors"
            >
              Skip
            </button>
            <div className="flex space-x-2">
              {stepIndex > 0 && (
                <button 
                  onClick={prevStep}
                  className="px-3 py-1.5 rounded-lg border border-white/20 text-blue-100 hover:bg-white/10 text-sm font-semibold transition-colors"
                >
                  Back
                </button>
              )}
              <button 
                onClick={nextStep}
                className="px-4 py-1.5 rounded-lg bg-white text-blue-900 hover:bg-blue-50 text-sm font-bold shadow-md transition-all hover:shadow-lg"
              >
                {stepIndex === totalSteps - 1 ? 'Finish' : 'Next'}
              </button>
            </div>
            </div>
          )}

        {/* Arrow (Visual only, simplified) */}
          {!isGhostMode && (
          <div 
              className={`absolute w-4 h-4 transform rotate-45 ${
                  finalPlacement === 'top' ? 'bottom-[-9px] border-b border-r border-t-0 border-l-0 bg-indigo-900 border-blue-700/50' :
                  finalPlacement === 'right' ? 'left-[-9px] top-6 border-b border-l border-t-0 border-r-0 bg-blue-900 border-blue-700/50' : 
                  finalPlacement === 'left' ? 'right-[-9px] bottom-10 border-t border-r border-b-0 border-l-0 bg-indigo-900 border-blue-700/50' : 
                  'top-[-9px] border-t border-l border-b-0 border-r-0 bg-blue-900 border-blue-700/50'
              }`}
              style={{
                left: (finalPlacement === 'top' || finalPlacement === 'bottom') && position.arrowLeft ? `${position.arrowLeft}px` : undefined,
                marginLeft: (finalPlacement === 'top' || finalPlacement === 'bottom') && position.arrowLeft ? '-8px' : undefined
              }}
          />
        )}
      </div>
    </div>
  );
}