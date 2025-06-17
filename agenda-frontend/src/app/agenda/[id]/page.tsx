"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AddArticleForm from "../../../components/AddArticleForm";
import { Article } from "../../../lib/types";
import ArticleCard from "../../../components/ArticleCard";

/**
 * Agenda detail page that loads and displays its articles,
 * and includes a form to add new articles.
 */
export default function AgendaPage() {
  const params = useParams();

  // Handle case where params or id is undefined
  if (!params || !params.id) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-600">
            Invalid agenda ID
          </div>
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
      setArticles((prev) => prev.filter((a) => a.id !== articleId));
    } catch (error) {
      alert("Failed to delete article: " + (error as Error).message);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-600">
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!agenda) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-600">
            Agenda not found
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="bg-white shadow-xl rounded-2xl p-6 border border-gray-200">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{agenda.title}</h1>
          <p className="text-sm text-gray-500">
            Created at: {new Date(agenda.createdAt).toLocaleString()}
          </p>
        </div>

        {/* Add Article Form */}
        <div>
          <AddArticleForm onAdd={handleAddArticle} />
        </div>

        {/* Articles List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-800">
              Articles
              {articles.length > 0 && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({articles.length})
                </span>
              )}
            </h2>
          </div>

          {articles.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-gray-500">No articles yet. Add your first one above!</p>
            </div>
          ) : (
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
              {articles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  onDelete={() => handleRemoveArticle(article.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
