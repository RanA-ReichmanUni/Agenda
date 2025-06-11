import React, { useState } from "react";
import { Article } from "../lib/types";
import { v4 as uuidv4 } from "uuid";

interface AddArticleFormProps {
  onAdd: (article: Article) => void;
}

// ✅ Local interface to describe the structure of metadata returned by /api/extract
interface ArticleMeta {
  title: string;
  description: string;
  image?: string;
}

export default function AddArticleForm({ onAdd }: AddArticleFormProps) {
  const [url, setUrl] = useState(""); // User input for the article URL

  // Store metadata returned from /api/extract
  const [articleData, setArticleData] = useState<ArticleMeta | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch metadata from internal server route using the entered URL
  const handleFetch = async () => {
    setLoading(true);
    setError("");
    setArticleData(null);

    try {
      console.log('Fetching metadata for:', url);
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      // Log the raw response for debugging
      const responseText = await res.text();
      console.log('Raw response:', responseText);

      // Try to parse the response as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        throw new Error('Invalid response from server');
      }

      if (!res.ok) {
        // Construct a more detailed error message
        const errorMessage = [
          data.error,
          data.details,
          data.url ? `URL: ${data.url}` : null,
          data.statusCode ? `Status: ${data.statusCode}` : null
        ].filter(Boolean).join(' - ');
        
        throw new Error(errorMessage || "Unknown error occurred");
      }

      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format from server');
      }

      const fetchedMeta: ArticleMeta = {
        title: data.title || "No title found",
        description: data.description || "No description found",
        image: data.image,
      };

      setArticleData(fetchedMeta);
    } catch (err: any) {
      console.error('Error fetching metadata:', err);
      setError(err.message || "Failed to fetch metadata");
    } finally {
      setLoading(false);
    }
  };

  // Construct full Article and notify parent component
  const handleAdd = () => {
    if (!articleData) return;

    const newArticle: Article = {
      id: uuidv4(),
      title: articleData.title,
      url,
      description: articleData.description,
      image: articleData.image
    };

    onAdd(newArticle);
    setUrl("");
    setArticleData(null);
  };

  return (
    <div className="bg-white shadow-xl rounded-2xl p-6 max-w-xl mx-auto space-y-6 border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-800 text-center">Add Article</h2>

      <div className="space-y-2">
        <label htmlFor="url" className="block text-sm font-medium text-gray-700">
          Article URL
        </label>
        <input
          id="url"
          type="url"
          placeholder="https://example.com/article"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
          required
        />
        <button
          onClick={handleFetch}
          disabled={loading || !url}
          className={`w-full mt-2 py-2 px-4 rounded-xl font-semibold transition 
            ${loading || !url 
              ? "bg-gray-300 cursor-not-allowed" 
              : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg"}`}
        >
          {loading ? "Fetching..." : "Fetch Info"}
        </button>
      </div>

      {error && (
        <div className="text-red-600 bg-red-100 border border-red-200 rounded-xl p-3 text-sm">
          {error}
        </div>
      )}

      {articleData && (
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 shadow-sm space-y-3">
          <h3 className="text-xl font-semibold text-blue-700">{articleData.title}</h3>
          <p className="text-gray-600 text-sm">{articleData.description}</p>

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
    </div>
  );
}
