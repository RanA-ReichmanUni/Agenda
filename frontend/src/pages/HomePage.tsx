import React, { useEffect, useMemo, useState, useContext } from "react";
import CreateAgendaForm from "../components/CreateAgendaForm";
import AgendaCard from "../components/AgendaCard";
import { AgendaContext } from "../context/AgendaContext";
import { useDemo } from "../context/DemoContext";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_ENDPOINTS, authFetch } from "../lib/api";
import { useTutorial } from "../context/TutorialContext";
import { DEMO_HOME_STEPS, DEMO_MODE_EXPLANATION } from "../lib/tutorialSteps";
import { normalizeAnalysisResult, AnalysisResult } from "../lib/types";
import { DEMO_ANALYSIS_RESULTS } from "../data/demoAnalysisResults";
import AnalysisModal from '../components/AnalysisModal';

type ReliabilityFilter = "All" | "High" | "Medium" | "Low" | "Unknown";
type SortMode = "Newest" | "MostEvidence" | "NeedsReview";

const getReliability = (agenda: any): ReliabilityFilter => {
  const score = agenda?.analysisResult?.score;
  if (score === "High" || score === "Medium" || score === "Low") return score;
  return "Unknown";
};

export default function HomePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const isDemo = location.pathname.startsWith("/demo") || location.pathname.startsWith("/auto-pilot-demo");
  const demoPrefix = location.pathname.startsWith("/auto-pilot-demo") ? "/auto-pilot-demo" : "/demo";
  const { startTutorial, hasSeenTutorial, isActive, isSuppressed, ghostModeCompleted } = useTutorial();
  const isGhostRoute = location.pathname.startsWith("/auto-pilot-demo");

  useEffect(() => {
    if (isDemo && !isGhostRoute && !hasSeenTutorial("home") && !isActive && !isSuppressed && !ghostModeCompleted) {
      setTimeout(() => {
        startTutorial(DEMO_HOME_STEPS, "home");
      }, 300);
    }
  }, [isDemo, isGhostRoute, startTutorial, hasSeenTutorial, isActive, isSuppressed, ghostModeCompleted]);

  const agendaContext = useContext(AgendaContext);
  const { user, logout } = useAuth();
  const demoContext = useDemo();

  const agendas = isDemo ? demoContext.agendas : agendaContext?.agendas || [];
  const loading = isDemo ? false : agendaContext?.loading || false;
  const error = isDemo ? null : agendaContext?.error || null;

  const [agendasWithArticles, setAgendasWithArticles] = useState<any[]>([]);
  const [agendaToDelete, setAgendaToDelete] = useState<any | null>(null);
  const [reliabilityFilter, setReliabilityFilter] = useState<ReliabilityFilter>("All");
  const [sortMode, setSortMode] = useState<SortMode>("Newest");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [verifyingId, setVerifyingId] = useState<number | null>(null);

  // Analysis Modal state
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [selectedAnalysisResult, setSelectedAnalysisResult] = useState<AnalysisResult | null>(null);
  const [selectedAgenda, setSelectedAgenda] = useState<any>(null);

  const handleCreateAgenda = async (title: string) => {
    if (isDemo) {
      await demoContext.addAgenda(title);
      return;
    }

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
      } catch {
        // Intentionally ignore malformed error payloads.
      }
      throw new Error(message);
    }

    agendaContext?.refetch();
  };

  const onAgendaCreated = async (title: string) => {
    await handleCreateAgenda(title);
    setIsCreateModalOpen(false);
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
      alert("Failed to delete narrative: " + err.message);
    }
  };

  const handleVerify = async (agenda: any) => {
    // If there are no articles, the user cannot verify. 
    // They must add articles first.
    if (!agenda.articles || agenda.articles.length === 0) {
      alert("Please open the narrative and add evidence before verifying.");
      // Optionally route them to the agenda page
      navigate(`${isDemo ? demoPrefix : ""}/agenda/${agenda.id}`);
      return;
    }

    setVerifyingId(Number(agenda.id));
    try {
      if (isDemo) {
        const demoId = Number(agenda.id);
        const staticResult = DEMO_ANALYSIS_RESULTS[demoId];

        // 1. Check if Static Result is valid for the current state (like AgendaPage)
        const demoDefaultCounts: Record<number, number> = { 1: 4, 2: 4, 3: 3, 4: 3, 5: 2, 6: 2, 7: 2, 8: 2 };
        const isModified = (demoDefaultCounts[demoId] || 0) !== agenda.articles.length || agenda.title !== staticResult?.claim;

        if (staticResult) {
          // Simulated Wait for Demo Agenda
          await new Promise(resolve => setTimeout(resolve, 1500));
          const resultToSet = {
            ...staticResult,
            is_stale: isModified,
            articleCount: agenda.articles.length
          };
          demoContext.saveAnalysis(demoId, resultToSet);
          setVerifyingId(null);
          setSelectedAnalysisResult(resultToSet);
          setSelectedAgenda(agenda);
          setShowAnalysisModal(true);
          return;
        }

        const payload = {
          claim: agenda.title || "",
          articles: agenda.articles.map((a: any) => ({
            title: a.title,
            url: a.url,
            description: a.description || ""
          }))
        };

        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiUrl}/agendas/analyze-raw`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          const data = await response.json();
          const newResult = {
            ...normalizeAnalysisResult(data),
            reasoning: `(Real-time Analysis) ${data.reasoning}`,
            articleCount: agenda.articles.length
          };
          // Persist to Context/LocalStorage
          demoContext.saveAnalysis(agenda.id, newResult);

          setSelectedAnalysisResult(newResult);
          setSelectedAgenda(agenda);
          setShowAnalysisModal(true);
        } else {
          throw new Error("Demo analysis failed");
        }
      } else {
        const response = await authFetch(`${API_ENDPOINTS.agendas}/${agenda.id}/analyze?force_refresh=false`, { method: 'POST' });
        if (!response.ok) throw new Error("Failed to analyze narrative");

        // Fetch the updated agenda to get the new analysisResult
        const freshAgendas = await authFetch(API_ENDPOINTS.agendas).then(r => r.json());
        const updatedAgenda = freshAgendas.find((a: any) => a.id === agenda.id);

        agendaContext?.refetch();

        if (updatedAgenda?.analysisResult) {
          setSelectedAnalysisResult(updatedAgenda.analysisResult);
          setSelectedAgenda(updatedAgenda);
          setShowAnalysisModal(true);
        }
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setVerifyingId(null);
    }
  };

  useEffect(() => {
    if (isDemo) {
      setAgendasWithArticles(agendas);
      return;
    }

    if (!agendas.length) {
      setAgendasWithArticles([]);
      return;
    }

    Promise.all(
      agendas.map(async (agenda) => {
        try {
          const res = await authFetch(API_ENDPOINTS.articles(agenda.id));
          if (!res.ok) return agenda;

          const articles = await res.json();
          const thumbnails = articles
            .filter((a: any) => a.image)
            .sort(
              (a: any, b: any) =>
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            )
            .slice(0, 4);

          return { ...agenda, articles: thumbnails };
        } catch {
          return agenda;
        }
      })
    ).then((results) => setAgendasWithArticles(results as any[]));
  }, [agendas, isDemo]);

  const visibleAgendas = useMemo(() => {
    const filtered = agendasWithArticles.filter((agenda) => {
      if (reliabilityFilter === "All") return true;
      return getReliability(agenda) === reliabilityFilter;
    });

    const sorted = [...filtered];
    if (sortMode === "MostEvidence") {
      sorted.sort((a, b) => (b.articles?.length || 0) - (a.articles?.length || 0));
      return sorted;
    }
    if (sortMode === "NeedsReview") {
      sorted.sort((a, b) => Number(Boolean(b.analysisResult?.is_stale)) - Number(Boolean(a.analysisResult?.is_stale)));
      return sorted;
    }

    sorted.sort(
      (a, b) =>
        new Date(b.createdAt || b.created_at || 0).getTime() - new Date(a.createdAt || a.created_at || 0).getTime()
    );
    return sorted;
  }, [agendasWithArticles, reliabilityFilter, sortMode]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#f5f7ff,transparent_42%),radial-gradient(circle_at_top_right,#eef5ff,transparent_38%),#f8fafc] pb-24">
      {/* ── Top bar — same style as LandingPage header ── */}
      <header className="mx-auto flex w-[min(1120px,92vw)] items-center justify-between py-5">
        <div id="tutorial-branding" className="flex items-center gap-3">
          <span
            className="bg-gradient-to-r from-blue-900 via-blue-700 to-purple-800 bg-clip-text text-4xl font-black tracking-tighter text-transparent"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            AGENDA
          </span>
          {isDemo && (
            <span
              id="tutorial-demo-banner"
              className="cursor-pointer rounded-full border border-amber-300 bg-amber-100 px-3 py-0.5 text-xs font-semibold text-amber-900"
              onClick={() => startTutorial(DEMO_MODE_EXPLANATION, "demo-explanation")}
            >
              Demo Mode
            </span>
          )}
        </div>
        <nav className="flex items-center gap-2 sm:gap-3">
          {(user || isDemo) && (
            <>
              <span className="hidden sm:block text-sm text-slate-600">
                {user?.name || user?.email || "Demo User"}
              </span>
              <button
                onClick={() => {
                  if (isDemo && !user) {
                    demoContext.resetDemo();
                    navigate("/login");
                    return;
                  }
                  logout();
                }}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
              >
                {isDemo && !user ? "Exit Demo" : "Log out"}
              </button>
            </>
          )}
        </nav>
      </header>

      {/* ── Hero section — explains what the user is looking at ── */}
      <section className="mx-auto w-[min(1120px,92vw)]">
        <div className="flex flex-col items-start gap-1">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-700">Your narratives</p>
          <h1
            className="text-4xl font-black leading-tight tracking-tight text-slate-900 sm:text-5xl"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Evidence
            <span className="bg-gradient-to-r from-blue-800 via-blue-600 to-purple-700 bg-clip-text text-transparent"> Dashboard</span>
          </h1>
          <p className="mt-2 max-w-2xl text-base leading-relaxed text-slate-600">
            Each card below is a <span className="font-semibold text-slate-800">narrative</span> - a claim backed by evidence sources.
            The AI verification pipeline reads every article and scores how credibly your evidence supports the claim.
          </p>
        </div>
      </section>

      {/* ── Filter & Sort toolbar — rounded-3xl white card, same as LandingPage sections ── */}
      <section className="mx-auto mt-8 w-[min(1120px,92vw)]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400 mr-1">Filter</span>
              {(["All", "High", "Medium", "Low", "Unknown"] as ReliabilityFilter[]).map((item) => (
                <button
                  key={item}
                  onClick={() => setReliabilityFilter(item)}
                  className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${reliabilityFilter === item
                    ? "border-blue-700 bg-blue-700 text-white shadow-md shadow-blue-700/20"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                >
                  {item === "Unknown" ? "Not Verified" : item}
                </button>
              ))}
            </div>
            {/* Sort */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400 mr-1">Sort</span>
              {(["Newest", "MostEvidence", "NeedsReview"] as SortMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setSortMode(mode)}
                  className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${sortMode === mode
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                >
                  {mode === "MostEvidence" ? "Most Evidence" : mode === "NeedsReview" ? "Needs Review" : "Newest"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Agenda grid ── */}
      <section className="mx-auto mt-8 w-[min(1120px,92vw)]" id="tutorial-agenda-list">
        {loading && (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mb-3" />
            <p className="text-sm text-slate-500">Loading narratives…</p>
          </div>
        )}

        {error && !loading && (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-700 shadow-sm">
            <p className="font-semibold text-lg">Error loading narratives</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {!loading && !error && visibleAgendas.length === 0 && (
          <div className="animate-fade-in-up rounded-3xl border border-slate-200 border-dashed bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3
              className="text-xl font-bold text-slate-900"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              No narratives yet
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Create your first narrative to start collecting and verifying evidence.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-700 to-purple-700 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-700/20 transition hover:shadow-xl"
            >
              <span className="text-lg leading-none">+</span>
              Create your first narrative
            </button>
          </div>
        )}

        {!loading && !error && visibleAgendas.length > 0 && (
          <div className="flex flex-col gap-5">
            {visibleAgendas.map((agenda, index) => (
              <div
                key={agenda.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <AgendaCard
                  agenda={agenda}
                  id={index === 0 ? "tutorial-first-agenda-card" : undefined}
                  href={isDemo ? `${demoPrefix}/agenda/${agenda.id}` : `/agenda/${agenda.id}`}
                  onDelete={() => setAgendaToDelete(agenda)}
                  onShare={(agendaToShare) => navigate(`${isDemo ? demoPrefix : ""}/agenda/${agendaToShare.id}?share=true`)}
                  onVerify={handleVerify}
                  isVerifying={verifyingId === agenda.id}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Delete modal ── */}
      {agendaToDelete && (
        <div id="delete-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Delete Narrative?</h3>
            <p className="mt-2 text-sm text-slate-600">
              You are deleting <span className="font-semibold text-slate-900">"{agendaToDelete.title}"</span>.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                id="confirm-delete-btn"
                data-testid="confirm-delete-btn"
                className="flex-1 rounded-full bg-rose-600 px-4 py-2.5 font-semibold text-white transition hover:bg-rose-700"
                onClick={async () => {
                  await handleDeleteAgenda(Number(agendaToDelete.id));
                  setAgendaToDelete(null);
                }}
              >
                Confirm Delete
              </button>
              <button
                className="flex-1 rounded-full border border-slate-300 bg-white px-4 py-2.5 font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                onClick={() => setAgendaToDelete(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Floating Action Button — gradient pill, same as LandingPage CTA ── */}
      <button
        id="tutorial-create-agenda"
        onClick={() => setIsCreateModalOpen(true)}
        className="fixed bottom-8 right-8 z-40 group flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-700 to-purple-700 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-700/20 transition hover:shadow-xl hover:shadow-purple-700/25"
      >
        <span className="text-xl leading-none transition-transform group-hover:rotate-90">+</span>
        <span>New Narrative</span>
      </button>

      {/* ── Create modal ── */}
      {isCreateModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 animate-fade-in-up"
          onClick={(e) => { if (e.target === e.currentTarget) setIsCreateModalOpen(false); }}
        >
          <div className="relative w-full max-w-lg">
            {/* Soft glow */}
            <div
              aria-hidden
              className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-blue-200/60 via-purple-200/40 to-transparent blur-2xl"
            />
            <div className="relative rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="absolute right-6 top-6 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-blue-700">New narrative</p>
              <h2
                className="mt-2 text-2xl font-bold text-slate-900"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                State your claim
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Create a narrative - a single arguable statement you want to stand behind with evidence.
              </p>
              <div className="mt-6">
                <CreateAgendaForm onCreate={onAgendaCreated} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Modal for completed verification */}
      <AnalysisModal
        isOpen={showAnalysisModal}
        onClose={() => setShowAnalysisModal(false)}
        analysisResult={selectedAnalysisResult}
        onReanalyze={() => selectedAgenda && handleVerify(selectedAgenda)}
      />

      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out both;
        }
      `}</style>
    </div>
  );
}
