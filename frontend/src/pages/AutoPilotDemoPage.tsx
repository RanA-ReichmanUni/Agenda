import React, { useEffect, useRef, useState } from 'react';
import { useAutoPilot } from '../context/AutoPilotContext';
import HomePage from './HomePage';

export default function AutoPilotDemoPage() {
  const { startAutoPilot, isRunning } = useAutoPilot();
  const [showStartingOverlay, setShowStartingOverlay] = useState(true);

  useEffect(() => {
    // Start the demo once on mount
    const timer = setTimeout(() => {
      // Clear tutorial seen flags so narration shows cleanly
      localStorage.removeItem('agenda_demo_tutorial_home');
      localStorage.removeItem('agenda_demo_tutorial_agenda');
      startAutoPilot();
      setShowStartingOverlay(false); // Hide overlay once demo starts
    }, 400);

    return () => clearTimeout(timer);
  }, []); // Empty deps - only run on mount

  return (
    <>
      <HomePage />
      {showStartingOverlay && !isRunning && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/10 backdrop-blur-sm pointer-events-none z-[9999]">
          <div className="bg-white/90 border border-purple-200 rounded-2xl shadow-2xl px-8 py-6 text-center">
            <div className="h-10 w-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-purple-900 font-semibold">Starting AutoPilot Demo...</p>
          </div>
        </div>
      )}
    </>
  );
}
