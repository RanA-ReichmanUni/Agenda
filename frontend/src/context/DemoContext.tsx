import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { DemoAgenda, INITIAL_DEMO_AGENDAS, DEMO_USER } from '../data/demoData';
import { Article, AnalysisResult } from '../lib/types';

interface DemoContextType {
  user: typeof DEMO_USER;
  agendas: DemoAgenda[];
  addAgenda: (title: string) => Promise<void>;
  deleteAgenda: (id: number) => Promise<void>;
  createArticle: (agendaId: number, article: Omit<Article, "id" | "createdAt" | "agenda_id">) => Promise<Article>;
  deleteArticle: (agendaId: number, articleId: number) => Promise<void>;
  getAgenda: (id: number) => DemoAgenda | undefined;
  updateAgendaTitle: (id: number, title: string) => { title: string };
  shareAgenda: (id: number) => Promise<string>;
  unshareAgenda: (id: number) => Promise<void>;
  saveAnalysis: (id: number, result: AnalysisResult) => void;
  resetDemo: () => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [agendas, setAgendas] = useState<DemoAgenda[]>(() => {
    try {
      const saved = localStorage.getItem('demo_agendas');
      return saved ? JSON.parse(saved) : INITIAL_DEMO_AGENDAS;
    } catch (e) {
      console.warn("Failed to load demo agendas", e);
      return INITIAL_DEMO_AGENDAS;
    }
  });

  useEffect(() => {
    localStorage.setItem('demo_agendas', JSON.stringify(agendas));
  }, [agendas]);

  const resetDemo = () => {
    localStorage.removeItem('demo_agendas');
    setAgendas(INITIAL_DEMO_AGENDAS);
  };

  const saveAnalysis = (id: number, result: AnalysisResult) => {
    setAgendas(prev => prev.map(a => 
      a.id === id ? { ...a, analysisResult: result } : a
    ));
  };

  const addAgenda = async (title: string) => {
    // Give smartphone agenda ID 1 to match cached demo analysis
    const newId = title === "All Smartphones Are Bland and Boring" ? 1 : Date.now();
    const newAgenda: DemoAgenda = {
      id: newId,
      title,
      createdAt: new Date().toISOString(),
      articles: []
    };
    setAgendas(prev => [newAgenda, ...prev]);
  };
  
  const updateAgendaTitle = (id: number, title: string) => {
    setAgendas(prev => prev.map(a => a.id === id ? { ...a, title } : a));
    return { title };
  };

  const deleteAgenda = async (id: number) => {
    setAgendas(prev => prev.filter(a => a.id !== id));
  };

  const createArticle = async (agendaId: number, articleData: Omit<Article, "id" | "createdAt" | "agenda_id">) => {
    const newArticle: Article = {
      ...articleData,
      id: Date.now().toString(),
      agenda_id: agendaId.toString(),
      createdAt: new Date().toISOString(),
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

  const shareAgenda = async (id: number): Promise<string> => {
    const token = `valid-demo-token-${id}`;
    setAgendas(prev => prev.map(a => {
      if (a.id === id) {
        return { ...a, share_token: token };
      }
      return a;
    }));
    return token;
  };

  const unshareAgenda = async (id: number): Promise<void> => {
    setAgendas(prev => prev.map(a => {
      if (a.id === id) {
        const { share_token, ...rest } = a;
        return rest;
      }
      return a;
    }));
  };

  const getAgenda = (id: number) => {
    return agendas.find(a => a.id === id);
  };

  const value = React.useMemo(() => ({
      user: DEMO_USER, 
      agendas, 
      addAgenda, 
      deleteAgenda, 
      createArticle,
      deleteArticle,
      getAgenda,
      updateAgendaTitle,
      shareAgenda,
      unshareAgenda,
      saveAnalysis,
      resetDemo
  }), [agendas]);

  return (
    <DemoContext.Provider value={value}>
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
