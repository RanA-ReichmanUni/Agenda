import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTutorial } from './TutorialContext';
import { useDemo } from './DemoContext';
import { GHOST_NARRATION } from '../lib/tutorialSteps';

// Blocking overlay component that intercepts user clicks during ghost mode
function GhostModeBlocker({ onAttemptedInteraction }: { onAttemptedInteraction: () => void }) {
  const handleClick = (e: React.MouseEvent) => {
    // Allow clicks on the Stop Demo button and tutorial bubbles
    const target = e.target as HTMLElement;
    if (target.closest('.ghost-mode-controls') || target.closest('.ghost-tutorial-bubble')) {
      return; // Let the click through
    }
    
    e.preventDefault();
    e.stopPropagation();
    onAttemptedInteraction();
  };

  return (
    <div 
      className="fixed inset-0 z-[9990] cursor-not-allowed"
      onClick={handleClick}
      style={{ background: 'transparent' }}
    />
  );
}

interface AutoPilotContextType {
  isRunning: boolean;
  startAutoPilot: () => void;
  stopAutoPilot: () => void;
  speedUp: () => void;
  currentStatus: string;
}

const AutoPilotContext = createContext<AutoPilotContextType | undefined>(undefined);

export function useAutoPilot() {
  const context = useContext(AutoPilotContext);
  if (!context) {
    throw new Error('useAutoPilot must be used within AutoPilotProvider');
  }
  return context;
}

const TARGET_AGENDA_TITLE = "All Smartphones Are Bland and Boring";
const ARTICLE_URLS = [
  "https://gizmodo.com/smartphone-design-plateaued-in-2024-2000540663",
  "https://www.howtogeek.com/smartphones-are-boring-now-and-its-our-fault/",
  "https://www.techradar.com/phones/yes-many-flagship-phones-now-look-the-same-but-i-dont-think-its-a-bad-thing",
  "https://www.phonearena.com/news/Why-do-all-smartphones-look-the-same_id124123"
];

