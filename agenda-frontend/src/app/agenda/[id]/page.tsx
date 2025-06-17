"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AddArticleForm from "../../../components/AddArticleForm";
import { Article } from "../../../lib/types";
import ArticleCard from "../../../components/ArticleCard";
import Link from "next/link";

/**
 * Agenda detail page that loads and displays its articles,
 * and includes a form to add new articles.
 */
export default function AgendaPage() {
  const params = useParams();

  // Handle case where params or id is undefined
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

  // State for agenda info and articles
  const [agenda, setAgenda] = useState<{ title: string; createdAt: string } | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [articleToDelete, setArticleToDelete] = useState<Article | null>(null);

  // Fetch agenda info and articles from backend
  useEffect(() => {
    const fetchAgendaAndArticles = async () => {
      setLoading(true);
      try {
        // Fetch agenda info
        const agendaRes = await fetch(`http://localhost:4000/agendas/${agendaId}`);
        if (!agendaRes.ok) throw new Error("Failed to fetch agenda");
        const agendaData = await agendaRes.json();

        // Fetch articles
        const articlesRes = await fetch(`http://localhost:4000/agendas/${agendaId}/articles`);
        if (!articlesRes.ok) throw new Error("Failed to fetch articles");
        const articlesData = await articlesRes.json();

        setAgenda({
          title: agendaData.title,
          createdAt: agendaData.created_at,
        });
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

  // Add article handler (calls backend, then refreshes list)
  const handleAddArticle = async (newArticle: Omit<Article, "id">) => {
    try {
      const res = await fetch(`http://localhost:4000/agendas/${agendaId}/articles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newArticle),
      });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || "Failed to add article");
      }
      // Refresh articles after adding
      const articlesRes = await fetch(`http://localhost:4000/agendas/${agendaId}/articles`);
      const articlesData = await articlesRes.json();
      setArticles(articlesData);
    } catch (error) {
      alert("Failed to add article: " + (error as Error).message);
    }
  };

  // Remove article handler (calls backend, then refreshes list)
  const handleRemoveArticle = async (articleId: number) => {
    try {
      const res = await fetch(`http://localhost:4000/articles/${articleId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || "Failed to delete article");
      }
      // Refresh articles after deleting
      setArticles((prev) => prev.filter((a) => Number(a.id) !== articleId));
    } catch (error) {
      alert("Failed to delete article: " + (error as Error).message);
    }
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
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 pt-0 pb-2 px-2 md:px-0">
      <div className="max-w-3xl mx-auto space-y-10 scale-85">
        {/* Back Button */}
        <div className="relative z-20 flex justify-start mt-0 mb-2 animate-fade-in">
          <Link href="/" className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/60 backdrop-blur-xl border border-gray-200 shadow-lg text-blue-800 font-semibold text-lg transition hover:bg-blue-100/80 hover:text-blue-900 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            Back
          </Link>
        </div>
        {/* Header Section */}
        <div className="relative z-10 bg-white/60 backdrop-blur-xl border border-gray-200 shadow-2xl rounded-3xl p-8 flex flex-col items-center animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-extrabold text-blue-800 mb-2 drop-shadow-lg tracking-tight">
            {agenda.title}
          </h1>
          <p className="text-base md:text-lg text-gray-700 font-medium mb-2">
            Created at: <span className="font-mono text-blue-700">{new Date(agenda.createdAt).toLocaleString()}</span>
          </p>
        </div>

        {/* Add Article Form */}
        <div className="relative z-10 animate-fade-in-up">
          <AddArticleForm onAdd={handleAddArticle} />
        </div>

        {/* Articles List */}
        <div className="relative z-10 space-y-8 animate-fade-in-up">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-3xl font-bold text-blue-800 tracking-tight flex items-center gap-2">
              <span>Articles</span>
              {articles.length > 0 && (
                <span className="text-base font-normal text-gray-500 ml-2">({articles.length})</span>
              )}
            </h2>
          </div>

          {articles.length === 0 ? (
            <div className="text-center py-16 bg-white/60 backdrop-blur-xl rounded-2xl border border-gray-200 shadow-inner animate-fade-in">
              <p className="text-gray-500 text-lg">No articles yet. Add your first one above!</p>
            </div>
          ) : (
            <div className="grid gap-8 grid-cols-1 md:grid-cols-2">
              {articles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  onDelete={() => setArticleToDelete(article)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Decorative blurred gradient shapes */}
      <div className="fixed top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 opacity-30 rounded-full blur-3xl pointer-events-none -z-10 animate-float" style={{ filter: 'blur(120px)' }} />
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-gradient-to-tr from-pink-400 via-purple-400 to-blue-400 opacity-30 rounded-full blur-3xl pointer-events-none -z-10 animate-float2" style={{ filter: 'blur(120px)' }} />
      {/* Delete Confirmation Modal */}
      {articleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-2xl p-8 max-w-md w-full animate-fade-in">
            <h3 className="text-xl font-bold text-red-700 mb-4 text-center">
              Confirm Deletion
            </h3>
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
