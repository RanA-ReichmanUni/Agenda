"use client";

import React, { useEffect, useState } from "react";
import CreateAgendaForm from "../components/CreateAgendaForm";
import AgendaCard from "../components/AgendaCard";
import { useAgendaContext } from "../context/AgendaContext";

export default function HomePage() {
  const { agendas, loading, error, refetch } = useAgendaContext();
  const [agendasWithArticles, setAgendasWithArticles] = useState<any[]>([]);
  const [agendaToDelete, setAgendaToDelete] = useState<any | null>(null);

  // Delete agenda handler
  const handleDeleteAgenda = async (agendaId: number) => {
    try {
      await fetch(`http://localhost:4000/agendas/${agendaId}`, { method: 'DELETE' });
      await refetch();
    } catch (err) {
      alert('Failed to delete agenda');
    }
  };

  useEffect(() => {
    if (!agendas.length) return;
    Promise.all(
      agendas.map(async (agenda) => {
        const res = await fetch(`http://localhost:4000/agendas/${agenda.id}/articles`);
        const articles = await res.json();
        // Only keep up to 4 articles with images, ordered by created_at
        const thumbnails = articles
          .filter((a: any) => a.image)
          .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          .slice(0, 4);
        return { ...agenda, articles: thumbnails };
      })
    ).then(setAgendasWithArticles);
  }, [agendas]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-blue-100 py-4 px-2 md:px-0 relative overflow-x-hidden">
      {/* Decorative blurred gradient shapes */}
      <div className="fixed top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 opacity-30 rounded-full blur-3xl pointer-events-none -z-10 animate-float" style={{ filter: 'blur(120px)' }} />
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-gradient-to-tr from-pink-400 via-purple-400 to-blue-400 opacity-30 rounded-full blur-3xl pointer-events-none -z-10 animate-float2" style={{ filter: 'blur(120px)' }} />
      <div className="max-w-3xl mx-auto space-y-12 scale-85">
        {/* Header */}
        <div className="relative z-10 bg-white/60 backdrop-blur-xl border border-gray-200 shadow-2xl rounded-3xl p-10 flex flex-col items-center animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-extrabold text-blue-800 mb-4 drop-shadow-lg tracking-tight">
            Agenda Builder
          </h1>
          <p className="text-gray-700 text-lg md:text-xl max-w-2xl mx-auto font-medium">
            Create and manage your reading agendas. Add articles, organize your content, and build your knowledge base in style.
          </p>
        </div>

        {/* Create Form */}
        <div className="relative z-10 animate-fade-in-up">
          <CreateAgendaForm />
        </div>

        {/* Agendas List */}
        <div className="relative z-10 space-y-8 animate-fade-in-up">
          <h2 className="text-3xl font-bold text-blue-800 tracking-tight flex items-center gap-2">
            <span>Your Agendas</span>
            {agendas.length > 0 && (
              <span className="text-base font-normal text-gray-500 ml-2">({agendas.length})</span>
            )}
          </h2>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-400 opacity-60"></div>
            </div>
          ) : error ? (
            <div className="text-center py-16 bg-white/60 backdrop-blur-xl rounded-2xl border border-red-200 shadow-inner animate-fade-in">
              <p className="text-red-600 text-lg">Error: {error}</p>
            </div>
          ) : agendas.length === 0 ? (
            <div className="text-center py-16 bg-white/60 backdrop-blur-xl rounded-2xl border border-gray-200 shadow-inner animate-fade-in">
              <p className="text-gray-500 text-lg">No agendas yet. Create your first one above!</p>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2">
              {agendasWithArticles.map((agenda) => (
                <AgendaCard
                  key={agenda.id}
                  agenda={agenda}
                  onDelete={() => setAgendaToDelete(agenda)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Delete Confirmation Modal */}
      {agendaToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-2xl p-8 max-w-md w-full animate-fade-in">
            <h3 className="text-xl font-bold text-red-700 mb-4 text-center">
              Confirm Deletion
            </h3>
            <p className="text-gray-700 text-center mb-6">
              Are you sure you want to delete the agenda titled <span className="font-semibold text-blue-800">"{agendaToDelete.title}"</span>?
            </p>
            <div className="flex justify-center gap-4">
              <button
                className="px-6 py-2 rounded-full bg-red-600 text-white font-semibold shadow hover:bg-red-700 transition"
                onClick={async () => {
                  await handleDeleteAgenda(Number(agendaToDelete.id));
                  setAgendaToDelete(null);
                }}
              >
                Confirm
              </button>
              <button
                className="px-6 py-2 rounded-full bg-gray-200 text-gray-700 font-semibold shadow hover:bg-gray-300 transition"
                onClick={() => setAgendaToDelete(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 1s cubic-bezier(0.4,0,0.2,1) both; }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(60px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fade-in-up 1.2s cubic-bezier(0.4,0,0.2,1) both; }
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-30px) scale(1.05); }
        }
        .animate-float { animation: float 12s ease-in-out infinite; }
        @keyframes float2 {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(30px) scale(1.08); }
        }
        .animate-float2 { animation: float2 14s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
