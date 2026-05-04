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
      }, 800);
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#f5f7ff,transparent_42%),radial-gradient(circle_at_top_right,#eef5ff,transparent_38%),#f8fafc] pb-20 pt-6">
      {isDemo && (
        <div
          id="tutorial-demo-banner"
          className="mx-auto mb-5 w-fit cursor-pointer rounded-full border border-amber-300 bg-amber-100 px-4 py-1 text-sm font-semibold text-amber-900"
          onClick={() => startTutorial(DEMO_MODE_EXPLANATION, "demo-explanation")}
        >
          Demo Mode - Local Storage Only
        </div>
      )}

      <div className="mx-auto flex w-[min(1200px,94vw)] flex-col gap-6 lg:flex-row">
        <aside className="lg:sticky lg:top-6 lg:h-fit lg:w-[360px]">
          <div id="tutorial-branding" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-700">Evidence Authority</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-900">AGENDA</h1>
            <p className="mt-2 text-sm text-slate-600">Narratives ranked by evidence quality, not noise.</p>
          </div>

          <div id="tutorial-create-agenda" className="mt-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-lg font-bold text-slate-900">Create Narrative</h2>
            <CreateAgendaForm onCreate={handleCreateAgenda} />
          </div>

          {(user || isDemo) && (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-700">
                Signed in as <span className="font-semibold text-slate-900">{user?.name || user?.email || "Demo User"}</span>
              </p>
              <button
                onClick={() => {
                  if (isDemo && !user) {
                    demoContext.resetDemo();
                    navigate("/login");
                    return;
                  }
                  logout();
                }}
                className="mt-3 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                {isDemo && !user ? "Exit Demo" : "Logout"}
              </button>
            </div>
          )}
        </aside>

        <main className="min-w-0 flex-1">
          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              {(["All", "High", "Medium", "Low", "Unknown"] as ReliabilityFilter[]).map((item) => (
                <button
                  key={item}
                  onClick={() => setReliabilityFilter(item)}
                  className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                    reliabilityFilter === item
                      ? "border-blue-700 bg-blue-700 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {item === "Unknown" ? "Not Verified" : item}
                </button>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <span className="font-semibold text-slate-500">Sort:</span>
              {(["Newest", "MostEvidence", "NeedsReview"] as SortMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setSortMode(mode)}
                  className={`rounded-full px-3 py-1 transition ${
                    sortMode === mode ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {mode === "MostEvidence" ? "Most Evidence" : mode === "NeedsReview" ? "Needs Review" : "Newest"}
                </button>
              ))}
            </div>
          </section>

          <section className="mt-5 space-y-4" id="tutorial-agenda-list">
            {loading && (
              <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">Loading dossiers...</div>
            )}

            {error && !loading && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">Error: {error}</div>
            )}

            {!loading && !error && visibleAgendas.length === 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
                No narratives match this filter yet.
              </div>
            )}

            {!loading &&
              !error &&
              visibleAgendas.map((agenda) => (
                <AgendaCard
                  key={agenda.id}
                  agenda={agenda}
                  href={isDemo ? `${demoPrefix}/agenda/${agenda.id}` : `/agenda/${agenda.id}`}
                  onDelete={() => setAgendaToDelete(agenda)}
                />
              ))}
          </section>
        </main>
      </div>

      {agendaToDelete && (
        <div id="delete-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Delete Narrative?</h3>
            <p className="mt-2 text-sm text-slate-600">
              You are deleting <span className="font-semibold text-slate-900">"{agendaToDelete.title}"</span>.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                id="confirm-delete-btn"
                data-testid="confirm-delete-btn"
                className="flex-1 rounded-full bg-rose-600 px-4 py-2 font-semibold text-white transition hover:bg-rose-700"
                onClick={async () => {
                  await handleDeleteAgenda(Number(agendaToDelete.id));
                  setAgendaToDelete(null);
                }}
              >
                Confirm Delete
              </button>
              <button
                className="flex-1 rounded-full border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-700 transition hover:bg-slate-50"
                onClick={() => setAgendaToDelete(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
