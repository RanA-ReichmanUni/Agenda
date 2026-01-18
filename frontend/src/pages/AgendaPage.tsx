import React, { useEffect, useRef, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import AddArticleForm from "../components/AddArticleForm";
import { Article, Agenda } from "../lib/types";
import ArticleCard from "../components/ArticleCard";
import { API_ENDPOINTS, authFetch } from "../lib/api";
import { useToastContext } from "../context/ToastContext";
import { useDemo } from "../context/DemoContext";
import { useTutorial } from "../context/TutorialContext";
import { DEMO_AGENDA_STEPS, DEMO_MODE_EXPLANATION } from "../lib/tutorialSteps";

export default function AgendaPage() {
  const { id, token } = useParams();
  const location = useLocation();
  const isDemo = location.pathname.startsWith('/demo');
  const isShared = Boolean(token);
  const isReadOnly = isShared;

  const demoContext = useDemo();
  const { startTutorial, hasSeenTutorial, isActive } = useTutorial();

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
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // Share Modal State
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);

  useEffect(() => {
    if (isDemo && !loading && !hasSeenTutorial('agenda') && !isActive) {
        setTimeout(() => {
             startTutorial(DEMO_AGENDA_STEPS, 'agenda');
        }, 800);
    }
  }, [isDemo, loading, startTutorial, hasSeenTutorial, isActive]);

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
                share_token: demoAgenda.share_token
            });
            setArticles(demoAgenda.articles);

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
    } catch (err: any) {
      alert("Failed to add article: " + err.message);
    }
  };

    const restoreLastArticle = async (articleToRestore: Article) => {
    try {
      if (isDemo) {
         const { id, createdAt, agenda_id, ...rest } = articleToRestore;
         await demoContext.createArticle(Number(agendaId), rest);
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

  const handleArticleClick = (url: string) => {
    setIframeError(false);
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
    <div className="min-h-[125vh] bg-gradient-to-br from-white via-gray-50 to-blue-100 pt-0 pb-2 px-2 md:px-0 relative overflow-x-hidden">
      
      {/* Background Orbs */}
      <div className="fixed top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 opacity-30 rounded-full blur-3xl pointer-events-none -z-10 animate-float" style={{ filter: 'blur(120px)' }} />
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-gradient-to-tr from-pink-400 via-purple-400 to-blue-400 opacity-30 rounded-full blur-3xl pointer-events-none -z-10 animate-float2" style={{ filter: 'blur(120px)' }} />

      {/* Demo Banner */}
      {isDemo && (
        <div id="tutorial-demo-banner" className="fixed top-4 left-1/2 transform -translate-x-1/2 z-30 cursor-pointer hover:scale-105 transition-transform" onClick={() => startTutorial(DEMO_MODE_EXPLANATION, 'demo-explanation')}>
          <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 px-4 py-1 rounded-full text-sm font-semibold shadow-md whitespace-nowrap">
            Demo Mode - Local Storage Only
          </div>
        </div>
      )}

      {/* Shared Banner */}
      {isShared && (
         <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-30">
          <div className="bg-blue-100 border border-blue-300 text-blue-800 px-4 py-1 rounded-full text-sm font-semibold shadow-md whitespace-nowrap">
            Shared by {agenda.owner_name || 'User'}
          </div>
        </div>
      )}

      <div className="fixed left-4 md:left-10 top-8 z-30 animate-fade-in flex gap-2">
        {!isShared && (
            <Link
            to={isDemo ? "/demo" : "/"}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/60 backdrop-blur-xl border border-gray-200 shadow-lg text-blue-800 font-semibold text-base transition hover:bg-blue-100/80 hover:text-blue-900 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
            </Link>
        )}
        {/* Share Button (Only Owner) */}
        {!isReadOnly && (
             <button
                onClick={() => setShowShareModal(true)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/60 backdrop-blur-xl border border-gray-200 shadow-lg text-purple-800 font-semibold text-base transition hover:bg-purple-100/80 hover:text-purple-900 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share
            </button>
        )}
      </div>

      <div className="max-w-4xl mx-auto space-y-12 py-12">
        <div className="relative z-10 flex flex-col items-center animate-agenda-header text-center">
            <span className="text-sm font-bold tracking-[0.3em] text-blue-600 uppercase mb-4 opacity-80 animate-subtitle-reveal">My Narrative</span>
            <h1 id="tutorial-agenda-subject" className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-800 via-blue-800 to-gray-900 mb-6 drop-shadow-sm tracking-tight leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
            {agenda.title}
          </h1>
          <div className="flex items-center gap-2 text-sm text-gray-500 font-medium bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-100 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Created <span className="font-mono text-gray-700">{new Date(agenda.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {!isReadOnly && (
            <div id="tutorial-add-article" className="relative z-10 animate-form-float max-w-2xl mx-auto w-full">
            <AddArticleForm onAdd={handleAddArticle} />
            </div>
        )}

        <div className="relative z-10 space-y-8 animate-articles-container">
          <div className="flex items-center mb-6 pl-2 border-l-4 border-blue-500 ml-2">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              The Evidence
              {articles.length > 0 && (
                <sup className="text-sm font-sans text-blue-600 ml-2 font-bold">{articles.length}</sup>
              )}
            </h2>
          </div>

          {articles.length === 0 ? (
            <div className="text-center py-20 bg-white/40 backdrop-blur-md rounded-3xl border border-dashed border-gray-300 animate-empty-state">
              <div className="text-6xl mb-4 opacity-20">📂</div>
              <p className="text-gray-500 text-lg font-medium">No articles yet.</p>
              {!isReadOnly && <p className="text-gray-400 text-sm">Paste a URL above to add your first source.</p>}
            </div>
          ) : (
            <div id="tutorial-evidence-grid" className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {articles.map((article, index) => (
                <div
                  key={article.id}
                  onClick={() => handleArticleClick(article.url)}
                  className="animate-article-card group cursor-pointer"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="h-full bg-white/70 backdrop-blur-md border border-gray-100 hover:border-blue-200 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 p-2 relative overflow-hidden transform hover:-translate-y-1">
                     <ArticleCard
                        article={article}
                        onDelete={!isReadOnly ? () => {
                          setArticleToDelete(article);
                        } : undefined}
                      />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white/90 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-2xl p-8 max-w-md w-full animate-fade-in relative">
            <button 
                onClick={() => setShowShareModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
            <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">Share Agenda</h3>
            
            {shareLoading ? (
                 <div className="flex justify-center p-4"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
            ) : (
                <>
                    {agenda?.share_token ? (
                        <div className="space-y-4">
                            {isDemo && (
                                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs p-2 rounded">
                                    <strong>Demo Mode:</strong> This link is simulated. It will only work in this browser session.
                                </div>
                            )}
                             <p className="text-sm text-gray-600 text-center">
                                Anyone with this link can view this agenda.
                            </p>
                            <div className="flex gap-2">
                                <input 
                                    readOnly 
                                    className="flex-1 bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-600"
                                    value={`${window.location.origin}/shared/${agenda.share_token}`}
                                />
                                <button 
                                    onClick={() => {
                                        navigator.clipboard.writeText(`${window.location.origin}/shared/${agenda.share_token}`);
                                        alert("Link copied!");
                                    }}
                                    className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-200"
                                >
                                    Copy
                                </button>
                            </div>
                            <div className="pt-4 flex justify-center">
                                <button 
                                    onClick={handleUnshare}
                                    className="text-red-600 text-sm font-medium hover:text-red-800 hover:underline"
                                >
                                    Stop sharing
                                </button>
                            </div>
                        </div>
                    ) : (
                         <div className="text-center">
                            <p className="text-gray-600 mb-6">
                                Create a public link to share this agenda with others. They will be able to view it but not edit it.
                            </p>
                            <button
                                onClick={handleShare}
                                className="px-6 py-2 rounded-full bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition w-full"
                            >
                                Generate Link
                            </button>
                        </div>
                    )}
                </>
            )}
          </div>
        </div>
      )}

      {articleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-2xl p-8 max-w-md w-full animate-fade-in">
            <h3 className="text-xl font-bold text-red-700 mb-4 text-center">Confirm Deletion</h3>
            <p className="text-gray-700 text-center mb-6">
              Are you sure you want to delete the article titled <span className="font-semibold text-blue-800">"{articleToDelete.title}"</span>?
            </p>
            <div className="flex justify-center gap-4">
              <button
                className="px-6 py-2 rounded-full bg-red-600 text-white font-semibold shadow hover:bg-red-700 transition"
                onClick={async () => {
                  await handleRemoveArticle(Number(articleToDelete.id));
                  setArticleToDelete(null);
                }}
              >
                Confirm
              </button>
              <button
                className="px-6 py-2 rounded-full bg-gray-200 text-gray-700 font-semibold shadow hover:bg-gray-300 transition"
                onClick={() => setArticleToDelete(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {previewUrl && !iframeError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="relative w-[95vw] h-[95vh] bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
              <button
                onClick={closePreview}
                className="bg-red-600 text-white rounded-full w-16 h-16 flex items-center justify-center hover:bg-red-700 transition focus:outline-none focus:ring-4 focus:ring-red-400 shadow-2xl"
                title="Close preview"
              >
                <span className="text-4xl font-bold leading-none">×</span>
              </button>
              <button
                onClick={() => window.open(previewUrl, "_blank")}
                className="bg-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center hover:bg-blue-700 transition focus:outline-none focus:ring-4 focus:ring-blue-400 shadow-2xl"
                title="Open in new tab"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </button>
            </div>
            <iframe ref={iframeRef} src={previewUrl} title="Article Preview" className="w-full h-full border-0 rounded-2xl" style={{ minHeight: 0, minWidth: 0 }} />
          </div>
        </div>
      )}

      {iframeError && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
          <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-2xl p-8 max-w-md w-full animate-fade-in">
            <h3 className="text-xl font-bold text-blue-800 mb-4 text-center">Website Preview Not Available</h3>
            <p className="text-gray-700 text-center mb-6">
              This website cannot be displayed in the preview. Would you like to open it in a new tab instead?
            </p>
            <div className="flex justify-center gap-4">
              <button className="px-6 py-2 rounded-full bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition" onClick={() => handleOpenInNewTab(previewUrl!)}>
                Open in New Tab
              </button>
              <button className="px-6 py-2 rounded-full bg-gray-200 text-gray-700 font-semibold shadow hover:bg-gray-300 transition" onClick={closePreview}>
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
        
        @keyframes subtitle-reveal { 
          0% { opacity: 0; letter-spacing: 0em; filter: blur(5px); } 
          100% { opacity: 0.8; letter-spacing: 0.3em; filter: blur(0px); } 
        }
        .animate-subtitle-reveal { animation: subtitle-reveal 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }

        @keyframes agenda-header { 0% { opacity: 0; transform: translateY(-20px); } 100% { opacity: 1; transform: translateY(0); } }
        .animate-agenda-header { animation: agenda-header 1s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
        
        @keyframes form-float { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
        .animate-form-float { animation: form-float 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s both; }
        
        @keyframes articles-container { 0% { opacity: 0; } 100% { opacity: 1; } }
        .animate-articles-container { animation: articles-container 0.6s ease-out 0.6s both; }
        
        @keyframes article-card { 0% { opacity: 0; transform: translateY(20px) scale(0.98); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
        .animate-article-card { animation: article-card 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
        
        @keyframes empty-state { 0% { opacity: 0; transform: scale(0.95); } 100% { opacity: 1; transform: scale(1); } }
        .animate-empty-state { animation: empty-state 0.6s ease-out 0.8s both; }
      `}</style>
    </div>
  );
}
