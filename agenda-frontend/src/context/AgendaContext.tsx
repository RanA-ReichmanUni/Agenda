"use client"; // Required for using client-side hooks like useState and useContext in Next.js

import React, { createContext, useContext, useState } from "react";
import { Agenda } from "../lib/types"; // Importing the type definition for an Agenda item

// This interface defines the shape of the context value
interface AgendaContextType {
  agendas: Agenda[];                      // List of all created agendas
  setAgendas: React.Dispatch<React.SetStateAction<Agenda[]>>;   // Function to update agendas
  addAgenda: (agenda: Agenda) => void;   // Function to add a new agenda to the list
  removeAgenda: (agendaId: string) => void;
  removeArticle: (agendaId: string, articleId: string) => void;
}

// Create the context with an initial undefined value
const AgendaContext = createContext<AgendaContextType | undefined>(undefined);

// Provider component that wraps around the app and holds the agenda state globally
export const AgendaProvider = ({ children }: { children: React.ReactNode }) => {
  // Local state that holds the current list of agendas
  const [agendas, setAgendas] = useState<Agenda[]>([]);

  // Adds a new agenda to the existing list using the spread operator, which acts as a global state
  const addAgenda = (agenda: Agenda) => {
    setAgendas((prev) => [...prev, agenda]); // 'prev' holds the previous state (array of agendas)
  };

  const removeAgenda = (agendaId: string) => {
    setAgendas((prev) => prev.filter((a) => a.id !== agendaId));
  };

  const removeArticle = (agendaId: string, articleId: string) => {
    setAgendas((prev) =>
      prev.map((agenda) =>
        agenda.id === agendaId
          ? {
              ...agenda,
              articles: agenda.articles.filter((article) => article.id !== articleId),
            }
          : agenda
      )
    );
  };

  

  // Return the provider and pass the state + function to its children
  return (
    //Adds a context provider to the app, which allows all nested components to access the context
    <AgendaContext.Provider value={{ agendas, setAgendas, addAgenda, removeAgenda, removeArticle }}>
      {children} {/* All nested components inside this provider will have access to the context*/}
    </AgendaContext.Provider>
  );
};

// Custom React hook for accessing the agenda context easily
export const useAgenda = (): AgendaContextType => {
  const context = useContext(AgendaContext); // Access the context value
  if (!context) {
    throw new Error("useAgenda must be used within AgendaProvider"); // Safety check
  }
  return context;
};
