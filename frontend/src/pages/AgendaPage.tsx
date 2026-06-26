import React, { useEffect, useRef, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import AddArticleForm from "../components/AddArticleForm";
import { Article, Agenda } from "../lib/types";
import ArticleCard from "../components/ArticleCard";
import { API_ENDPOINTS, authFetch } from "../lib/api";
import { useToastContext } from "../context/ToastContext";
import { useDemo } from "../context/DemoContext";
import { useAuth } from "../context/AuthContext";
import { AgendaContext } from "../context/AgendaContext";
import { useTutorial } from "../context/TutorialContext";
import { DEMO_AGENDA_STEPS, DEMO_MODE_EXPLANATION } from "../lib/tutorialSteps";
import { AnalysisResult } from "../lib/types";

// --- Hardcoded Static Analysis Results for Demo Mode ---
const DEMO_ANALYSIS_RESULTS: Record<number, AnalysisResult> = {
  1: {
    score: 'High',
    reasoning: "Analysis of 4 technology sources (Gizmodo, HowToGeek, TechRadar, PhoneArena) indicates a strong consensus. The articles consistently report that form factors have plateaued and become 'boring' due to physical optimization and consumer demand for reliability, supporting the claim.",
    claim: "All Smartphones Are Bland and Boring",
    is_cached: true,
    is_stale: false,
    articleCount: 4
  },
  2: {
    score: 'Medium',
    reasoning: "The provided articles from CashMatters, WEF, and BEUC strongly argue for cash's privacy benefits. However, the claim 'Cash is Superior' is broad; while superior for privacy/anonymity (High confidence), the sources do not comprehensively address convenience or security risks compared to digital, resulting in a Medium overall score for the general superiority claim.",
    claim: "Cash Is Superior to Digital Payments",
    is_cached: true,
    is_stale: false,
    articleCount: 4
  },
  3: {
    score: 'High',
    reasoning: "Sources from PBS, KFF, and NYT provide substantial evidence that political maneuvering often prioritizes election strategy over patient outcomes. The analysis highlights a pattern of 'weaponizing' healthcare policy rather than solving cost/coverage trade-offs, supporting the claim that political interests frequently supersede patient care.",
    claim: "U.S. Health Care Politics Put Insurance Companies First, Patients Second",
    is_cached: true,
    is_stale: false,
    articleCount: 3
  },
  4: {
    score: 'High',
    reasoning: "Multiple studies cited (including MIT research reported by Time and TechNewsWorld) directly support the claim. The evidence links AI chatbot usage to reduced 'brain engagement' (EEG data) and cognitive offloading, confirming the negative impact on critical thinking skills.",
    claim: "AI Chatbots Make People Dumber",
    is_cached: true,
    is_stale: false,
    articleCount: 3
  },
  5: {
    score: 'Medium',
    reasoning: "Research provided (phys.org, Oxford Learning) supports the sub-claim that paper improves reading comprehension and retention. However, 'Superior' is a subjective value judgment. The evidence strongly supports paper for *learning*, but does not address portability or accessibility where screens excel.",
    claim: "Paper Books Are Superior to Screens",
    is_cached: true,
    is_stale: false,
    articleCount: 2
  },
  6: {
    score: 'High',
    reasoning: "The claim is well-supported by the provided medical and psychiatric sources (News-Medical, Columbia Psychiatry). The articles cite specific correlations between early smartphone use and increased rates of suicidal thoughts, aggression, and poor mental health in young adults.",
    claim: "Smartphones Destroying Our Mental Health",
    is_cached: true,
    is_stale: false,
    articleCount: 2
  },
  7: {
    score: 'High',
    reasoning: "Evidence from large-scale trials (UK Pilot, Microsoft Japan) cited by Autonomy and APA strongly supports the claim. The data shows clear improvements in revenue, productivity, and reduced burnout, validating the 'Ideal' characterization in a business context.",
    claim: "The 4-Day Work Week Is Ideal",
    is_cached: true,
    is_stale: false,
    articleCount: 2
  },
  8: {
    score: 'High',
    reasoning: "The debate between Bamba and Bissli is a classic cultural standoff, but the evidence leans towards Bamba due to its peanut-powered nutritional profile (and its ability to potentially reduce peanut allergies, as noted in studies). However, this comparison is largely subjective and humoristic in nature—taste is the ultimate arbiter!",
    claim: "במבה עדיפה על ביסלי",
    is_cached: true,
    is_stale: false,
    articleCount: 2
  }
};

export default function AgendaPage() {
  const { id, token } = useParams();
  const location = useLocation();
  const isDemo = location.pathname.startsWith('/demo') || location.pathname.startsWith('/auto-pilot-demo');
  const isShared = Boolean(token);
  const isReadOnly = isShared;

  const demoContext = useDemo();
  const agendaContext = React.useContext(AgendaContext);
  const { user } = useAuth();
  const { startTutorial, hasSeenTutorial, isActive, isSuppressed, ghostModeCompleted } = useTutorial();
  const isGhostRoute = location.pathname.startsWith('/auto-pilot-demo');

  if (!id && !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
        <div className="backdrop-blur-xl bg-white/60 border border-red-200 rounded-2xl p-8 shadow-2xl animate-fade-in">
          <div className="text-3xl font-bold text-red-600 mb-2">Invalid agenda</div>
          <p className="text-gray-500">Please check the URL and try again.</p>
        </div>
      </div>
    );
  }

  const { showUndo, setShowUndo, undoDelete, setUndoDelete } = useToastContext();
  const agendaId = id as string;

  const [agenda, setAgenda] = useState<Agenda | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [articleToDelete, setArticleToDelete] = useState<Article | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [iframeError, setIframeError] = useState<boolean>(false);
  const [iframeLoading, setIframeLoading] = useState<boolean>(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Share Modal State
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);

  // Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [isLongWait, setIsLongWait] = useState(false);
  // Track the content hash (or length) of articles when analysis ran
  const [analyzedArticleCount, setAnalyzedArticleCount] = useState<number | null>(null);

  // Watch for Changes to Articles to invalidate Analysis
  useEffect(() => {
    // We check against analysisResult.articleCount if available, or fallback to analyzedArticleCount for safety
    const recordedCount = analysisResult?.articleCount ?? analyzedArticleCount;

    if (analysisResult && !analysisResult.is_stale && recordedCount !== null) {
      if (articles.length !== recordedCount || agenda?.title !== analysisResult.claim) {
        console.log("Articles or title changed locally - Marking analysis as stale");
        const updated = { ...analysisResult, is_stale: true };
        setAnalysisResult(updated);
        if (isDemo && agenda) {
          demoContext.saveAnalysis(Number(agenda.id), updated);
        }
      }
    }
  }, [articles, agenda?.title, analyzedArticleCount, analysisResult, isDemo, demoContext]);

  // Edit Title State
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState("");
  const [isUpdatingTitle, setIsUpdatingTitle] = useState(false);

  useEffect(() => {
    // Don't auto-start tutorials if:
    // - On ghost route (auto-pilot handles its own narration)
    // - Ghost mode already completed (user saw the full tour)
    // - Currently suppressed (ghost mode running)
    if (isDemo && !isGhostRoute && !loading && !hasSeenTutorial('agenda') && !isActive && !isSuppressed && !ghostModeCompleted) {
      setTimeout(() => {
        startTutorial(DEMO_AGENDA_STEPS, 'agenda');
      }, 300);
    }
  }, [isDemo, isGhostRoute, loading, startTutorial, hasSeenTutorial, isActive, isSuppressed, ghostModeCompleted]);

  useEffect(() => {
    const fetchAgendaAndArticles = async () => {
      setLoading(true);
      try {
        if (isShared && token) {
          // Check for Demo Token
          if (token.startsWith('valid-demo-token-')) {
            // Shared Demo Mode (Simulated)
            const demoId = parseInt(token.replace('valid-demo-token-', ''), 10);
            const demoAgenda = demoContext.getAgenda(demoId);

            if (!demoAgenda) throw new Error("Demo agenda not found");

            if (demoAgenda.share_token !== token) {
              throw new Error("This agenda is not shared or the link has expired.");
            }

            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 500));

            setAgenda({
              id: demoAgenda.id,
              title: demoAgenda.title,
              createdAt: new Date(demoAgenda.createdAt),
              articles: demoAgenda.articles,
              share_token: token,
              owner_name: "Demo User"
            });
            setArticles(demoAgenda.articles);
            if (demoAgenda.analysisResult) {
              setAnalysisResult(demoAgenda.analysisResult);
              setAnalyzedArticleCount(demoAgenda.articles.length);
            }

          } else {
            // Shared Mode (Public - Real Backend)
            const agendaRes = await fetch(API_ENDPOINTS.sharedAgenda(token));
            if (!agendaRes.ok) throw new Error("Failed to fetch shared agenda");
            const agendaData = await agendaRes.json();

            const articlesRes = await fetch(API_ENDPOINTS.sharedArticles(token));
            if (!articlesRes.ok) throw new Error("Failed to fetch articles");
            const articlesData = await articlesRes.json();

            setAgenda({
              ...agendaData,
              createdAt: agendaData.createdAt
            });
            setArticles(articlesData);
            if (agendaData.analysisResult) {
              setAnalysisResult(agendaData.analysisResult);
              setAnalyzedArticleCount(articlesData.length);
            }
          }

        } else if (isDemo) {
          // Demo Mode
          const demoAgenda = demoContext.getAgenda(Number(agendaId));
          if (!demoAgenda) throw new Error("Agenda not found");
          setAgenda({
            id: demoAgenda.id,
            title: demoAgenda.title,
            createdAt: new Date(demoAgenda.createdAt),
            articles: demoAgenda.articles,
            share_token: demoAgenda.share_token,
            analysisResult: demoAgenda.analysisResult // Load cached result
          });
          setArticles(demoAgenda.articles);

          // If we have a stored analysis, load it into state
          if (demoAgenda.analysisResult) {
            setAnalysisResult(demoAgenda.analysisResult);
            // Trust the count stored in the result, falling back to current length only if missing (legacy safety)
            setAnalyzedArticleCount(demoAgenda.analysisResult.articleCount ?? demoAgenda.articles.length);
          } else {
            setAnalysisResult(null); // Explicit clear if no saved result
            setAnalyzedArticleCount(null);
          }

        } else {
          // Owner Mode (Auth)
          const agendaRes = await authFetch(API_ENDPOINTS.agenda(agendaId));
          if (!agendaRes.ok) throw new Error("Failed to fetch agenda");
          const agendaData = await agendaRes.json();

          const articlesRes = await authFetch(API_ENDPOINTS.articles(agendaId));
          if (!articlesRes.ok) throw new Error("Failed to fetch articles");
          const articlesData = await articlesRes.json();

          setAgenda(agendaData);
          setArticles(articlesData);
          if (agendaData.analysisResult) {
            setAnalysisResult(agendaData.analysisResult);
            setAnalyzedArticleCount(articlesData.length);
          }
        }
        setError(null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAgendaAndArticles();
  }, [agendaId, token, isDemo, isShared, demoContext]);

  const handleAddArticle = async (newArticle: Omit<Article, "id">) => {
    try {
      if (isDemo) {
        await demoContext.createArticle(Number(agendaId), newArticle);
        setAnalysisResult(prev => prev ? ({ ...prev, is_stale: true }) : null);
        return;
      }

      const res = await authFetch(API_ENDPOINTS.articles(agendaId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newArticle),
      });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || "Failed to add article");
      }
      const updated = await authFetch(API_ENDPOINTS.articles(agendaId));
      setArticles(await updated.json());
      setAnalysisResult(prev => prev ? ({ ...prev, is_stale: true }) : null);
    } catch (err: any) {
      alert("Failed to add article: " + err.message);
    }
  };

  const restoreLastArticle = async (articleToRestore: Article) => {
    try {
      if (isDemo) {
        const { id, createdAt, agenda_id, ...rest } = articleToRestore;
        await demoContext.createArticle(Number(agendaId), rest);
        setAnalysisResult(prev => prev ? ({ ...prev, is_stale: true }) : null);
        setShowUndo(false);
        setArticleToDelete(null);
        return;
      }

      const res = await authFetch(API_ENDPOINTS.articles(agendaId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(articleToRestore),
      });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || "Failed to add article");
      }
      const updated = await authFetch(API_ENDPOINTS.articles(agendaId));
      setArticles(await updated.json());
      setAnalysisResult(prev => prev ? ({ ...prev, is_stale: true }) : null);

      // Hide toast after restore
      setShowUndo(false);
      setArticleToDelete(null);

    } catch (err: any) {
      alert("Failed to add article: " + err.message);
    }
  };

  const handleRemoveArticle = async (articleId: number) => {
    try {
      const articleToRestore = articles.find(a => Number(a.id) === articleId || a.id === String(articleId));
      if (!articleToRestore) {
        throw new Error("Article not found");
      }

      if (isDemo) {
        await demoContext.deleteArticle(Number(agendaId), articleId);
      } else {
        const res = await authFetch(API_ENDPOINTS.article(articleId), { method: "DELETE" });
        if (!res.ok) {
          const { error } = await res.json();
          throw new Error(error || "Failed to delete article");
        }
      }

      setArticles((prev) => prev.filter((a) => Number(a.id) !== articleId && a.id !== String(articleId)));
      setAnalysisResult(prev => prev ? ({ ...prev, is_stale: true }) : null);

      // Set up undo deletion
      const undoFunc = () => restoreLastArticle(articleToRestore);
      setUndoDelete(() => undoFunc);
      setShowUndo(true);

      setTimeout(() => {
        setShowUndo(false);
        setArticleToDelete(null);
      }, 5000);

    } catch (err: any) {
      alert("Failed to delete article: " + err.message);
    }
  };

  const handleShare = async () => {
    if (!agenda) return;
    setShareLoading(true);
    try {
      if (isDemo) {
        // Simulated Share for Demo Mode
        await new Promise(resolve => setTimeout(resolve, 800)); // Fake delay
        const demoToken = await demoContext.shareAgenda(Number(agenda.id));
        setAgenda(prev => prev ? ({ ...prev, share_token: demoToken }) : null);
      } else {
        const res = await authFetch(API_ENDPOINTS.shareAgenda(agenda.id), { method: 'POST' });
        if (!res.ok) throw new Error("Failed to generate share link");
        const updatedAgenda = await res.json();
        setAgenda(prev => prev ? ({ ...prev, share_token: updatedAgenda.share_token }) : null);
      }
    } catch (e: any) {
      alert("Error sharing: " + e.message);
    } finally {
      setShareLoading(false);
    }
  };

  const handleUnshare = async () => {
    if (!agenda) return;
    setShareLoading(true);
    try {
      if (isDemo) {
        // Simulated Unshare
        await new Promise(resolve => setTimeout(resolve, 600));
        await demoContext.unshareAgenda(Number(agenda.id));
        setAgenda(prev => prev ? ({ ...prev, share_token: undefined }) : null);
      } else {
        const res = await authFetch(API_ENDPOINTS.unshareAgenda(agenda.id), { method: 'POST' });
        if (!res.ok) throw new Error("Failed to unshare");
        setAgenda(prev => prev ? ({ ...prev, share_token: undefined }) : null);
      }
    } catch (e: any) {
      alert("Error unsharing: " + e.message);
    } finally {
      setShareLoading(false);
    }
  };

  const handleAnalyzeClaim = async (forceRefresh = false) => {
    const readErrorMessage = async (response: Response, fallback: string) => {
      try {
        const data = await response.clone().json();
        const detail = data?.detail || data?.error?.message || data?.error || data?.message;
        if (typeof detail === "string" && detail.trim()) {
          return `${fallback}: ${detail}`;
        }
      } catch {
        // Response was not JSON, continue to text fallback.
      }

      try {
        const text = await response.text();
        if (text.trim()) {
          return `${fallback}: ${text}`;
        }
      } catch {
        // Ignore read failures.
      }

      return `${fallback} (HTTP ${response.status})`;
    };

    // 1. Exact Match Cache: If we have a valid result for current state, show it.
    if (!forceRefresh && analysisResult && analyzedArticleCount === articles.length && !analysisResult.is_stale) {
      setShowAnalysisModal(true);
      return;
    }

    // 2. Stale Cache Preservation: If we have a result but it's stale (counts differ), 
    // and we aren't forcing a refresh, show the stale result instead of overwriting with static default.
    if (!forceRefresh && analysisResult) {
      setShowAnalysisModal(true);
      return;
    }

    setIsAnalyzing(true);
    setIsLongWait(false);
    const timer = setTimeout(() => setIsLongWait(true), 5000); // 6s wait triggers rainbow

    setAnalysisResult(null);
    try {
      if (isDemo) {
        await new Promise(r => setTimeout(r, 800)); // Slight delay for effect

        const demoId = Number(agendaId);
        const staticResult = DEMO_ANALYSIS_RESULTS[demoId];

        // 1. Check if Static Result is valid for the current state
        // Logic: Static results are valid ONLY if the article count matches the default for that specific agenda
        const demoDefaultCounts: Record<number, number> = { 1: 4, 2: 4, 3: 3, 4: 3, 5: 2, 6: 2, 7: 2, 8: 2 };
        const isModified = (demoDefaultCounts[demoId] || 0) !== articles.length || agenda?.title !== staticResult?.claim;

        if (staticResult && !forceRefresh) {
          const resultToSet = {
            ...staticResult,
            is_stale: isModified,
            articleCount: articles.length
          };
          setAnalysisResult(resultToSet);
          setAnalyzedArticleCount(articles.length); // Record current state

          // Persist static/stale state too so navigation preserves it
          demoContext.saveAnalysis(demoId, resultToSet);

          setShowAnalysisModal(true);
          setIsAnalyzing(false);
          return;
        }

        // 2. If Force Refresh (User clicked Recheck) or No Static Result (New Agenda)
        const payload = {
          claim: agenda?.title || "",
          articles: articles.map(a => ({
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
          const newResult: AnalysisResult = {
            ...data,
            reasoning: `(Real-time Analysis) ${data.reasoning}`,
            articleCount: articles.length
          };
          setAnalysisResult(newResult);
          setAnalyzedArticleCount(articles.length); // Sync state

          // Persist to Context/LocalStorage
          demoContext.saveAnalysis(demoId, newResult);

        } else {
          throw new Error(await readErrorMessage(response, "Demo analysis failed"));
        }

        setShowAnalysisModal(true);

      } else if (isShared && token && !token.startsWith('valid-demo-token-')) {
        // Shared Mode (Public - Real Backend using Token)
        const response = await fetch(API_ENDPOINTS.analyzeShared(token), {
          method: 'POST'
        });
        if (response.ok) {
          const data = await response.json();
          setAnalysisResult(data);
          setAnalyzedArticleCount(articles.length);
        } else {
          throw new Error(await readErrorMessage(response, "Shared analysis failed"));
        }
      } else if (isShared && token && token.startsWith('valid-demo-token-')) {
        // Shared Demo Mode (Reuse Demo Logic)
        // For now, simplify and just reuse the same logic as above or simple simulation
        // Since shared demo is read-only usually, it is likely the default one.
        await new Promise(r => setTimeout(r, 2000));
        const count = articles.length;
        /* ... Same logic ... */
        // CRITERIA 1: Keywords looking for "Hard Evidence" 
        const authoritativeKeywords = ["report", "study", "evidence", "confirmed", "analysis", "data", "statistics", "review", "official", "survey", "court", "verdict", "proof", "science", "research"];
        const qualityMatches = articles.filter(a =>
          authoritativeKeywords.some(kw => (a.title + " " + (a.description || "")).toLowerCase().includes(kw))
        ).length;

        const uniqueDomains = new Set(articles.map(a => {
          try { return new URL(a.url).hostname.replace('www.', ''); } catch { return a.url || 'unknown_source'; }
        })).size;

        let points = (count * 10) + (uniqueDomains * 15) + (qualityMatches * 10);
        let score: 'High' | 'Medium' | 'Low' = 'Low';
        let reasoningDetail = "";

        if (points >= 65) {
          score = 'High';
          reasoningDetail = `Strong consensus detected across about ${uniqueDomains} unique domains. The semantic analysis identified authoritative terminology (e.g., study, data) that strongly supports the claim.`;
        } else if (points >= 35) {
          score = 'Medium';
          reasoningDetail = `Evidence is present (${count} sources) and appears relevant. Usage of ${uniqueDomains === 1 ? 'a single source' : 'diverse sources'} provides a partial correlation. Adding one more distinct source would likely elevate this to a high confidence level.`;
        } else {
          score = 'Low';
          reasoningDetail = `Insufficient data density. With only ${count} source(s) and limited cross-referencing, the claim lacks the verifiable weight required for a definitive rating.`;
        }

        setAnalysisResult({
          score,
          reasoning: `(Shared Demo Simulation) ${reasoningDetail}`,
          claim: agenda?.title || ""
        });
        setAnalyzedArticleCount(articles.length);

      } else {
        // Owner Mode (Real Backend)
        const response = await authFetch(`${API_ENDPOINTS.agendas}/${id}/analyze?force_refresh=${forceRefresh}`, {
          method: 'POST'
        });
        if (response.ok) {
          const data = await response.json();
          setAnalysisResult(data);
          setAnalyzedArticleCount(articles.length);
        } else {
          throw new Error(await readErrorMessage(response, "Analysis failed"));
        }
      }
      setShowAnalysisModal(true);
    } catch (error: any) {
      console.error(error);
      alert(`Failed to analyze claim. ${error?.message || "Please try again."}`);
    } finally {
      setIsAnalyzing(false);
      setIsLongWait(false);
      clearTimeout(timer);
    }
  };

  const startEditingTitle = () => {
    if (agenda) {
      setEditTitleValue(agenda.title);
      setIsEditingTitle(true);
    }
  };

  const cancelEditingTitle = () => {
    setIsEditingTitle(false);
    setEditTitleValue("");
  };

  const handleUpdateTitle = async () => {
    if (!agenda || !editTitleValue.trim()) return;

    setIsUpdatingTitle(true);
    try {
      if (isDemo) {
        // Demo Mode Simulation
        await new Promise(resolve => setTimeout(resolve, 500));
        const updated = demoContext.updateAgendaTitle(Number(agenda.id), editTitleValue);
        setAgenda(prev => prev ? ({ ...prev, title: updated.title }) : null);
        setAnalysisResult(prev => prev ? ({ ...prev, is_stale: true }) : null);
      } else {
        const res = await authFetch(API_ENDPOINTS.agenda(agenda.id), {
          method: 'PATCH',
          body: JSON.stringify({ title: editTitleValue }),
        });

        if (!res.ok) throw new Error("Failed to update title");

        const updated = await res.json();
        setAgenda(prev => prev ? ({ ...prev, title: updated.title }) : null);
        setAnalysisResult(prev => prev ? ({ ...prev, is_stale: true }) : null);
        // Update global context so homepage reflects changes
        agendaContext?.updateAgendaItem(Number(agenda.id), { title: updated.title });
      }
      setIsEditingTitle(false);
    } catch (e: any) {
      alert("Failed to update title: " + e.message);
    } finally {
      setIsUpdatingTitle(false);
    }
  };

  const handleArticleClick = (url: string) => {
    setIframeError(false);
    setIframeLoading(true);
    setPreviewUrl(url);
    fetch(API_ENDPOINTS.checkIframe(url))
      .then((res) => res.json())
      .then(({ blocked }) => {
        if (blocked) {
          setIframeError(true);
        }
      })
      .catch(() => {
        setIframeError(true);
      });
  };

  const closePreview = () => {
    setPreviewUrl(null);
    setIframeError(false);
  };

  const handleOpenInNewTab = (url: string) => {
    window.open(url, "_blank");
    closePreview();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
        <div className="animate-spin rounded-full h-24 w-24 border-t-4 border-b-4 border-blue-400 opacity-60"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
        <div className="backdrop-blur-xl bg-white/60 border border-red-200 rounded-2xl p-8 shadow-2xl animate-fade-in">
          <div className="text-3xl font-bold text-red-600 mb-2">{error}</div>
          <p className="text-gray-500">Something went wrong. Please try again later.</p>
        </div>
      </div>
    );
  }

  if (!agenda) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
        <div className="backdrop-blur-xl bg-white/60 border border-red-200 rounded-2xl p-8 shadow-2xl animate-fade-in">
          <div className="text-3xl font-bold text-red-600 mb-2">Agenda not found</div>
          <p className="text-gray-500">Please check the URL and try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">

      {/* Shared Banner */}
      {isShared && (
        <div className="fixed top-0 w-full z-40 bg-blue-500 text-white text-center py-1 text-sm font-bold shadow-md">
          Shared by {agenda.owner_name || 'User'}
        </div>
      )}

      {/* Top Navigation */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to={isDemo ? "/demo" : "/"}
              className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <h1 className="text-xl font-bold">Claim Dossier</h1>
          </div>

          {!isReadOnly && (
            <button
              id="tutorial-share-button"
              onClick={() => setShowShareModal(true)}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600"
              title="Share Agenda"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto bg-white min-h-screen border-l border-r border-gray-200">
        {/* Demo Banner */}
        {isDemo && (
          <div className="flex justify-center pt-6 pb-2">
            <div
              id="tutorial-demo-banner"
              className="cursor-pointer rounded-full border border-amber-300 bg-amber-100 px-4 py-1 text-sm font-semibold text-amber-900"
              onClick={() => startTutorial(DEMO_MODE_EXPLANATION, 'demo-explanation')}
            >
              Demo Mode - Local Storage Only
            </div>
          </div>
        )}

        {/* Dossier Header */}
        <div className="px-4 pt-6 pb-4 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
              {(agenda.owner_name || 'U')[0].toUpperCase()}
            </div>
            <div>
              <div className="font-bold text-gray-900">{isShared ? (agenda.owner_name || 'User') : (user?.name || user?.email || 'User')}</div>
              <div className="text-gray-500 text-sm">@{(isShared ? (agenda.owner_name || 'user') : (user?.name || user?.email || 'user')).toLowerCase().replace(/\s+/g, '')} • {new Date(agenda.createdAt).toLocaleDateString()}</div>
            </div>
          </div>

          <div className="mb-4">
            {isEditingTitle && !isReadOnly ? (
              <div className="flex items-center w-full relative">
                <input
                  autoFocus
                  type="text"
                  value={editTitleValue}
                  onChange={(e) => setEditTitleValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleUpdateTitle(); if (e.key === 'Escape') cancelEditingTitle(); }}
                  onBlur={handleUpdateTitle}
                  className="w-full text-2xl font-bold bg-gray-50 border border-blue-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isUpdatingTitle}
                />
                {isUpdatingTitle && (
                  <div className="absolute right-3 animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                )}
              </div>
            ) : (
              <div className="group relative inline-block w-full">
                <h2
                  id="tutorial-agenda-subject"
                  className="text-3xl font-bold text-gray-900 break-words"
                >
                  {agenda.title}
                </h2>
                {!isReadOnly && (
                  <button
                    onClick={startEditingTitle}
                    className="absolute -right-8 top-1/2 -translate-y-1/2 p-2 opacity-0 group-hover:opacity-100 transition text-gray-400 hover:text-blue-600 rounded-full hover:bg-gray-100"
                    title="Edit Title"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 rounded-2xl border border-gray-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Summary</p>
            <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
              <span><strong>{articles.length}</strong> Evidence Sources</span>
              {analysisResult && !isAnalyzing && (
                <span className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <span
                      className={`w-2 h-2 rounded-full inline-block ${analysisResult.score === 'High' ? 'bg-green-500' :
                        analysisResult.score === 'Medium' ? 'bg-yellow-400' :
                          'bg-red-500'
                        }`}
                    ></span>
                    <span className={
                      analysisResult.score === 'High' ? 'text-green-600 font-semibold' :
                        analysisResult.score === 'Medium' ? 'text-yellow-600 font-semibold' :
                          'text-red-600 font-semibold'
                    }>
                      {analysisResult.score === 'High' ? 'High Reliability' :
                        analysisResult.score === 'Medium' ? 'Moderate Reliability' :
                          'Low Reliability'}
                    </span>
                  </span>
                  {analysisResult.is_stale && (
                    <span className="font-bold text-yellow-800 bg-yellow-100 px-2 py-0.5 rounded text-xs border border-yellow-200 animate-pulse">
                      ⚠️ Outdated Rating - Details Modified
                    </span>
                  )}
                </span>
              )}
              {!analysisResult && !isAnalyzing && (
                <span className="text-slate-500">Not yet verified</span>
              )}
            </div>
          </div>

          <div className="flex justify-start pt-4 mt-1">
            <button
              id="analyze-agenda-btn"
              onClick={() => handleAnalyzeClaim(false)}
              disabled={isAnalyzing}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors font-semibold
                    ${isAnalyzing
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-blue-600 hover:bg-blue-50'}
                `}
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-current rounded-full border-t-transparent"></div>
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 outline-none" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
                  <span>Run Verification</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Add Evidence Form */}
        {!isReadOnly && (
          <div id="tutorial-add-article" className="p-4 border-b border-gray-200">
            <AddArticleForm onAdd={handleAddArticle} />
          </div>
        )}

        {/* Evidence List */}
        <div>
          {articles.length === 0 ? (
            <div className="text-center py-20 px-4">
              <p className="text-gray-500 font-bold text-lg mb-2">No evidence yet.</p>
              {!isReadOnly && <p className="text-gray-400 text-sm">Add a link above to start building the thread.</p>}
            </div>
          ) : (
            <div id="tutorial-evidence-grid">
              {articles.map((article, index) => (
                <div
                  key={article.id}
                  onClick={() => handleArticleClick(article.url)}
                  className="p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 mb-2">
                      <span className="text-gray-500 text-xs">Added {new Date(article.createdAt || Date.now()).toLocaleDateString()}</span>
                    </div>
                    <div className="border border-gray-200 rounded-2xl overflow-hidden hover:border-gray-300 transition-colors bg-white">
                      <ArticleCard
                        article={article}
                        onDelete={!isReadOnly ? () => {
                          setArticleToDelete(article);
                        } : undefined}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals from before */}
      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Share Thread</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {shareLoading ? (
              <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>
            ) : (
              <>
                {agenda?.share_token ? (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Anyone with this link can view this thread.
                    </p>
                    <div className="flex gap-2">
                      <input
                        readOnly
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none"
                        value={`${window.location.origin}/shared/${agenda.share_token}`}
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/shared/${agenda.share_token}`);
                          alert("Link copied!");
                        }}
                        className="px-4 py-2 bg-black text-white rounded-full text-sm font-bold hover:bg-gray-800"
                      >
                        Copy
                      </button>
                    </div>
                    <div className="pt-2">
                      <button
                        onClick={handleUnshare}
                        className="text-red-500 text-sm font-bold hover:underline"
                      >
                        Stop sharing
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-gray-600 mb-6 text-sm">
                      Create a public link to share this thread with others. They will be able to view it but not edit it.
                    </p>
                    <button
                      onClick={handleShare}
                      className="px-6 py-2 w-full rounded-full bg-black text-white font-bold hover:bg-gray-800 transition"
                    >
                      Create Link
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Analysis Modal */}
      {showAnalysisModal && analysisResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-2">
                <svg className="w-6 h-6 text-blue-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
                <h3 className="font-bold text-gray-900">AI Verification</h3>
              </div>
              <button onClick={() => setShowAnalysisModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6 flex-grow overflow-y-auto">
              <div className="mb-6 flex flex-col items-center">
                <h2 className={`text-3xl font-black mb-1 ${analysisResult.score === 'High' ? 'text-green-600' :
                  analysisResult.score === 'Medium' ? 'text-yellow-600' : 'text-red-600'
                  }`}>{analysisResult.score} Confidence</h2>
                <p className="text-gray-500 text-center font-medium text-sm mt-2">"{analysisResult.claim}"</p>
              </div>

              {analysisResult.is_stale && (
                <div className="mb-6 bg-yellow-50 border border-yellow-200 p-4 rounded-xl flex flex-col gap-3">
                  <p className="font-bold text-yellow-800 text-sm">⚠️Outdated Rating - Details Modified</p>
                  <button
                    onClick={() => handleAnalyzeClaim(true)}
                    className="w-full py-2 bg-yellow-200 hover:bg-yellow-300 text-yellow-900 rounded-lg text-sm font-bold transition"
                  >
                    Recheck Claims
                  </button>
                </div>
              )}

              <div className="bg-gray-50 p-4 rounded-xl mb-4">
                <h4 className="font-bold text-gray-900 mb-2 text-sm uppercase tracking-wider">Reasoning</h4>
                <p className="text-gray-700 leading-relaxed text-sm">
                  {analysisResult.reasoning}
                </p>
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setShowAnalysisModal(false)}
                className="px-6 py-2 bg-gray-900 text-white rounded-full font-bold hover:bg-black transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Article Modal */}
      {articleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Evidence?</h3>
            <p className="text-gray-600 text-sm mb-6">
              This can't be undone. Will remove <span className="font-semibold">"{articleToDelete.title}"</span> from the thread.
            </p>
            <div className="flex flex-col gap-3">
              <button
                className="w-full py-3 rounded-full bg-red-500 text-white font-bold hover:bg-red-600 transition"
                onClick={async () => {
                  await handleRemoveArticle(Number(articleToDelete.id));
                  setArticleToDelete(null);
                }}
              >
                Delete
              </button>
              <button
                className="w-full py-3 rounded-full bg-white border border-gray-200 text-gray-900 font-bold hover:bg-gray-50 transition"
                onClick={() => setArticleToDelete(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewUrl && !iframeError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="relative w-full h-full max-w-6xl max-h-[90vh] bg-white rounded-2xl overflow-hidden flex flex-col">
            <div className="h-14 bg-gray-50 border-b border-gray-200 flex items-center justify-between px-4">
              <div className="font-bold text-gray-700 truncate max-w-md">{previewUrl}</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.open(previewUrl, "_blank")}
                  className="p-2 text-gray-600 hover:bg-gray-200 rounded-full transition"
                  title="Open in new tab"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </button>
                <button
                  onClick={closePreview}
                  className="p-2 text-gray-600 hover:bg-gray-200 rounded-full transition"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            {iframeLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-300 border-t-blue-500"></div>
                  <span className="text-gray-600 text-sm font-medium">Loading article...</span>
                </div>
              </div>
            )}
            <iframe
              ref={iframeRef}
              src={previewUrl}
              title="Article Preview"
              className="w-full flex-grow border-0"
              onLoad={() => setIframeLoading(false)}
              onError={() => {
                setIframeLoading(false);
                setIframeError(true);
              }}
            />
          </div>
        </div>
      )}

      {/* Iframe Error Modal */}
      {iframeError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">🔗</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Preview Blocked</h3>
            <p className="text-gray-600 text-sm mb-6">
              This website doesn't allow previews. Open it in a new tab instead?
            </p>
            <div className="flex flex-col gap-3">
              <button
                className="w-full py-3 rounded-full bg-black text-white font-bold hover:bg-gray-800 transition"
                onClick={() => handleOpenInNewTab(previewUrl!)}
              >
                Open in New Tab
              </button>
              <button
                className="w-full py-3 rounded-full bg-white border border-gray-200 text-gray-900 font-bold hover:bg-gray-50 transition"
                onClick={closePreview}
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
