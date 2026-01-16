import React, { createContext, useContext, useEffect, useState } from 'react';
import { API_ENDPOINTS, authFetch } from '../lib/api';

export interface AgendaItem {
  id: number;
  title: string;
  created_at: string;
  createdAt?: Date;
}

interface AgendaContextType {
  agendas: AgendaItem[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const AgendaContext = createContext<AgendaContextType | undefined>(undefined);

export { AgendaContext }; // Export the context for optional usage

export const AgendaProvider = ({ children }: { children: React.ReactNode }) => {
  const [agendas, setAgendas] = useState<AgendaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgendas = async () => {
    setLoading(true);
    try {
      const res = await authFetch(API_ENDPOINTS.agendas);
      if (!res.ok) throw new Error('Failed to fetch agendas');
      const data = await res.json();
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

export const useAgendaContext = (): AgendaContextType => {
  const context = useContext(AgendaContext);
  if (!context) {
    throw new Error('useAgendaContext must be used within an AgendaProvider');
  }
  return context;
};
