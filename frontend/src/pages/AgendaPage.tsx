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
import { AnalysisResult, ArticleScore, normalizeAnalysisResult } from "../lib/types";

// --- Hardcoded Static Analysis Results for Demo Mode ---
// numeric_score follows the production formula: mean per-article support score,
// scaled by corroboration (source count) and domain diversity.
const DEMO_ANALYSIS_RESULTS: Record<number, AnalysisResult> = {
  1: {
    score: 'High',
    numeric_score: 81,
    article_scores: [
      { id: 'a0', title: 'Smartphone design plateaued in 2024', topic: 'Smartphone design stagnation', verdict: 'Relevant', score: 88 },
      { id: 'a1', title: 'Smartphones are boring now — and it\'s our fault', topic: 'Consumer demand for identical phones', verdict: 'Relevant', score: 82 },
      { id: 'a2', title: 'Yes, many flagship phones now look the same', topic: 'Flagship design convergence', verdict: 'Relevant', score: 74 },
      { id: 'a3', title: 'Why do all smartphones look the same', topic: 'Form-factor optimization', verdict: 'Relevant', score: 80 },
    ],
    reasoning: "Analysis of 4 technology sources (Gizmodo, HowToGeek, TechRadar, PhoneArena) indicates a strong consensus. The articles consistently report that form factors have plateaued and become 'boring' due to physical optimization and consumer demand for reliability, supporting the claim.",
    claim: "All Smartphones Are Bland and Boring",
    is_cached: true,
    is_stale: false,
    articleCount: 4
  },
  2: {
    score: 'Medium',
    numeric_score: 67,
    article_scores: [
      { id: 'a0', title: 'Cash is… protection of privacy, identity and data', topic: 'Cash privacy benefits', verdict: 'Relevant', score: 72 },
      { id: 'a1', title: 'Can CBDCs give us the same freedom as cash?', topic: 'Digital currency freedom limits', verdict: 'Relevant', score: 68 },
      { id: 'a2', title: 'Why digital can\'t replace cash', topic: 'Cash anonymity guarantees', verdict: 'Relevant', score: 70 },
      { id: 'a3', title: 'Cash vs Digital Payments: Why Cash is King', topic: 'Transaction fee erosion', verdict: 'Relevant', score: 58 },
    ],
    reasoning: "The provided articles from CashMatters, WEF, and BEUC strongly argue for cash's privacy benefits. However, the claim 'Cash is Superior' is broad; while superior for privacy/anonymity (High confidence), the sources do not comprehensively address convenience or security risks compared to digital, resulting in a Medium overall score for the general superiority claim.",
    claim: "Cash Is Superior to Digital Payments",
    is_cached: true,
    is_stale: false,
    articleCount: 4
  },
  3: {
    score: 'High',
    numeric_score: 83,
    article_scores: [
      { id: 'a0', title: 'Trump and Republicans again face a tough political battle over Obama\'s health care law', topic: 'Political battles over ACA', verdict: 'Relevant', score: 84 },
      { id: 'a1', title: 'The Politics of Health Care and Elections', topic: 'Health care as election weapon', verdict: 'Relevant', score: 78 },
      { id: 'a2', title: 'Why Both Republicans and Democrats Are Wrong About Health Care', topic: 'Partisan health policy trade-offs', verdict: 'Relevant', score: 86 },
    ],
    reasoning: "Sources from PBS, KFF, and NYT provide substantial evidence that political maneuvering often prioritizes election strategy over patient outcomes. The analysis highlights a pattern of 'weaponizing' healthcare policy rather than solving cost/coverage trade-offs, supporting the claim that political interests frequently supersede patient care.",
    claim: "U.S. Health Care Politics Put Insurance Companies First, Patients Second",
    is_cached: true,
    is_stale: false,
    articleCount: 3
  },
  4: {
    score: 'High',
    numeric_score: 85,
    article_scores: [
      { id: 'a0', title: 'MIT Study Finds ChatGPT Can Harm Critical Thinking Over Time', topic: 'EEG evidence of reduced engagement', verdict: 'Relevant', score: 90 },
      { id: 'a1', title: 'ChatGPT\'s Impact On Our Brains According to an MIT Study', topic: 'AI reliance and critical thinking', verdict: 'Relevant', score: 85 },
      { id: 'a2', title: 'Generative AI and the risk of cognitive offloading', topic: 'Cognitive offloading risks', verdict: 'Relevant', score: 79 },
    ],
    reasoning: "Multiple studies cited (including MIT research reported by Time and TechNewsWorld) directly support the claim. The evidence links AI chatbot usage to reduced 'brain engagement' (EEG data) and cognitive offloading, confirming the negative impact on critical thinking skills.",
    claim: "AI Chatbots Make People Dumber",
    is_cached: true,
    is_stale: false,
    articleCount: 3
  },
  5: {
    score: 'Medium',
    numeric_score: 66,
    article_scores: [
      { id: 'a0', title: 'Screen vs. Paper: Which One Boosts Reading Comprehension?', topic: 'Reading comprehension on paper', verdict: 'Relevant', score: 80 },
      { id: 'a1', title: 'Reading on screens instead of paper is a less effective way to absorb and retain information, suggests research', topic: 'Retention research findings', verdict: 'Relevant', score: 76 },
    ],
    reasoning: "Research provided (phys.org, Oxford Learning) supports the sub-claim that paper improves reading comprehension and retention. However, 'Superior' is a subjective value judgment. The evidence strongly supports paper for *learning*, but does not address portability or accessibility where screens excel.",
    claim: "Paper Books Are Superior to Screens",
    is_cached: true,
    is_stale: false,
    articleCount: 2
  },
  6: {
    score: 'High',
    numeric_score: 73,
    article_scores: [
      { id: 'a0', title: 'Early smartphone use linked to poorer mental health in young adults', topic: 'Early smartphone use outcomes', verdict: 'Relevant', score: 88 },
      { id: 'a1', title: 'Smartphones, Social Media, and Their Impact on Mental Health', topic: 'Psychiatric research on phone use', verdict: 'Relevant', score: 84 },
    ],
    reasoning: "The claim is well-supported by the provided medical and psychiatric sources (News-Medical, Columbia Psychiatry). The articles cite specific correlations between early smartphone use and increased rates of suicidal thoughts, aggression, and poor mental health in young adults.",
    claim: "Smartphones Destroying Our Mental Health",
    is_cached: true,
    is_stale: false,
    articleCount: 2
  },
  7: {
    score: 'High',
    numeric_score: 76,
    article_scores: [
      { id: 'a0', title: 'The results are in: The UK\'s four-day week pilot was a resounding success', topic: 'UK four-day week pilot results', verdict: 'Relevant', score: 92 },
      { id: 'a1', title: 'The rise of the 4-day workweek', topic: 'Productivity gains from shorter weeks', verdict: 'Relevant', score: 86 },
    ],
    reasoning: "Evidence from large-scale trials (UK Pilot, Microsoft Japan) cited by Autonomy and APA strongly supports the claim. The data shows clear improvements in revenue, productivity, and reduced burnout, validating the 'Ideal' characterization in a business context.",
    claim: "The 4-Day Work Week Is Ideal",
    is_cached: true,
    is_stale: false,
    articleCount: 2
  },
  8: {
    score: 'High',
    numeric_score: 72,
    article_scores: [
      { id: 'a0', title: 'The Twisted History of Bissli, Israel\'s Most Iconic Snack', topic: 'Snack history and allergy data', verdict: 'Relevant', score: 88 },
      { id: 'a1', title: 'The Twisted History of Bissli, Israel\'s Most Iconic Snack', topic: 'Bamba brand heritage', verdict: 'Relevant', score: 82 },
    ],
    reasoning: "The debate between Bamba and Bissli is a classic cultural standoff, but the evidence leans towards Bamba due to its peanut-powered nutritional profile (and its ability to potentially reduce peanut allergies, as noted in studies). However, this comparison is largely subjective and humoristic in nature—taste is the ultimate arbiter!",
    claim: "במבה עדיפה על ביסלי",
    is_cached: true,
    is_stale: false,
    articleCount: 2
  }
};

