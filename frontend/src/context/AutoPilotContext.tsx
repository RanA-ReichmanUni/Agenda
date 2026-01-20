import React, { createContext, useContext, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTutorial } from './TutorialContext';
import { useDemo } from './DemoContext';
import { GHOST_NARRATION } from '../lib/tutorialSteps';

interface AutoPilotContextType {
  isRunning: boolean;
  startAutoPilot: () => void;
  stopAutoPilot: () => void;
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
  
  const navigate = useNavigate();
  const location = useLocation();
  const { endTutorial, showSingleBubble } = useTutorial();
  const { agendas } = useDemo();

  const waitForElement = (selector: string, timeout = 5000): Promise<Element> => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const checkElement = () => {
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

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const typeText = async (element: HTMLInputElement, text: string) => {
    element.focus();
    
    // Get the React internal instance to properly set value
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    )?.set;
    
    for (let i = 0; i < text.length; i++) {
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
      endTutorial(); // Close any existing tutorial
      await sleep(800);

      // Show welcome narration
      showSingleBubble(GHOST_NARRATION.welcome);
      await sleep(3000);

      if (!location.pathname.startsWith('/demo')) {
        setCurrentStatus('Navigating to demo...');
        navigate('/demo');
        await sleep(2500);
      }

      // Narrate: Creating agenda
      setCurrentStatus('Finding create form...');
      showSingleBubble(GHOST_NARRATION.createInput);
      const createInput = await waitForElement('#create-agenda-input') as HTMLInputElement;
      await highlightElement(createInput, 1500);
      
      setCurrentStatus('Typing agenda title...');
      await typeText(createInput, TARGET_AGENDA_TITLE);
      await sleep(1000);

      // Narrate: Submitting
      setCurrentStatus('Submitting agenda...');
      showSingleBubble(GHOST_NARRATION.submitAgenda);
      const submitButton = await waitForElement('#create-agenda-submit') as HTMLButtonElement;
      await highlightElement(submitButton, 1500);
      
      const form = submitButton.closest('form');
      if (form) {
        form.requestSubmit();
      } else {
        submitButton.click();
      }
      await sleep(2500);

      // Narrate: Opening agenda
      setCurrentStatus('Waiting for new agenda card...');
      showSingleBubble(GHOST_NARRATION.openAgenda);
      const agendaCard = await waitForElement(`[data-title="${TARGET_AGENDA_TITLE}"]`, 10000);
      await sleep(1500);

      setCurrentStatus('Opening agenda...');
      await highlightElement(agendaCard, 1500);
      const agendaLink = agendaCard.querySelector('a') as HTMLAnchorElement;
      if (agendaLink) {
        agendaLink.click();
      }
      await sleep(2500);

      // Add articles with narration
      for (let i = 0; i < ARTICLE_URLS.length; i++) {
        const isFirstArticle = i === 0;
        const typingDelay = isFirstArticle ? 80 : 25;
        const highlightDuration = isFirstArticle ? 1500 : 500;
        const pauseAfterTyping = isFirstArticle ? 1000 : 300;
        const addWaitTime = isFirstArticle ? 1000 : 500;
        
        // Show narration for first article, then show "building evidence" for rest
        if (isFirstArticle) {
          showSingleBubble(GHOST_NARRATION.addArticle);
        } else if (i === 1) {
          showSingleBubble(GHOST_NARRATION.moreArticles);
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
        }
        
        setCurrentStatus(`Fetching article ${i + 1}...`);
        const fetchButton = await waitForElement('#add-article-submit') as HTMLButtonElement;
        await highlightElement(fetchButton, highlightDuration);
        fetchButton.click();
        
        setCurrentStatus(`Waiting for article ${i + 1} data...`);
        const addButton = await waitForElement('#add-article-final-btn', 10000) as HTMLButtonElement;
        await sleep(isFirstArticle ? 500 : 150);
        
        // Narrate confirm for first article
        if (isFirstArticle) {
          showSingleBubble(GHOST_NARRATION.confirmArticle);
        }
        
        setCurrentStatus(`Adding article ${i + 1} to agenda...`);
        await highlightElement(addButton, highlightDuration);
        addButton.click();
        await sleep(addWaitTime);
      }

      // Narrate: AI Verification
      setCurrentStatus('All articles added! Preparing verification...');
      showSingleBubble(GHOST_NARRATION.verifyAgenda);
      await sleep(2000);
      
      const verifyButton = await waitForElement('#analyze-agenda-btn') as HTMLButtonElement;
      await highlightElement(verifyButton, 1500);
      await sleep(800);

      setCurrentStatus('Starting AI analysis...');
      verifyButton.click();
      await sleep(3500);

      // Narrate: Analysis complete
      setCurrentStatus('Analysis complete!');
      showSingleBubble(GHOST_NARRATION.analysisComplete);
      const closeAnalysisBtn = await waitForElement('#close-analysis-btn', 5000) as HTMLButtonElement;
      await highlightElement(closeAnalysisBtn, 1500);
      await sleep(800);
      closeAnalysisBtn.click();
      await sleep(1000);

      // Narrate: Share
      setCurrentStatus('Finding share button...');
      showSingleBubble(GHOST_NARRATION.shareAgenda);
      const shareButton = await waitForElement('#tutorial-share-button') as HTMLButtonElement;
      await highlightElement(shareButton, 1500);
      await sleep(1200);

      setCurrentStatus('Sharing agenda...');
      shareButton.click();
      await sleep(2500);

      // Narrate: Complete
      showSingleBubble(GHOST_NARRATION.complete);
      setCurrentStatus('Demo completed!');
      await sleep(4000);

      endTutorial();
      setIsRunning(false);
      setCurrentStatus('Idle');
      
    } catch (error: any) {
      console.error('AutoPilot error:', error);
      setCurrentStatus(`Error: ${error.message}`);
      endTutorial();
      setIsRunning(false);
      await sleep(3000);
      setCurrentStatus('Idle');
    }
  };

  const startAutoPilot = useCallback(() => {
    if (!isRunning) {
      setIsRunning(true);
      runScript();
    }
  }, [isRunning, navigate, location, endTutorial, agendas, showSingleBubble]);

  const stopAutoPilot = useCallback(() => {
    setIsRunning(false);
    setCurrentStatus('Stopped by user');
    setTimeout(() => setCurrentStatus('Idle'), 2000);
  }, []);

  return (
    <AutoPilotContext.Provider value={{ isRunning, startAutoPilot, stopAutoPilot, currentStatus }}>
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
      {isRunning && (
        <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
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
