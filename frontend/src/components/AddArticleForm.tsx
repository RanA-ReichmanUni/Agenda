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
    <div className="bg-white shadow-xl rounded-2xl p-6 border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-800 text-center">Add Source</h2>

      <div className="space-y-4">
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
            Article URL
          </label>
          <input
            id="url"
            type="url"
            placeholder="https://example.com/article"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition bg-gray-50 focus:bg-white"
            required
          />
        </div>
        <button
          onClick={handleFetch}
          disabled={loading || !url}
          className={`w-full py-3 px-4 rounded-xl font-bold text-lg transition-all duration-300 transform active:scale-[0.98]
            ${loading || !url 
              ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200" 
              : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5"}`}
        >
          {loading ? (
             <span className="flex items-center justify-center gap-2">
                 <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                 </svg>
                 Processing...
             </span>
          ) : "Fetch Info"}
        </button>
      </div>

      {loading && (
        <div className="py-8 flex flex-col items-center justify-center space-y-4 animate-fade-in">
           <div className="relative">
             <div className="w-12 h-12 rounded-full border-4 border-blue-100"></div>
             <div className="absolute top-0 left-0 w-12 h-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
           </div>
           <p className="text-gray-500 text-sm font-medium animate-pulse">Analyzing content...</p>
        </div>
      )}

      {error && !loading && (
        <div className="mt-6 text-red-600 bg-red-50 border border-red-200 rounded-xl p-4 text-sm flex items-start gap-2 animate-fade-in">
           <span className="text-lg">⚠️</span>
           <span className="mt-0.5">{error}</span>
        </div>
      )}

      {articleData && !loading && (
        <div className="mt-6 bg-white rounded-xl p-4 border border-gray-200 shadow-md space-y-4 animate-fade-in">
          <h3 className="text-xl font-bold text-gray-800 leading-tight">{articleData.title}</h3>
          <p className="text-gray-600 text-sm leading-relaxed">{articleData.description}</p>

          {articleData.image && (
            <div className="flex justify-center">
              <img
                src={articleData.image}
                alt="Article"
                className="rounded-xl shadow max-h-48 object-cover"
              />
            </div>
          )}

          <button
            onClick={handleAdd}
            className="w-full mt-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-2 px-4 rounded-xl transition shadow-md hover:shadow-lg"
          >
            Add Article
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
