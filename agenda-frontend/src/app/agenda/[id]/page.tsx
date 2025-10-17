"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import AddArticleForm from "../../../components/AddArticleForm";
import { Article } from "../../../lib/types";
import ArticleCard from "../../../components/ArticleCard";
import Link from "next/link";
import { API_ENDPOINTS } from "../../../lib/api";

/**
 * Agenda detail page that loads and displays its articles,
 * and includes a form to add new articles.
 */
export default function AgendaPage() {
  const params = useParams();

  if (!params || !params.id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
        <div className="backdrop-blur-xl bg-white/60 border border-red-200 rounded-2xl p-8 shadow-2xl animate-fade-in">
          <div className="text-3xl font-bold text-red-600 mb-2">Invalid agenda ID</div>
          <p className="text-gray-500">Please check the URL and try again.</p>
        </div>
      </div>
    );
  }

  const agendaId = params.id as string;

  const [agenda, setAgenda] = useState<{ title: string; createdAt: string } | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [articleToDelete, setArticleToDelete] = useState<Article | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [iframeError, setIframeError] = useState<boolean>(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Fetch agenda & articles
  useEffect(() => {
    const fetchAgendaAndArticles = async () => {
      setLoading(true);
      try {
        const agendaRes = await fetch(API_ENDPOINTS.agenda(agendaId));
        if (!agendaRes.ok) throw new Error("Failed to fetch agenda");
        const agendaData = await agendaRes.json();

        const articlesRes = await fetch(API_ENDPOINTS.articles(agendaId));
        if (!articlesRes.ok) throw new Error("Failed to fetch articles");
        const articlesData = await articlesRes.json();

        setAgenda({ title: agendaData.title, createdAt: agendaData.created_at });
        setArticles(articlesData);
        setError(null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAgendaAndArticles();
  }, [agendaId]);

  // Add article
  const handleAddArticle = async (newArticle: Omit<Article, "id">) => {
    try {
      const res = await fetch(API_ENDPOINTS.articles(agendaId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newArticle),
      });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || "Failed to add article");
      }
      const updated = await fetch(API_ENDPOINTS.articles(agendaId));
      setArticles(await updated.json());
    } catch (err: any) {
      alert("Failed to add article: " + err.message);
    }
  };

  // Remove article
  const handleRemoveArticle = async (articleId: number) => {
    try {
      const res = await fetch(API_ENDPOINTS.article(articleId), { method: "DELETE" });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || "Failed to delete article");
      }
      setArticles((prev) => prev.filter((a) => Number(a.id) !== articleId));
    } catch (err: any) {
      alert("Failed to delete article: " + err.message);
    }
  };

  // Immediately open preview, then HEAD-check
  const handleArticleClick = (url: string) => {
    setIframeError(false);
    setPreviewUrl(url); // open the modal right away

    fetch(`/api/check-iframe?url=${encodeURIComponent(url)}`)
      .then((res) => res.json())
      .then(({ blocked }) => {
        if (blocked) {
          setIframeError(true);
          // previewUrl remains, so the error dialog has the correct link
        }
      })
      .catch(() => {
        setIframeError(true);
      });
  };

  // Close preview and/or error dialog
  const closePreview = () => {
    setPreviewUrl(null);
    setIframeError(false);
  };

  // Open in new tab
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-yellow-50 to-black-50 pt-0 pb-2 px-2 md:px-0">
      {/* Back Button */}
      <div className="fixed left-10 top-8 z-30 animate-fade-in">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/60 backdrop-blur-xl border border-gray-200 shadow-lg text-blue-800 font-semibold text-base transition hover:bg-blue-100/80 hover:text-blue-900 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>
      </div>

      <div className="max-w-3xl mx-auto space-y-10 scale-85">
        {/* Header */}
        <div className="relative z-10 bg-white/60 backdrop-blur-xl border border-gray-200 shadow-2xl rounded-3xl p-8 flex flex-col items-center animate-agenda-header">
          <h1 className="text-4xl md:text-5xl font-extrabold text-blue-800 mb-2 drop-shadow-lg tracking-tight animate-agenda-title">
            {agenda.title}
          </h1>
          <p className="text-base md:text-lg text-gray-700 font-medium mb-2 animate-agenda-date">
            Created at:{" "}
            <span className="font-mono text-blue-700">{new Date(agenda.createdAt).toLocaleString()}</span>
          </p>
        </div>

        {/* Add Article Form */}
        <div className="relative z-10 animate-form-float">
          <AddArticleForm onAdd={handleAddArticle} />
        </div>

        {/* Articles List */}
        <div className="relative z-10 space-y-8 animate-articles-container">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-3xl font-bold text-blue-800 tracking-tight flex items-center gap-2 animate-section-title">
              <span>Articles</span>
              {articles.length > 0 && (
                <span className="text-base font-normal text-gray-500 ml-2">({articles.length})</span>
              )}
            </h2>
          </div>

          {articles.length === 0 ? (
            <div className="text-center py-16 bg-white/60 backdrop-blur-xl rounded-2xl border border-gray-200 shadow-inner animate-empty-state">
              <p className="text-gray-500 text-lg">No articles yet. Add your first one above!</p>
            </div>
          ) : (
            <div className="grid gap-8 grid-cols-1 md:grid-cols-2">
              {articles.map((article, index) => (
                <div 
                  key={article.id} 
                  onClick={() => handleArticleClick(article.url)} 
                  className="cursor-pointer animate-article-card"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <ArticleCard
                    article={article}
                    onDelete={(e) => {
                      e.stopPropagation?.();
                      setArticleToDelete(article);
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {articleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-2xl p-8 max-w-md w-full animate-fade-in">
            <h3 className="text-xl font-bold text-red-700 mb-4 text-center">Confirm Deletion</h3>
            <p className="text-gray-700 text-center mb-6">
              Are you sure you want to delete the article titled{" "}
              <span className="font-semibold text-blue-800">"{articleToDelete.title}"</span>?
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

      {/* Preview Modal (hidden when iframeError) */}
      {previewUrl && !iframeError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="relative w-[95vw] h-[95vh] bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
            {/* Close + Full View Buttons */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
              {/* Close */}
              <button
                onClick={closePreview}
                className="bg-red-600 text-white rounded-full w-16 h-16 flex items-center justify-center hover:bg-red-700 transition focus:outline-none focus:ring-4 focus:ring-red-400 shadow-2xl"
                title="Close preview"
              >
                <span className="text-4xl font-bold leading-none">×</span>
              </button>
              {/* Full View */}
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
            <iframe
              ref={iframeRef}
              src={previewUrl}
              title="Article Preview"
              className="w-full h-full border-0 rounded-2xl"
              style={{ minHeight: 0, minWidth: 0 }}
            />
          </div>
        </div>
      )}

      {/* Iframe Error Dialog */}
      {iframeError && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
          <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-2xl p-8 max-w-md w-full animate-fade-in">
            <h3 className="text-xl font-bold text-blue-800 mb-4 text-center">Website Preview Not Available</h3>
            <p className="text-gray-700 text-center mb-6">
              This website cannot be displayed in the preview. Would you like to open it in a new tab instead?
            </p>
            <div className="flex justify-center gap-4">
              <button
                className="px-6 py-2 rounded-full bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition"
                onClick={() => handleOpenInNewTab(previewUrl!)}
              >
                Open in New Tab
              </button>
              <button
                className="px-6 py-2 rounded-full bg-gray-200 text-gray-700 font-semibold shadow hover:bg-gray-300 transition"
                onClick={closePreview}
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

        /* New agenda page animations */
        @keyframes agenda-header {
          0% {
            opacity: 0;
            transform: translateY(-50px) rotate(-2deg);
          }
          100% {
            opacity: 1;
            transform: translateY(0) rotate(0);
          }
        }
        .animate-agenda-header {
          animation: agenda-header 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }

        @keyframes agenda-title {
          0% {
            opacity: 0;
            transform: scale(0.8) translateX(-20px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateX(0);
          }
        }
        .animate-agenda-title {
          animation: agenda-title 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both;
        }

        @keyframes agenda-date {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-agenda-date {
          animation: agenda-date 0.6s ease-out 0.4s both;
        }

        @keyframes form-float {
          0% {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-form-float {
          animation: form-float 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.6s both;
        }

        @keyframes articles-container {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }
        .animate-articles-container {
          animation: articles-container 0.6s ease-out 0.8s both;
        }

        @keyframes section-title {
          0% {
            opacity: 0;
            transform: translateX(-20px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-section-title {
          animation: section-title 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.9s both;
        }

        @keyframes article-card {
          0% {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-article-card {
          animation: article-card 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }

        @keyframes empty-state {
          0% {
            opacity: 0;
            transform: scale(0.9);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-empty-state {
          animation: empty-state 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 1s both;
        }
      `}</style>
    </div>
  );
}
