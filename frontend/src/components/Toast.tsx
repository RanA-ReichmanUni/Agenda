import React, { useState } from "react";
import { useToastContext } from "../context/ToastContext";

export default function ShowToast() {
  const { showUndo, undoDelete, setShowUndo } = useToastContext();

  if (!showUndo) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded shadow-lg z-50 animate-fade-in">
      <div className="flex items-center space-x-4">
        <span>Item Deleted</span>
        {undoDelete && (
          <button onClick={undoDelete} className="text-blue-400 hover:text-blue-300 hover:underline font-medium">
            Undo
          </button>
        )}
        <button 
            onClick={() => setShowUndo(false)} 
            className="text-gray-400 hover:text-white transition-colors p-1"
            title="Dismiss"
        >
            ✕
        </button>
      </div>
    </div>
  );
}