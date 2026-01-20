import React, { useEffect, useState, useContext } from "react";
import CreateAgendaForm from "../components/CreateAgendaForm";
import { AgendaContext, AgendaItem } from "../context/AgendaContext";
import { useDemo } from "../context/DemoContext";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_ENDPOINTS, authFetch } from "../lib/api";
import { useTutorial } from "../context/TutorialContext";
import { DEMO_HOME_STEPS, DEMO_MODE_EXPLANATION } from "../lib/tutorialSteps";

export default function HomePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const isDemo = location.pathname.startsWith('/demo') || location.pathname.startsWith('/auto-pilot-demo');
  const demoPrefix = location.pathname.startsWith('/auto-pilot-demo') ? '/auto-pilot-demo' : '/demo';
  const { startTutorial, hasSeenTutorial, isActive, isSuppressed } = useTutorial();

  useEffect(() => {
    // Don't auto-start tutorials if suppressed (ghost mode active/finished)
    if (isDemo && !hasSeenTutorial('home') && !isActive && !isSuppressed) {
        setTimeout(() => {
             startTutorial(DEMO_HOME_STEPS, 'home');
        }, 800);
    }
  }, [isDemo, startTutorial, hasSeenTutorial, isActive, isSuppressed]);
  
  // Real Context (might be undefined if in demo route)
  const agendaContext = useContext(AgendaContext);
  const { user, logout } = useAuth(); // Auth is always present but might be null user

  // Demo Context
  const demoContext = useDemo();

  // Unified Data Selection
  const agendas = isDemo ? demoContext.agendas : (agendaContext?.agendas || []);
  const loading = isDemo ? false : (agendaContext?.loading || false);
  const error = isDemo ? null : (agendaContext?.error || null);
  const deleteAgenda = isDemo ? demoContext.deleteAgenda : null; // Real delete is handled differently in strict mode, but here we can just call API?
  // Actually, AgendaContext doesn't expose deleteAgenda, it exposes refetch. Layout handles delete locally?
  // In the original HomePage, handleDeleteAgenda called authFetch(DELETE) then refetch().
  
  const [agendasWithArticles, setAgendasWithArticles] = useState<any[]>([]);
  const [agendaToDelete, setAgendaToDelete] = useState<any | null>(null);

  const handleCreateAgenda = async (title: string) => {
    if (isDemo) {
      await demoContext.addAgenda(title);
    } else {
      const response = await authFetch(API_ENDPOINTS.agendas, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!response.ok) {
        let message = `Failed to create agenda (HTTP ${response.status})`;
        try {
          const maybeJson = await response.json();
          if (maybeJson?.detail) message = maybeJson.detail;
          if (maybeJson?.error) message = maybeJson.error;
        } catch {}
        throw new Error(message);
      }
      agendaContext?.refetch();
    }
  };

  const handleDeleteAgenda = async (agendaId: number) => {
    try {
      if (isDemo) {
        await demoContext.deleteAgenda(agendaId);
      } else {
        await authFetch(API_ENDPOINTS.agenda(agendaId), { method: "DELETE" });
        agendaContext?.refetch();
      }
      setAgendaToDelete(null);
    } catch (err: any) {
      alert("Failed to delete agenda: " + err.message);
    }
  };

  useEffect(() => {
    // Fetch articles for thumbnails if needed (Real mode only)
    if (isDemo) {
       // Demo agendas already have articles
       setAgendasWithArticles(agendas);
       return;
    }

    if (!agendas.length) return;
    
    // In real mode, we need to fetch articles for previews
    Promise.all(
      agendas.map(async (agenda) => {
        try {
            const res = await authFetch(API_ENDPOINTS.articles(agenda.id));
            if (res.ok) {
                const articles = await res.json();
                const thumbnails = articles
                .filter((a: any) => a.image)
                .sort(
                    (a: any, b: any) =>
                    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                )
                .slice(0, 4);
                return { ...agenda, articles: thumbnails };
            }
        } catch (e) { console.error(e); }
        return agenda;
      })
    ).then((results) => setAgendasWithArticles(results as any[]));
  }, [agendas, isDemo]);


  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-blue-100 py-4 px-2 md:px-0 relative overflow-x-hidden">
      
      {/* Demo Banner */}
      {isDemo && (
        <div id="tutorial-demo-banner" className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30 cursor-pointer hover:scale-105 transition-transform" onClick={() => startTutorial(DEMO_MODE_EXPLANATION, 'demo-explanation')}>
          <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 px-4 py-1 rounded-full text-sm font-semibold shadow-md">
            Demo Mode - Local Storage Only
          </div>
        </div>
      )}

      {/* Logout button - Only show if user exists (Real mode mainly, but Demo has a fake user too) */}
      {user && (
        <div className="absolute top-4 right-4 z-20">
          <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-lg px-4 py-2 shadow-lg flex items-center gap-3">
            <span className="text-sm text-gray-700">
              Welcome, <span className="font-semibold text-blue-700">{user.name || user.email}</span>
            </span>
            <button
              onClick={logout}
              className="text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md transition"
            >
              Logout
            </button>
          </div>
        </div>
      )}
      
      {isDemo && !user && (
         <div className="absolute top-4 right-4 z-20">
          <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-lg px-4 py-2 shadow-lg flex items-center gap-3">
            <span className="text-sm text-gray-700">
              Welcome, <span className="font-semibold text-blue-700">Demo User</span>
            </span>
             <button
            onClick={() => {
                demoContext.resetDemo();
                navigate("/login");
            }}
            className="text-sm bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded-md transition"
          >
            Exit Demo
          </button>
          </div>
        </div>
      )}

      {/* Background Orbs */}
      <div className="fixed top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 opacity-30 rounded-full blur-3xl pointer-events-none -z-10 animate-float" style={{ filter: 'blur(120px)' }} />
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-gradient-to-tr from-pink-400 via-purple-400 to-blue-400 opacity-30 rounded-full blur-3xl pointer-events-none -z-10 animate-float2" style={{ filter: 'blur(120px)' }} />
      
      <div className="max-w-3xl mx-auto space-y-12">
        <div id="tutorial-branding" className="text-center mb-8 relative z-10">
          <h1 className="text-7xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-900 via-purple-800 to-blue-900 bg-[length:200%_auto] drop-shadow-2xl tracking-tighter animate-title-gradient" style={{ fontFamily: "'Playfair Display', serif" }}>
            AGENDA
          </h1>
          <p className="text-gray-600 font-medium text-lg md:text-xl tracking-[0.5em] uppercase opacity-0 mt-2 animate-subtitle-reveal">
            Prove Your Point.
          </p>
        </div>

        <div id="tutorial-create-agenda" className="relative z-10 animate-form-slide">
          <div className="bg-white/60 backdrop-blur-xl border border-gray-200 shadow-2xl rounded-3xl p-8">
            <h2 className="text-3xl font-bold text-blue-800 tracking-tight mb-6 animate-title-bounce">Create New Agenda</h2>
            <CreateAgendaForm onCreate={handleCreateAgenda} />
          </div>
        </div>
      </div>

      <div className="max-w-[90%] 2xl:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 mt-16">
        <div className="relative z-10 space-y-8 animate-agendas-reveal">
          <h2 id="tutorial-agenda-list" className="text-3xl font-bold text-blue-800 tracking-tight flex items-center gap-2 animate-title-bounce justify-center md:justify-start">
            <span>My Agendas</span>
            {agendas.length > 0 && (
              <span className="text-base font-normal text-gray-500 ml-2">({agendas.length})</span>
            )}
          </h2>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-400 opacity-60"></div>
            </div>
          ) : error ? (
            <div className="text-center py-16 bg-white/60 backdrop-blur-xl rounded-2xl border border-red-200 shadow-inner animate-fade-in max-w-3xl mx-auto">
              <p className="text-red-600 text-lg">Error: {error}</p>
            </div>
          ) : agendas.length === 0 ? (
            <div className="text-center py-16 bg-white/60 backdrop-blur-xl rounded-2xl border border-gray-200 shadow-inner animate-fade-in max-w-3xl mx-auto">
              <p className="text-gray-500 text-lg">No agendas yet. Create your first one above!</p>
            </div>
          ) : (
            <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
              {agendasWithArticles.map((agenda) => {
                // Highlight newly created smartphone agenda (has title but no articles yet)
                const isNewlyCreated = agenda.title === "All Smartphones Are Bland and Boring" && (!agenda.articles || agenda.articles.length === 0);
                return (
                <div key={agenda.id} data-agenda-id={agenda.id} data-title={agenda.title} className={isNewlyCreated ? 'animate-rainbow-border' : ''}>
                    <Link to={isDemo ? `${demoPrefix}/agenda/${agenda.id}` : `/agenda/${agenda.id}`} className="block w-full group">
                        <div className="bg-white border border-gray-200 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden group w-full h-auto flex flex-col">
                            
                            {/* Image Header with Badge Overlay */}
                            <div className="h-48 relative overflow-hidden bg-gray-50">
                                {agenda.articles && agenda.articles.length > 0 ? (
                                    <div className="w-full h-full grid grid-cols-2 grid-rows-1 gap-px">
                                        {agenda.articles.slice(0, 2).map((article: any) => (
                                            <div key={article.id} className="relative h-full overflow-hidden">
                                                <img 
                                                    src={article.image || `https://source.unsplash.com/random/400x400?sig=${article.id}`} 
                                                    alt="" 
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                                />
                                            </div>
                                        ))}
                                        {agenda.articles.length === 1 && <div className="bg-gray-100 w-full h-full"></div>}
                                    </div>
                                ) : (
                                    <div className="w-full h-full bg-blue-50 flex items-center justify-center">
                                        <div className="text-4xl grayscale opacity-20">📰</div>
                                    </div>
                                )}
                                
                                {/* Date Badge Floating */}
                                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-gray-500 shadow-sm border border-gray-100">
                                    {agenda.createdAt ? new Date(agenda.createdAt).toLocaleDateString() : 'No Date'}
                                </div>
                            </div>
                            
                            {/* Content Body */}
                            <div className="p-6 flex flex-col justify-between flex-grow bg-white relative">
                                <div>
                                    <h3 
                                        className="text-xl font-bold text-gray-900 mb-2 leading-tight group-hover:text-blue-600 transition-colors line-clamp-2 drop-shadow-sm" 
                                        style={{ fontFamily: "'Playfair Display', serif" }}
                                    >
                                        {agenda.title}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-4">
                                        <div className="h-1 w-8 bg-blue-500 rounded-full group-hover:w-16 transition-all duration-300"></div>
                                    </div>
                                </div>
                                
                                <button
                                    data-testid="delete-agenda-btn"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setAgendaToDelete(agenda);
                                    }}
                                    className="absolute bottom-6 right-6 text-gray-300 hover:text-red-500 transition-colors p-1"
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
                )
              })}
            </div>
          )}
        </div>
      </div>

      {agendaToDelete && (
        <div id="delete-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-2xl p-8 max-w-md w-full animate-fade-in">
            <h3 className="text-xl font-bold text-red-700 mb-4 text-center">Confirm Deletion</h3>
            <p className="text-gray-700 text-center mb-6">
              Are you sure you want to delete the agenda titled <span className="font-semibold text-blue-800">"{agendaToDelete.title}"</span>?
            </p>
            <div className="flex justify-center gap-4">
              <button
                id="confirm-delete-btn"
                data-testid="confirm-delete-btn"
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

      <style>{`
        @keyframes rainbow-border {
          0% { box-shadow: 0 0 0 3px rgba(255, 0, 0, 0.8); }
          16% { box-shadow: 0 0 0 3px rgba(255, 127, 0, 0.8); }
          33% { box-shadow: 0 0 0 3px rgba(255, 255, 0, 0.8); }
          50% { box-shadow: 0 0 0 3px rgba(0, 255, 0, 0.8); }
          66% { box-shadow: 0 0 0 3px rgba(0, 0, 255, 0.8); }
          83% { box-shadow: 0 0 0 3px rgba(139, 0, 255, 0.8); }
          100% { box-shadow: 0 0 0 3px rgba(255, 0, 0, 0.8); }
        }
        .animate-rainbow-border {
          animation: rainbow-border 2s linear infinite;
          border-radius: 1.5rem;
        }
        @keyframes title-gradient { 
          0% { background-position: 0% 50%; opacity: 0; transform: scale(0.9) translateY(-20px); filter: blur(10px); } 
          20% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0px); }
          100% { background-position: 200% 50%; opacity: 1; transform: scale(1) translateY(0); filter: blur(0px); } 
        }
        .animate-title-gradient { animation: title-gradient 5s ease-out infinite alternate; animation-play-state: running; }
        
        @keyframes subtitle-reveal { 
          0% { opacity: 0; letter-spacing: 0em; filter: blur(5px); } 
          100% { opacity: 0.7; letter-spacing: 0.5em; filter: blur(0px); } 
        }
        .animate-subtitle-reveal { animation: subtitle-reveal 1.5s cubic-bezier(0.2, 0.8, 0.2, 1) 0.5s forwards; }

        @keyframes fade-in-down { 0% { opacity: 0; transform: translateY(-20px); } 100% { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-down { animation: fade-in-down 0.8s ease-out both; }
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
