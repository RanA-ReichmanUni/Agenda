"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

/**
 * Type representing an Agenda item from the backend.
 */
export interface Agenda {
  id: number;
  title: string;
  created_at: string;
}

/**
 * Shape of the agenda context
 */
interface AgendaContextType {
  agendas: Agenda[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// Initial undefined value
const AgendaContext = createContext<AgendaContextType | undefined>(undefined);

/**
 * Agenda Provider for the full list of agendas
 */
export const AgendaProvider = ({ children }: { children: React.ReactNode }) => {
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // מבצע שליפה מהשרת
  const fetchAgendas = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:4000/agendas');
      if (!res.ok) throw new Error('Failed to fetch agendas');
      const data = await res.json();
      // Set Agenda state, but map the sql database column of "created_at" to the object form "createdAt"
      setAgendas(
        data.map((agenda: any) => ({
          ...agenda,
          createdAt: new Date(agenda.created_at),
        }))
      );
      setError(null);
    } catch (err: any) {
      console.error('Agenda fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgendas();
  }, []);

  return (
    <AgendaContext.Provider value={{ agendas, loading, error, refetch: fetchAgendas }}>
      {children}
    </AgendaContext.Provider>
  );
};

/**
 * קריאה נוחה לקונטקסט - כולל בדיקת תקינות
 */
export const useAgendaContext = (): AgendaContextType => {
  const context = useContext(AgendaContext);
  if (!context) {
    throw new Error('useAgendaContext must be used within an AgendaProvider');
  }
  return context;
};