// Visual styling for the three reliability bands, shared by chips, bars and modal.
const BAND_STYLES = {
  High: { text: 'text-emerald-700', chip: 'border-emerald-300 bg-emerald-50 text-emerald-700', bar: 'bg-emerald-500', soft: 'border-emerald-200 bg-emerald-50', label: 'High Reliability' },
  Medium: { text: 'text-amber-700', chip: 'border-amber-300 bg-amber-50 text-amber-700', bar: 'bg-amber-500', soft: 'border-amber-200 bg-amber-50', label: 'Moderate Reliability' },
  Low: { text: 'text-rose-700', chip: 'border-rose-300 bg-rose-50 text-rose-700', bar: 'bg-rose-500', soft: 'border-rose-200 bg-rose-50', label: 'Low Reliability' },
} as const;

const bandOf = (score: 'High' | 'Medium' | 'Low' | undefined) => BAND_STYLES[score || 'Low'] || BAND_STYLES.Low;

const bandOfNumeric = (n: number) => (n >= 70 ? BAND_STYLES.High : n >= 40 ? BAND_STYLES.Medium : BAND_STYLES.Low);

export default function AgendaPage() {
  const { id, token } = useParams();
  const location = useLocation();
  const isDemo = location.pathname.startsWith('/demo') || location.pathname.startsWith('/auto-pilot-demo');
  const demoPrefix = location.pathname.startsWith('/auto-pilot-demo') ? '/auto-pilot-demo' : '/demo';
  const isShared = Boolean(token);
  const isReadOnly = isShared;

  const demoContext = useDemo();
  const agendaContext = React.useContext(AgendaContext);
  const { user } = useAuth();
  const { startTutorial, hasSeenTutorial, isActive, isSuppressed, ghostModeCompleted } = useTutorial();
  const isGhostRoute = location.pathname.startsWith('/auto-pilot-demo');

  if (!id && !token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,#f5f7ff,transparent_42%),radial-gradient(circle_at_top_right,#eef5ff,transparent_38%),#f8fafc]">
        <div className="rounded-3xl border border-rose-200 bg-white p-8 shadow-sm">
          <div className="mb-2 text-2xl font-bold text-rose-600">Invalid agenda</div>
          <p className="text-slate-500">Please check the URL and try again.</p>
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
            ...normalizeAnalysisResult(data),
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
          setAnalysisResult(normalizeAnalysisResult(data));
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

        const uniqueDomains = new Set(articles.map(a => {
          try { return new URL(a.url).hostname.replace('www.', ''); } catch { return a.url || 'unknown_source'; }
        })).size;

        // Per-article simulated support score, mirroring the backend formula:
        // keyword evidence boosts the individual score, then the aggregate is
        // scaled by corroboration (source count) and domain diversity.
        const articleScores: ArticleScore[] = articles.map((a, i) => {
          const blob = (a.title + " " + (a.description || "")).toLowerCase();
          const keywordHits = authoritativeKeywords.filter(kw => blob.includes(kw)).length;
          return {
            id: `a${i}`,
            title: a.title,
            verdict: 'Relevant',
            score: Math.min(95, 55 + keywordHits * 12),
          };
        });

        const base = articleScores.reduce((sum, a) => sum + a.score, 0) / Math.max(1, articleScores.length);
        const relevantCount = articleScores.filter(a => a.score >= 40).length;
        const corroboration = Math.min(1, 0.55 + 0.15 * relevantCount);
        const diversity = relevantCount ? Math.min(1, 0.85 + 0.15 * (uniqueDomains / relevantCount)) : 1;
        const numericScore = Math.max(0, Math.min(100, Math.round(base * corroboration * diversity)));

        let score: 'High' | 'Medium' | 'Low' = 'Low';
        let reasoningDetail = "";

        if (numericScore >= 70) {
          score = 'High';
          reasoningDetail = `Strong consensus detected across about ${uniqueDomains} unique domains. The semantic analysis identified authoritative terminology (e.g., study, data) that strongly supports the claim.`;
        } else if (numericScore >= 40) {
          score = 'Medium';
          reasoningDetail = `Evidence is present (${count} sources) and appears relevant. Usage of ${uniqueDomains === 1 ? 'a single source' : 'diverse sources'} provides a partial correlation. Adding one more distinct source would likely elevate this to a high confidence level.`;
        } else {
          score = 'Low';
          reasoningDetail = `Insufficient data density. With only ${count} source(s) and limited cross-referencing, the claim lacks the verifiable weight required for a definitive rating.`;
        }

        setAnalysisResult({
          score,
          numeric_score: numericScore,
          article_scores: articleScores,
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
          setAnalysisResult(normalizeAnalysisResult(data));
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
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,#f5f7ff,transparent_42%),radial-gradient(circle_at_top_right,#eef5ff,transparent_38%),#f8fafc]">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,#f5f7ff,transparent_42%),radial-gradient(circle_at_top_right,#eef5ff,transparent_38%),#f8fafc]">
        <div className="rounded-3xl border border-rose-200 bg-white p-8 shadow-sm">
          <div className="mb-2 text-2xl font-bold text-rose-600">{error}</div>
          <p className="text-slate-500">Something went wrong. Please try again later.</p>
        </div>
      </div>
    );
  }

  if (!agenda) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,#f5f7ff,transparent_42%),radial-gradient(circle_at_top_right,#eef5ff,transparent_38%),#f8fafc]">
        <div className="rounded-3xl border border-rose-200 bg-white p-8 shadow-sm">
          <div className="mb-2 text-2xl font-bold text-rose-600">Agenda not found</div>
          <p className="text-slate-500">Please check the URL and try again.</p>
        </div>
      </div>
    );
  }

  const numericScore = analysisResult?.numeric_score ?? null;
  const band = numericScore != null ? bandOfNumeric(numericScore) : bandOf(analysisResult?.score);
  const ownerName = isShared ? (agenda.owner_name || 'User') : (user?.name || user?.email || 'User');

  // Map per-article support scores back onto the evidence list (fresh results only).
  const scoreByTitle = new Map<string, number>();
  if (analysisResult && !analysisResult.is_stale && analysisResult.article_scores) {
    for (const s of analysisResult.article_scores) {
      if (s.title) scoreByTitle.set(s.title, s.score);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#f5f7ff,transparent_42%),radial-gradient(circle_at_top_right,#eef5ff,transparent_38%),#f8fafc] pb-24">

      {/* Shared Banner */}
      {isShared && (
        <div className="bg-gradient-to-r from-blue-800 to-purple-800 py-1.5 text-center text-sm font-semibold text-white">
          Shared by {agenda.owner_name || 'User'} · read-only
        </div>
      )}

      {/* Top Navigation */}
      <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-[min(1120px,92vw)] items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to={isDemo ? demoPrefix : "/"}
              className="-ml-2 rounded-full p-2 text-slate-600 transition-colors hover:bg-slate-100"
              title="Back to agendas"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <span
              className="bg-gradient-to-r from-blue-900 via-blue-700 to-purple-800 bg-clip-text text-lg font-black tracking-tighter text-transparent"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              AGENDA
            </span>
            <span className="hidden text-xs font-semibold uppercase tracking-[0.25em] text-slate-400 sm:inline">Claim Dossier</span>
          </div>

          {!isReadOnly && (
            <button
              id="tutorial-share-button"
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-1.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              title="Share Agenda"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Share
            </button>
          )}
        </div>
      </div>

      {/* Demo Banner */}
      {isDemo && (
        <div className="flex justify-center pt-5">
          <div
            id="tutorial-demo-banner"
            className="cursor-pointer rounded-full border border-amber-300 bg-amber-100 px-4 py-1 text-sm font-semibold text-amber-900"
            onClick={() => startTutorial(DEMO_MODE_EXPLANATION, 'demo-explanation')}
          >
            Demo Mode - Local Storage Only
          </div>
        </div>
      )}

      <div className="mx-auto mt-6 flex w-[min(1120px,92vw)] flex-col gap-6 lg:flex-row">
        {/* Left rail: claim + verification */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:h-fit lg:w-[380px]">
          {/* Claim card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-blue-700">Claim</p>

            {isEditingTitle && !isReadOnly ? (
              <div className="relative mt-2 flex w-full items-center">
                <input
                  autoFocus
                  type="text"
                  value={editTitleValue}
                  onChange={(e) => setEditTitleValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleUpdateTitle(); if (e.key === 'Escape') cancelEditingTitle(); }}
                  onBlur={handleUpdateTitle}
                  className="w-full rounded-xl border border-blue-300 bg-slate-50 px-3 py-2 text-xl font-bold outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isUpdatingTitle}
                />
                {isUpdatingTitle && (
                  <div className="absolute right-3 h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                )}
              </div>
            ) : (
              <div className="group relative mt-2">
                <h2
                  id="tutorial-agenda-subject"
                  className="break-words text-2xl font-black leading-snug text-slate-900"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {agenda.title}
                </h2>
                {!isReadOnly && (
                  <button
                    onClick={startEditingTitle}
                    className="absolute -right-2 -top-1 rounded-full p-2 text-slate-400 opacity-0 transition hover:bg-slate-100 hover:text-blue-600 group-hover:opacity-100"
                    title="Edit Title"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                )}
              </div>
            )}

            <div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 text-sm font-bold text-white">
                {ownerName[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-slate-900">{ownerName}</div>
                <div className="text-xs text-slate-500">Filed {new Date(agenda.createdAt).toLocaleDateString()} · {articles.length} {articles.length === 1 ? 'source' : 'sources'}</div>
              </div>
            </div>
          </div>

          {/* Verification card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-blue-700">AI Verification</p>
              {analysisResult?.is_stale && (
                <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                  Outdated
                </span>
              )}
            </div>

            {analysisResult && !isAnalyzing ? (
              <div className="mt-3">
                <div className="flex items-end justify-between gap-3">
                  {numericScore != null ? (
                    <div className="flex items-end gap-1.5">
                      <span className={`text-5xl font-black leading-none ${band.text}`}>{numericScore}</span>
                      <span className="pb-1 text-sm font-semibold text-slate-400">/ 100</span>
                    </div>
                  ) : (
                    <span className={`text-2xl font-black ${band.text}`}>{analysisResult.score}</span>
                  )}
                  <span className={`rounded-full border px-3 py-1 text-xs font-bold ${band.chip}`}>
                    {band.label}
                  </span>
                </div>
                {numericScore != null && (
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full ${band.bar}`} style={{ width: `${numericScore}%` }} />
                  </div>
                )}
              </div>
            ) : !isAnalyzing ? (
              <p className="mt-3 text-sm leading-relaxed text-slate-500">
                Not yet verified. The AI pipeline reads each source and scores how credibly the evidence supports this claim.
              </p>
            ) : (
              <p className="mt-3 text-sm leading-relaxed text-slate-500">
                Reading sources and cross-referencing the claim…
              </p>
            )}

            <button
              id="analyze-agenda-btn"
              onClick={() => handleAnalyzeClaim(false)}
              disabled={isAnalyzing}
              className={`mt-4 flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition
                ${isAnalyzing
                  ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                  : analysisResult
                    ? 'border border-slate-300 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50'
                    : 'bg-gradient-to-r from-blue-700 to-purple-700 text-white shadow-lg shadow-blue-700/20 hover:shadow-xl'}
              `}
            >
              {isAnalyzing ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  <span>Verifying…</span>
                </>
              ) : analysisResult ? (
                <span>View full report</span>
              ) : (
                <span>Run AI Verification</span>
              )}
            </button>

            {analysisResult?.is_stale && !isAnalyzing && (
              <button
                onClick={() => handleAnalyzeClaim(true)}
                className="mt-2 w-full rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-900 transition hover:bg-amber-200"
              >
                Re-run analysis
              </button>
            )}
          </div>
        </aside>

        {/* Right: evidence board */}
        <main className="min-w-0 flex-1 space-y-5">
          {!isReadOnly && (
            <div id="tutorial-add-article">
              <AddArticleForm onAdd={handleAddArticle} />
            </div>
          )}

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Evidence Board</h3>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {articles.length} {articles.length === 1 ? 'Source' : 'Sources'}
              </span>
            </div>

            {articles.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                <p className="mb-1 text-lg font-bold text-slate-700">No evidence yet.</p>
                {!isReadOnly && <p className="text-sm text-slate-400">Paste an article URL above to start building the case.</p>}
              </div>
            ) : (
              <div id="tutorial-evidence-grid" className="space-y-3">
                {articles.map((article) => (
                  <div
                    key={article.id}
                    onClick={() => handleArticleClick(article.url)}
                    className="cursor-pointer transition hover:-translate-y-0.5"
                  >
                    <ArticleCard
                      article={article}
                      supportScore={scoreByTitle.get(article.title)}
                      onDelete={!isReadOnly ? () => {
                        setArticleToDelete(article);
                      } : undefined}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>

      {/* Modals from before */}
      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-blue-700">Publish</p>
                <h3 className="text-xl font-bold text-slate-900">Share this dossier</h3>
              </div>
              <button
                id="close-share-modal-btn"
                onClick={() => setShowShareModal(false)}
                className="rounded-full p-2 transition hover:bg-slate-100"
              >
                <svg className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {shareLoading ? (
              <div className="flex justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600"></div></div>
            ) : (
              <>
                {agenda?.share_token ? (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-600">
                      Anyone with this link can view the claim, its evidence and the AI verification — read-only.
                    </p>
                    <div className="flex gap-2">
                      <input
                        readOnly
                        className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 outline-none"
                        value={`${window.location.origin}/shared/${agenda.share_token}`}
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/shared/${agenda.share_token}`);
                          alert("Link copied!");
                        }}
                        className="rounded-full bg-gradient-to-r from-blue-700 to-purple-700 px-4 py-2 text-sm font-bold text-white transition hover:shadow-lg"
                      >
                        Copy
                      </button>
                    </div>
                    <div className="pt-1">
                      <button
                        onClick={handleUnshare}
                        className="text-sm font-bold text-rose-500 hover:underline"
                      >
                        Stop sharing
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="mb-6 text-sm text-slate-600">
                      Create a public link so anyone can audit this narrative — sources, scores and all. Viewers can't edit.
                    </p>
                    <button
                      onClick={handleShare}
                      className="w-full rounded-full bg-gradient-to-r from-blue-700 to-purple-700 px-6 py-2.5 font-bold text-white shadow-lg shadow-blue-700/20 transition hover:shadow-xl"
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
          <div className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 p-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-blue-700">AI Verification</p>
                <h3 className="text-lg font-bold text-slate-900">Credibility Report</h3>
              </div>
              <button onClick={() => setShowAnalysisModal(false)} className="rounded-full p-2 transition-colors hover:bg-slate-200">
                <svg className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-grow overflow-y-auto p-6">
              <p className="text-center text-sm font-medium text-slate-500">"{analysisResult.claim}"</p>

              {/* Score hero */}
              <div className={`mt-4 rounded-2xl border p-5 ${band.soft}`}>
                <div className="flex items-end justify-between gap-3">
                  {numericScore != null ? (
                    <div className="flex items-end gap-1.5">
                      <span className={`text-6xl font-black leading-none ${band.text}`}>{numericScore}</span>
                      <span className="pb-1.5 text-sm font-semibold text-slate-500">/ 100</span>
                    </div>
                  ) : (
                    <span className={`text-4xl font-black ${band.text}`}>{analysisResult.score}</span>
                  )}
                  <span className={`rounded-full border px-3 py-1 text-xs font-bold ${band.chip}`}>
                    {band.label}
                  </span>
                </div>
                {numericScore != null && (
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/70">
                    <div className={`h-full rounded-full ${band.bar}`} style={{ width: `${numericScore}%` }} />
                  </div>
                )}
              </div>

              {analysisResult.is_stale && (
                <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-bold text-amber-800">⚠️ Outdated rating — the claim or evidence changed since this analysis ran.</p>
                  <button
                    onClick={() => handleAnalyzeClaim(true)}
                    className="w-full rounded-full bg-amber-200 py-2 text-sm font-bold text-amber-900 transition hover:bg-amber-300"
                  >
                    Re-run analysis
                  </button>
                </div>
              )}

              {/* Per-source breakdown */}
              {analysisResult.article_scores && analysisResult.article_scores.length > 0 && (
                <div className="mt-5">
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Source breakdown</h4>
                  <div className="space-y-2">
                    {analysisResult.article_scores.map((s, i) => {
                      const sBand = bandOfNumeric(s.score);
                      return (
                        <div key={s.id || i} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                          <div className="flex items-center justify-between gap-3">
                            <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700" title={s.title || s.topic || ''}>
                              {s.title || s.topic || `Source ${i + 1}`}
                            </span>
                            <span className={`shrink-0 text-sm font-bold ${sBand.text}`}>{s.score}</span>
                          </div>
                          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-slate-100">
                            <div className={`h-full rounded-full ${sBand.bar}`} style={{ width: `${s.score}%` }} />
                          </div>
                          {s.topic && s.title && (
                            <p className="mt-1 truncate text-xs text-slate-400">{s.topic}{s.verdict ? ` · ${s.verdict}` : ''}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
                    Overall score = average per-source support × corroboration (number of relevant sources) × source diversity (unique outlets).
                  </p>
                </div>
              )}

              <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Reasoning</h4>
                <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
                  {analysisResult.reasoning}
                </p>
              </div>
            </div>
            <div className="flex justify-end border-t border-slate-100 p-4">
              <button
                id="close-analysis-btn"
                onClick={() => setShowAnalysisModal(false)}
                className="rounded-full bg-slate-900 px-6 py-2 font-bold text-white transition-colors hover:bg-slate-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Article Modal */}
      {articleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="mb-2 text-xl font-bold text-slate-900">Delete evidence?</h3>
            <p className="mb-6 text-sm text-slate-600">
              This removes <span className="font-semibold text-slate-900">"{articleToDelete.title}"</span> from the dossier.
            </p>
            <div className="flex gap-3">
              <button
                className="flex-1 rounded-full bg-rose-600 px-4 py-2.5 font-semibold text-white transition hover:bg-rose-700"
                onClick={async () => {
                  await handleRemoveArticle(Number(articleToDelete.id));
                  setArticleToDelete(null);
                }}
              >
                Delete
              </button>
              <button
                className="flex-1 rounded-full border border-slate-200 bg-white px-4 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-2xl">🔗</div>
            <h3 className="mb-2 text-xl font-bold text-slate-900">Preview blocked</h3>
            <p className="mb-6 text-sm text-slate-600">
              This website doesn't allow embedded previews. Open it in a new tab instead?
            </p>
            <div className="flex flex-col gap-3">
              <button
                className="w-full rounded-full bg-slate-900 py-2.5 font-bold text-white transition hover:bg-slate-700"
                onClick={() => handleOpenInNewTab(previewUrl!)}
              >
                Open in New Tab
              </button>
              <button
                className="w-full rounded-full border border-slate-200 bg-white py-2.5 font-bold text-slate-700 transition hover:bg-slate-50"
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
