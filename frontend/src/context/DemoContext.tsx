import React, { createContext, useContext, useState, ReactNode } from 'react';
import { DemoAgenda, INITIAL_DEMO_AGENDAS, DEMO_USER } from '../data/demoData';
import { Article } from '../lib/types';

interface DemoContextType {
  user: typeof DEMO_USER;
  agendas: DemoAgenda[];
  addAgenda: (title: string) => Promise<void>;
  deleteAgenda: (id: number) => Promise<void>;
  createArticle: (agendaId: number, article: Omit<Article, "id" | "created_at" | "agenda_id">) => Promise<Article>;
  deleteArticle: (agendaId: number, articleId: number) => Promise<void>;
  getAgenda: (id: number) => DemoAgenda | undefined;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [agendas, setAgendas] = useState<DemoAgenda[]>(INITIAL_DEMO_AGENDAS);

  const addAgenda = async (title: string) => {
    const newAgenda: DemoAgenda = {
      id: Date.now(),
      title,
      created_at: new Date().toISOString(),
      articles: []
    };
    setAgendas(prev => [newAgenda, ...prev]);
  };

  const deleteAgenda = async (id: number) => {
    setAgendas(prev => prev.filter(a => a.id !== id));
  };

  const createArticle = async (agendaId: number, articleData: Omit<Article, "id" | "created_at" | "agenda_id">) => {
    const newArticle: Article = {
      ...articleData,
      id: Date.now().toString(),
      agenda_id: agendaId.toString(),
      created_at: new Date().toISOString(),
      image: articleData.image || "https://placehold.co/600x400/e2e8f0/1e293b?text=Article"
    };

    setAgendas(prev => prev.map(a => {
      if (a.id === agendaId) {
        return {
          ...a,
          articles: [newArticle, ...a.articles]
        };
      }
      return a;
    }));

    return newArticle;
  };

  const deleteArticle = async (agendaId: number, articleId: number) => {
    setAgendas(prev => prev.map(a => {
      if (a.id === agendaId) {
        return {
          ...a,
          articles: a.articles.filter(art => Number(art.id) !== articleId && art.id !== articleId.toString())
        };
      }
      return a;
    }));
  };

  const getAgenda = (id: number) => {
    return agendas.find(a => a.id === id);
  };

  return (
    <DemoContext.Provider value={{ 
      user: DEMO_USER, 
      agendas, 
      addAgenda, 
      deleteAgenda, 
      createArticle,
      deleteArticle,
      getAgenda
    }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (context === undefined) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
}