export function AutoPilotProvider({ children }: { children: React.ReactNode }) {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStatus, setCurrentStatus] = useState('Idle');
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const cancelledRef = useRef(false); // Track cancellation across async operations
  const currentSleepResolveRef = useRef<(() => void) | null>(null); // Ref to resolve current sleep early
  
  const navigate = useNavigate();
  const location = useLocation();
  const { endTutorial, showSingleBubble, setSuppressed, setGhostModeCompleted } = useTutorial();
  const { agendas } = useDemo();

  // Check if cancelled and throw to stop execution
  const checkCancelled = () => {
    if (cancelledRef.current) {
      throw new Error('CANCELLED');
    }
  };

  const waitForElement = (selector: string, timeout = 5000): Promise<Element> => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const checkElement = () => {
        if (cancelledRef.current) {
          reject(new Error('CANCELLED'));
          return;
        }
        const element = document.querySelector(selector);
        if (element) {
          resolve(element);
        } else if (Date.now() - startTime > timeout) {
          reject(new Error(`Timeout waiting for element: ${selector}`));
        } else {
          requestAnimationFrame(checkElement);
        }
      };
      
      checkElement();
    });
  };

  const sleep = (ms: number) => new Promise<void>((resolve, reject) => {
    console.log(`sleep(${ms}) called - setting up skip function`);
    
    const finish = () => {
      console.log('sleep finishing');
      currentSleepResolveRef.current = null;
      if (cancelledRef.current) {
        reject(new Error('CANCELLED'));
      } else {
        resolve();
      }
    };
    
    const timeoutId = setTimeout(finish, ms);
    
    // Store a function that skips this sleep when user clicks bubble
    currentSleepResolveRef.current = () => {
      console.log('Skip function called - clearing timeout and finishing early');
      clearTimeout(timeoutId);
      finish();
    };
  });

  const typeText = async (element: HTMLInputElement, text: string) => {
    element.focus();
    
    // Get the React internal instance to properly set value
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    )?.set;
    
    for (let i = 0; i < text.length; i++) {
      checkCancelled();
      const currentText = text.substring(0, i + 1);
      
      // Set value using native setter
      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(element, currentText);
      } else {
        element.value = currentText;
      }
      
      // Dispatch React-friendly input event
      const inputEvent = new Event('input', { bubbles: true });
      element.dispatchEvent(inputEvent);
      
      await sleep(100); // Slower typing for better visibility
    }
    
    // Final change event after typing completes
    element.dispatchEvent(new Event('change', { bubbles: true }));
  };

  const highlightElement = async (element: Element, duration: number = 1500) => {
    // Add rainbow border animation
    element.classList.add('autopilot-highlight');
    await sleep(duration);
    element.classList.remove('autopilot-highlight');
  };

  const runScript = async () => {
    try {
      setCurrentStatus('Starting demo...');
      setSuppressed(true); // Prevent auto-tutorials from interfering
      endTutorial(); // Close any existing tutorial
      await sleep(1500);

      // Show welcome narration - longer for user to read
      showSingleBubble(GHOST_NARRATION.welcome);
      await sleep(5000);

      const isDemoRoute = location.pathname.startsWith('/demo');
      const isAutoPilotRoute = location.pathname.startsWith('/auto-pilot-demo');
      if (!isDemoRoute && !isAutoPilotRoute) {
        setCurrentStatus('Navigating to demo...');
        navigate('/demo');
        await sleep(3000);
      }

      // Narrate: Creating agenda - give time to read
      setCurrentStatus('Finding create form...');
      showSingleBubble(GHOST_NARRATION.createInput);
      await sleep(3500); // Let user read the explanation
      const createInput = await waitForElement('#create-agenda-input') as HTMLInputElement;
      await highlightElement(createInput, 2000);
      
      setCurrentStatus('Typing agenda title...');
      await typeText(createInput, TARGET_AGENDA_TITLE);
      await sleep(1500);

      // Narrate: Submitting
      setCurrentStatus('Submitting agenda...');
      showSingleBubble(GHOST_NARRATION.submitAgenda);
      await sleep(2500); // Let user read
      const submitButton = await waitForElement('#create-agenda-submit') as HTMLButtonElement;
      await highlightElement(submitButton, 2000);
      
      const form = submitButton.closest('form');
      if (form) {
        form.requestSubmit();
      } else {
        submitButton.click();
      }
      await sleep(3000);

      // Narrate: Opening agenda
      setCurrentStatus('Waiting for new agenda card...');
      showSingleBubble(GHOST_NARRATION.openAgenda);
      await sleep(3000); // Let user read
      const agendaCard = await waitForElement(`[data-title="${TARGET_AGENDA_TITLE}"]`, 10000);
      await sleep(1500);

      setCurrentStatus('Opening agenda...');
      await highlightElement(agendaCard, 2000);
      const agendaLink = agendaCard.querySelector('a') as HTMLAnchorElement;
      if (agendaLink) {
        agendaLink.click();
      }
      await sleep(3000);

      // Add articles with narration
      for (let i = 0; i < ARTICLE_URLS.length; i++) {
        const isFirstArticle = i === 0;
        const typingDelay = isFirstArticle ? 60 : 20;
        const highlightDuration = isFirstArticle ? 2000 : 600;
        const pauseAfterTyping = isFirstArticle ? 1500 : 400;
        const addWaitTime = isFirstArticle ? 1500 : 600;
        
        // Show narration for first article, then show "building evidence" for rest
        if (isFirstArticle) {
          showSingleBubble(GHOST_NARRATION.addArticle);
          await sleep(3500); // Let user read the explanation
        } else if (i === 1) {
          showSingleBubble(GHOST_NARRATION.moreArticles);
          await sleep(2500);
        }
        
        setCurrentStatus(`Adding article ${i + 1} of ${ARTICLE_URLS.length}...`);
        const articleInput = await waitForElement('#add-article-url') as HTMLInputElement;
        if (isFirstArticle) {
          await highlightElement(articleInput, highlightDuration);
        }
        
        // Type URL
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value'
        )?.set;
        
        articleInput.focus();
        for (let j = 0; j < ARTICLE_URLS[i].length; j++) {
          const currentText = ARTICLE_URLS[i].substring(0, j + 1);
          if (nativeInputValueSetter) {
            nativeInputValueSetter.call(articleInput, currentText);
          } else {
            articleInput.value = currentText;
          }
          const inputEvent = new Event('input', { bubbles: true });
          articleInput.dispatchEvent(inputEvent);
          await sleep(typingDelay);
        }
        articleInput.dispatchEvent(new Event('change', { bubbles: true }));
        await sleep(pauseAfterTyping);

        // Narrate fetch for first article
        if (isFirstArticle) {
          showSingleBubble(GHOST_NARRATION.fetchArticle);
          await sleep(2500); // Let user read
        }
        
        setCurrentStatus(`Fetching article ${i + 1}...`);
        const fetchButton = await waitForElement('#add-article-submit') as HTMLButtonElement;
        await highlightElement(fetchButton, highlightDuration);
        fetchButton.click();
        
        setCurrentStatus(`Waiting for article ${i + 1} data...`);
        const addButton = await waitForElement('#add-article-final-btn', 10000) as HTMLButtonElement;
        await sleep(isFirstArticle ? 800 : 200);
        
        // Narrate confirm for first article
        if (isFirstArticle) {
          showSingleBubble(GHOST_NARRATION.confirmArticle);
          await sleep(2500); // Let user read
        }
        
        setCurrentStatus(`Adding article ${i + 1} to agenda...`);
        await highlightElement(addButton, highlightDuration);
        addButton.click();
        await sleep(addWaitTime);
      }

      // Narrate: AI Verification
      setCurrentStatus('All articles added! Preparing verification...');
      showSingleBubble(GHOST_NARRATION.verifyAgenda);
      await sleep(4000); // Let user read
      
      const verifyButton = await waitForElement('#analyze-agenda-btn') as HTMLButtonElement;
      await highlightElement(verifyButton, 2000);
      await sleep(1000);

      setCurrentStatus('Starting AI analysis...');
      verifyButton.click();
      endTutorial(); // Dismiss the bubble so it doesn't block the analysis modal
      await sleep(4000);

      // Narrate: Analysis complete
      setCurrentStatus('Analysis complete!');
      showSingleBubble(GHOST_NARRATION.analysisComplete);
      await sleep(3500); // Let user read
      const closeAnalysisBtn = await waitForElement('#close-analysis-btn', 5000) as HTMLButtonElement;
      await highlightElement(closeAnalysisBtn, 2000);
      await sleep(1000);
      closeAnalysisBtn.click();
      await sleep(1500);

      // Narrate: Share
      setCurrentStatus('Finding share button...');
      showSingleBubble(GHOST_NARRATION.shareAgenda);
      await sleep(3500); // Let user read
      const shareButton = await waitForElement('#tutorial-share-button') as HTMLButtonElement;
      await highlightElement(shareButton, 2000);
      await sleep(1500);

      setCurrentStatus('Sharing agenda...');
      shareButton.click();
      await sleep(4000); // Let user see the share modal with the link

      // Close share modal
      setCurrentStatus('Closing share modal...');
      const closeShareBtn = await waitForElement('#close-share-modal-btn', 5000) as HTMLButtonElement;
      await highlightElement(closeShareBtn, 1500);
      closeShareBtn.click();
      await sleep(1500);

      // Narrate: Complete - Final invitation message (after modal is closed)
      showSingleBubble(GHOST_NARRATION.complete);
      setCurrentStatus('🎉 Tour Complete!');
      await sleep(8000); // Let user read the final invitation message

      endTutorial();
      setIsRunning(false);
      setCurrentStatus('Idle');
      setSuppressed(false); // Re-enable suppression flag
      setGhostModeCompleted(true); // Mark ghost mode as completed - this persists
      
    } catch (error: any) {
      // Handle cancellation gracefully
      if (error.message === 'CANCELLED') {
        console.log('AutoPilot cancelled by user');
        endTutorial();
        setSuppressed(false);
        setGhostModeCompleted(true); // Mark ghost mode as completed even if stopped
        return;
      }
      console.error('AutoPilot error:', error);
      setCurrentStatus(`Error: ${error.message}`);
      endTutorial();
      setIsRunning(false);
      setSuppressed(false);
      setGhostModeCompleted(true); // Mark ghost mode as completed even on error
      await sleep(3000);
      setCurrentStatus('Idle');
    }
  };

  const startAutoPilot = useCallback(() => {
    if (!isRunning) {
      cancelledRef.current = false; // Reset cancellation flag
      setIsRunning(true);
      runScript();
    }
  }, [isRunning, navigate, location, endTutorial, agendas, showSingleBubble, setSuppressed]);

  const stopAutoPilot = useCallback(() => {
    cancelledRef.current = true; // Signal cancellation to running script
    setIsRunning(false);
    endTutorial();
    setCurrentStatus('Stopped by user');
    setWarningMessage(null); // Clear any warning
    setTimeout(() => setCurrentStatus('Idle'), 2000);
  }, [endTutorial]);

  // Skip current wait when user clicks bubble
  const speedUp = useCallback(() => {
    console.log('speedUp called, currentSleepResolveRef:', currentSleepResolveRef.current);
    if (currentSleepResolveRef.current) {
      console.log('Resolving sleep early!');
      currentSleepResolveRef.current();
      setWarningMessage('⚡ Skipping ahead...');
      setTimeout(() => setWarningMessage(null), 800);
    } else {
      console.log('No active sleep to skip');
    }
  }, []);

  // Show warning when user tries to interact during ghost mode
  const handleAttemptedInteraction = useCallback(() => {
    setWarningMessage('⚠️ Interaction disabled during Auto-Pilot. Click "Stop Demo" to take control.');
    // Auto-hide after 3 seconds
    setTimeout(() => setWarningMessage(null), 3000);
  }, []);

  return (
    <AutoPilotContext.Provider value={{ isRunning, startAutoPilot, stopAutoPilot, speedUp, currentStatus }}>
      {children}
      <style>{`
        @keyframes autopilot-rainbow {
          0% { box-shadow: 0 0 0 4px rgba(255, 0, 0, 0.8), 0 0 25px rgba(255, 0, 0, 0.4); }
          16% { box-shadow: 0 0 0 4px rgba(255, 127, 0, 0.8), 0 0 25px rgba(255, 127, 0, 0.4); }
          33% { box-shadow: 0 0 0 4px rgba(255, 255, 0, 0.8), 0 0 25px rgba(255, 255, 0, 0.4); }
          50% { box-shadow: 0 0 0 4px rgba(0, 255, 0, 0.8), 0 0 25px rgba(0, 255, 0, 0.4); }
          66% { box-shadow: 0 0 0 4px rgba(0, 0, 255, 0.8), 0 0 25px rgba(0, 0, 255, 0.4); }
          83% { box-shadow: 0 0 0 4px rgba(139, 0, 255, 0.8), 0 0 25px rgba(139, 0, 255, 0.4); }
          100% { box-shadow: 0 0 0 4px rgba(255, 0, 0, 0.8), 0 0 25px rgba(255, 0, 0, 0.4); }
        }
        .autopilot-highlight {
          animation: autopilot-rainbow 3s ease-in-out infinite !important;
          border-radius: 0.75rem !important;
          position: relative;
          z-index: 9998 !important;
        }
      `}</style>
      
      {/* Blocker overlay to prevent user interaction during ghost mode */}
      {isRunning && <GhostModeBlocker onAttemptedInteraction={handleAttemptedInteraction} />}
      
      {/* Warning message when user tries to interact */}
      {warningMessage && (
        <div className="fixed bottom-28 left-0 right-0 z-[10000] flex justify-center animate-bounce">
          <div className="bg-yellow-500 text-yellow-900 px-6 py-3 rounded-xl shadow-2xl font-semibold text-center border-2 border-yellow-600">
            {warningMessage}
          </div>
        </div>
      )}
      
      {isRunning && (
        <div className="ghost-mode-controls fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
          <div className="bg-purple-600 text-white px-4 py-2 rounded-lg shadow-xl">
            <div className="flex items-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div>
              <span className="font-semibold">{currentStatus}</span>
            </div>
          </div>
          <button
            onClick={stopAutoPilot}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-xl font-semibold transition"
          >
            Stop Demo
          </button>
        </div>
      )}
    </AutoPilotContext.Provider>
  );
}
