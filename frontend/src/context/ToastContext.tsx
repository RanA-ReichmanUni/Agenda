import React, { createContext, useContext, useEffect, useState } from 'react';
import { API_ENDPOINTS, authFetch } from '../lib/api';



interface ToastContextType {
  showUndo: boolean; 
  undoDelete: (() => void) | null; 
  setShowUndo: (value:boolean) => void;
  setUndoDelete: (undoFunc: (() => void) | null) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

//children are the components that will be wrapped by the provider
export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [showUndo, setShowUndo] = useState<boolean>(false);
  const [undoDelete, setUndoDelete] = useState<(() => void) | null>(null);
 

  return (
    <ToastContext.Provider value={{ showUndo, setShowUndo, undoDelete, setUndoDelete }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToastContext = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
};
