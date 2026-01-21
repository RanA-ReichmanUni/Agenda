import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { TutorialStep } from '../lib/tutorialSteps';

interface TutorialContextType {
  isActive: boolean;
  currentStep: TutorialStep | null;
  stepIndex: number;
  totalSteps: number;
  startTutorial: (steps: TutorialStep[], key?: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  endTutorial: () => void;
  hasSeenTutorial: (key: string) => boolean;
  isSuppressed: boolean;
  setSuppressed: (value: boolean) => void;
  showSingleBubble: (step: TutorialStep) => void; // Ghost-controlled single bubble
  isGhostControlled: boolean;
  ghostModeCompleted: boolean; // True after ghost tour finishes - suppresses tutorials permanently
  setGhostModeCompleted: (value: boolean) => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export function TutorialProvider({ children }: { children: React.ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [steps, setSteps] = useState<TutorialStep[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const location = useLocation();
  const isDemo = location.pathname.startsWith('/demo');
  const [isSuppressed, setSuppressed] = useState(false);
  const [isGhostControlled, setIsGhostControlled] = useState(false);
  const [ghostModeCompleted, setGhostModeCompleted] = useState(false);

  const [currentKey, setCurrentKey] = useState<string>('');

  // Ghost-controlled single bubble - shows one step at a time, controlled by AutoPilot
  const showSingleBubble = useCallback((step: TutorialStep) => {
    setSteps([step]);
    setStepIndex(0);
    setIsActive(true);
    setIsGhostControlled(true);
    setCurrentKey('ghost');
  }, []);

  const startTutorial = useCallback((newSteps: TutorialStep[], key: string = 'default') => {
    if (isSuppressed) return;
    if (newSteps.length > 0) {
      setSteps(newSteps);
      setStepIndex(0);
      setIsActive(true);
      setCurrentKey(key);
    }
  }, [isSuppressed]);

  const endTutorial = useCallback(() => {
    setIsActive(false);
    setSteps([]);
    setStepIndex(0);
    setIsGhostControlled(false);
    // Mark as seen in local storage (persistent across sessions)
    if (isDemo && currentKey && currentKey !== 'ghost') {
        localStorage.setItem(`agenda_demo_tutorial_${currentKey}`, 'true');
    }
    setCurrentKey('');
  }, [isDemo, currentKey]);

  const nextStep = useCallback(() => {
    setStepIndex(prev => {
        if (prev < steps.length - 1) {
            return prev + 1;
        } else {
            // Can't call endTutorial here directly because it's a side effect in a state setter? 
            // Better to check outside or use effect. 
            // But for now, let's keep logic simple.
            // Actually, we can just defer the endTutorial call or keep the logic as is but need dependencies.
            return prev;
        }
    });
    // The previous logic was:
    // if (stepIndex < steps.length - 1) ...
    // This requires stepIndex dep.
  }, [steps.length]); 

  // Let's rewrite nextStep to be cleaner and depend on stepIndex so `nextStep` changes, but `startTutorial` remains stable.
  // The issue is `startTutorial` causing the restart loop.
  
  // Re-implementing functions purely to support the stable `startTutorial`
  const nextStepAction = useCallback(() => {
    setStepIndex(prev => {
        if (prev < steps.length - 1) return prev + 1;
        return prev; 
    });
     // We need to handle the "End" case. 
     // If we are at the last step, we want to call endTutorial.
     // It's cleaner to handle this in a separate check or just referencing state.
     if (stepIndex >= steps.length - 1) {
         endTutorial();
     }
  }, [stepIndex, steps.length, endTutorial]);

  const prevStepAction = useCallback(() => {
    if (stepIndex > 0) {
      setStepIndex(prev => prev - 1);
    }
  }, [stepIndex]);

  const hasSeenTutorial = useCallback((key: string) => {
      // Check local storage.
      return localStorage.getItem(`agenda_demo_tutorial_${key}`) === 'true';
  }, []);

  // Auto-close if route changes to avoid stuck bubbles
  useEffect(() => {
    setIsActive(false); 
    // We let the pages themselves trigger the tutorial if appropriate
  }, [location.pathname]);

  const value = useMemo(() => ({
      isActive, 
      currentStep: isActive && steps[stepIndex] ? steps[stepIndex] : null,
      stepIndex,
      totalSteps: steps.length,
      startTutorial, 
      nextStep: nextStepAction, 
      prevStep: prevStepAction,
      endTutorial,
      hasSeenTutorial,
      isSuppressed,
      setSuppressed,
      showSingleBubble,
      isGhostControlled,
      ghostModeCompleted,
      setGhostModeCompleted
  }), [isActive, steps, stepIndex, startTutorial, nextStepAction, prevStepAction, endTutorial, hasSeenTutorial, isSuppressed, showSingleBubble, isGhostControlled, ghostModeCompleted]);

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  );
}

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
};