import React, { useState } from "react";
import { Article } from "../lib/types";
import { v4 as uuidv4 } from "uuid";
import { API_ENDPOINTS } from "../lib/api";

interface AddArticleFormProps {
  onAdd: (article: Article) => void;
}

interface ArticleMeta {
  title: string;
  description: string;
  image?: string;
}

export default function AddArticleForm({ onAdd }: AddArticleFormProps) {
  const [url, setUrl] = useState("");
  const [articleData, setArticleData] = useState<ArticleMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFetch = async () => {
    setLoading(true);
    setError("");
    setArticleData(null);

    try {
      const res = await fetch(API_ENDPOINTS.extract, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const responseText = await res.text();
      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error("Invalid response from server");
      }

      if (!res.ok) {
        const errorMessage = [
          data.error,
          data.details,
          data.url ? `URL: ${data.url}` : null,
          data.statusCode ? `Status: ${data.statusCode}` : null,
        ]
          .filter(Boolean)
          .join(" - ");
        throw new Error(errorMessage || "Unknown error occurred");
      }

      const fetchedMeta: ArticleMeta = {
        title: data.title || "No title found",
        description: data.description || "No description found",
        image: data.image,
      };

      setArticleData(fetchedMeta);
    } catch (err: any) {
      setError(err.message || "Failed to fetch metadata");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    if (!articleData) return;
    const newArticle: Article = {
      id: uuidv4(),
      title: articleData.title,
      url,
      description: articleData.description,
      image: articleData.image,
    };
    onAdd(newArticle);
    setUrl("");
    setArticleData(null);
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-blue-700">Evidence</p>
      <h2 className="mt-1 text-lg font-bold text-slate-900">Add a source</h2>
      <p className="mt-1 text-sm text-slate-500">Paste any article URL — title, image and description are extracted automatically.</p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          id="add-article-url"
          data-testid="add-article-url"
          type="url"
          placeholder="https://example.com/article"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="min-w-0 flex-1 rounded-full border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <button
          id="add-article-submit"
          data-testid="add-article-submit"
          onClick={handleFetch}
          disabled={loading || !url}
          className={`shrink-0 rounded-full px-6 py-2.5 text-sm font-semibold transition
            ${loading || !url
              ? "cursor-not-allowed bg-slate-100 text-slate-400"
              : "bg-gradient-to-r from-blue-700 to-purple-700 text-white shadow-lg shadow-blue-700/20 hover:shadow-xl"}`}
        >
          {loading ? (
             <span className="flex items-center justify-center gap-2">
                 <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                 </svg>
                 Fetching…
             </span>
          ) : "Fetch Info"}
        </button>
      </div>

      {loading && (
        <div className="animate-fade-in flex flex-col items-center justify-center space-y-3 py-8">
           <div className="relative">
             <div className="h-10 w-10 rounded-full border-4 border-blue-100"></div>
             <div className="absolute left-0 top-0 h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
           </div>
           <p className="animate-pulse text-sm font-medium text-slate-500">Extracting metadata…</p>
        </div>
      )}

      {error && !loading && (
        <div className="animate-fade-in mt-4 flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
           <span className="text-lg">⚠️</span>
           <span className="mt-0.5">{error}</span>
        </div>
      )}

      {articleData && !loading && (
        <div className="animate-fade-in mt-4 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-bold leading-tight text-slate-900">{articleData.title}</h3>
              <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-slate-600">{articleData.description}</p>
            </div>
            {articleData.image && (
              <img
                src={articleData.image}
                alt="Article"
                className="h-20 w-28 shrink-0 rounded-xl border border-slate-200 object-cover"
              />
            )}
          </div>

          <button
            id="add-article-final-btn"
            data-testid="add-article-final-btn"
            onClick={handleAdd}
            className="w-full rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 hover:shadow-md"
          >
            Add to Evidence Board
          </button>
        </div>
      )}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
      `}</style>
    </div>
  );
}
