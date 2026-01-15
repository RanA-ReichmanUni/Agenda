import React, { useEffect, useState } from "react";
import CreateAgendaForm from "../components/CreateAgendaForm";
import AgendaCard from "../components/AgendaCard";
import { Link, useNavigate } from "react-router-dom";
import { useDemo } from "../context/DemoContext";

export default function DemoHomePage() {
  const { user, agendas, deleteAgenda, addAgenda } = useDemo();
  const navigate = useNavigate();
  const [agendasWithArticles, setAgendasWithArticles] = useState<any[]>([]);
  const [agendaToDelete, setAgendaToDelete] = useState<any | null>(null);

  // For the CreateAgendaForm, we need to intercept the API call style it uses
  // Or simpler: We create a local wrapper for the form or just reimplement the input here.
  // Reusing CreateAgendaForm is tricky because it likely calls `authFetch` internally?
  // Let's check CreateAgendaForm content. If it uses `useAgendaContext`, we might need a Demo version of that too.
  // Or we just implement the simple form UI here directly to save time/complexity.
  const [newAgendaTitle, setNewAgendaTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgendaTitle.trim()) return;
    setIsCreating(true);
    await addAgenda(newAgendaTitle);
    setNewAgendaTitle("");
    setIsCreating(false);
  };

  const handleDeleteAgenda = async (agendaId: number) => {
    try {
      await deleteAgenda(agendaId);
      setAgendaToDelete(null);
    } catch (err) {
      alert("Failed to delete agenda");
    }
  };

  useEffect(() => {
    if (!agendas) return;
    // Map demo agendas to the structure AgendaCard expects
    const formatted = agendas.map(agenda => {
       const thumbnails = agenda.articles
          .filter((a: any) => a.image)
          .sort(
            (a: any, b: any) =>
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
          .slice(0, 4);
        return { ...agenda, articles: thumbnails };
    });
    setAgendasWithArticles(formatted);
  }, [agendas]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-blue-100 py-4 px-2 md:px-0 relative overflow-x-hidden">
      
      {/* Demo Banner */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30">
        <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 px-4 py-1 rounded-full text-sm font-semibold shadow-md">
          Demo Mode - Changes are temporary
        </div>
      </div>

      {/* Logout button */}
      <div className="absolute top-4 right-4 z-20">
        <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-lg px-4 py-2 shadow-lg flex items-center gap-3">
          <span className="text-sm text-gray-700">
            Welcome, <span className="font-semibold text-blue-700">{user?.name} (Demo)</span>
          </span>
          <Link
            to="/login"
            className="text-sm bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded-md transition"
          >
            Exit Demo
          </Link>
        </div>
      </div>

      <div className="fixed top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 opacity-30 rounded-full blur-3xl pointer-events-none -z-10 animate-float" style={{ filter: 'blur(120px)' }} />
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-gradient-to-tr from-pink-400 via-purple-400 to-blue-400 opacity-30 rounded-full blur-3xl pointer-events-none -z-10 animate-float2" style={{ filter: 'blur(120px)' }} />
      
      <div className="max-w-3xl mx-auto space-y-12">
        <div className="relative z-10 bg-white/60 backdrop-blur-xl border border-gray-200 shadow-2xl rounded-3xl p-10 flex flex-col items-center animate-header-reveal">
          <h1 className="text-5xl md:text-6xl font-extrabold text-blue-800 mb-4 drop-shadow-lg tracking-tight animate-title-bounce">
            AGENDA
          </h1>
          <p className="text-gray-700 text-lg md:text-xl max-w-2xl mx-auto font-medium text-center animate-subtitle-fade">
            Create and manage your narratives and agendas. <br />Add sources and articles, and prove your point.
          </p>
        </div>

        <div className="relative z-10 animate-form-slide">
          <div className="bg-white/60 backdrop-blur-xl border border-gray-200 shadow-2xl rounded-3xl p-8">
            <h2 className="text-3xl font-bold text-blue-800 tracking-tight mb-6 animate-title-bounce">Create New Agenda</h2>
            {/* Inline implementation of CreateAgendaForm for Demo */}
            <form onSubmit={handleCreate} className="relative">
                <input
                    type="text"
                    placeholder="Agenda Title..."
                    value={newAgendaTitle}
                    onChange={(e) => setNewAgendaTitle(e.target.value)}
                    className="w-full px-6 py-4 text-lg bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition shadow-inner"
                    disabled={isCreating}
                />
                <button
                    type="submit"
                    disabled={isCreating || !newAgendaTitle.trim()}
                    className="absolute right-2 top-2 bottom-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 rounded-lg font-semibold hover:shadow-lg hover:scale-105 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isCreating ? "..." : "Create"}
                </button>
            </form>
          </div>
        </div>

        <div className="relative z-10 space-y-8 animate-agendas-reveal">
          <h2 className="text-3xl font-bold text-blue-800 tracking-tight flex items-center gap-2 animate-title-bounce">
            <span>My Agendas</span>
            {agendas.length > 0 && (
              <span className="text-base font-normal text-gray-500 ml-2">({agendas.length})</span>
            )}
          </h2>

          {agendas.length === 0 ? (
            <div className="text-center py-16 bg-white/60 backdrop-blur-xl rounded-2xl border border-gray-200 shadow-inner animate-fade-in">
              <p className="text-gray-500 text-lg">No agendas yet. Create your first one above!</p>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2">
              {agendasWithArticles.map((agenda) => (
                <div key={agenda.id} onClick={(e) => {
                    // Prevent default link behavior if we want to route to demo page manually
                    // But AgendaCard uses <Link> internally to /agenda/:id
                    // We need to either modify AgendaCard to accept a custom Link base or handle it here
                    // Only problem: AgendaCard probably hardcodes `/agenda/${id}`
                    // For the demo, we need `/demo/agenda/${id}`.
                    // Hack: We can let it route to /agenda/:id and then intercept that route in App.tsx? 
                    // No, that would clash with the real app. 
                    // Best approch: Wrap AgendaCard in a div that captures clicks? No, the inner Link will still fire.
                    // I'll make a stripped down DemoAgendaCard here inline or copy it.
                }}>
                    {/* Reimplementing AgendaCard content for Demo to control the Link */}
                     <Link to={`/demo/agenda/${agenda.id}`} className="block h-full group">
                        <div className="bg-white/70 backdrop-blur-md border border-gray-200 rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 h-full flex flex-col relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
                            
                            <h3 className="text-2xl font-bold text-gray-800 mb-2 group-hover:text-blue-700 transition-colors line-clamp-2">
                            {agenda.title}
                            </h3>
                            <p className="text-sm text-gray-500 mb-6 font-mono">
                            {new Date(agenda.created_at).toLocaleDateString()}
                            </p>

                            <div className="flex-1">
                            {agenda.articles && agenda.articles.length > 0 ? (
                                <div className="grid grid-cols-2 gap-2 mb-4">
                                {agenda.articles.map((article: any) => (
                                    <div key={article.id} className="aspect-video rounded-lg overflow-hidden bg-gray-100 relative">
                                    <img 
                                        src={article.image || `https://source.unsplash.com/random/200x200?sig=${article.id}`} 
                                        alt="" 
                                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition"
                                        onError={(e) => (e.currentTarget.style.display = 'none')}
                                    />
                                    </div>
                                ))}
                                </div>
                            ) : (
                                <div className="h-24 bg-gray-50 rounded-xl border border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-sm mb-4">
                                No articles added
                                </div>
                            )}
                            </div>

                            <div className="mt-auto flex justify-between items-center pt-4 border-t border-gray-100">
                            <span className="text-blue-600 font-semibold text-sm group-hover:underline">View Agenda →</span>
                            <button
                                onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setAgendaToDelete(agenda);
                                }}
                                className="text-gray-400 hover:text-red-500 transition p-2 rounded-full hover:bg-red-50"
                                title="Delete Agenda"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                            </div>
                        </div>
                    </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {agendaToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-2xl p-8 max-w-md w-full animate-fade-in">
            <h3 className="text-xl font-bold text-red-700 mb-4 text-center">Confirm Deletion</h3>
            <p className="text-gray-700 text-center mb-6">
              Are you sure you want to delete the agenda titled <span className="font-semibold text-blue-800">"{agendaToDelete.title}"</span>?
            </p>
            <div className="flex justify-center gap-4">
              <button
                className="px-6 py-2 rounded-full bg-red-600 text-white font-semibold shadow hover:bg-red-700 transition"
                onClick={async () => {
                  await handleDeleteAgenda(Number(agendaToDelete.id));
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

      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 1s cubic-bezier(0.4,0,0.2,1) both; }
        @keyframes float { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-30px) scale(1.05); } }
        .animate-float { animation: float 12s ease-in-out infinite; }
        @keyframes float2 { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(30px) scale(1.08); } }
        .animate-float2 { animation: float2 14s ease-in-out infinite; }
        @keyframes header-reveal { 0% { opacity: 0; transform: translateY(-100px) scale(0.8); } 60% { opacity: 1; transform: translateY(20px) scale(1.1); } 100% { transform: translateY(0) scale(1); } }
        .animate-header-reveal { animation: header-reveal 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
        @keyframes title-bounce { 0% { opacity: 0; transform: scale(0.5); } 70% { opacity: 1; transform: scale(1.2); } 100% { transform: scale(1); } }
        .animate-title-bounce { animation: title-bounce 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
        @keyframes subtitle-fade { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
        .animate-subtitle-fade { animation: subtitle-fade 0.8s ease-out 0.4s both; }
        @keyframes form-slide { 0% { opacity: 0; transform: translateX(-100px); } 100% { opacity: 1; transform: translateX(0); } }
        .animate-form-slide { animation: form-slide 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.6s both; }
        @keyframes agendas-reveal { 0% { opacity: 0; transform: translateY(50px); } 100% { opacity: 1; transform: translateY(0); } }
        .animate-agendas-reveal { animation: agendas-reveal 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.8s both; }
      `}</style>
    </div>
  );
}
