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
    <div className="space-y-4 bg-white p-4 rounded-xl shadow-md">
      <h2 className="text-lg font-semibold">Add Article</h2>

      {/* Input field for URL */}
      <input
        type="url"
        placeholder="Paste article URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="w-full border px-3 py-2 rounded"
        required
      />

      {/* Fetch article metadata */}
      <button
        onClick={handleFetch}
        disabled={loading || !url}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        {loading ? "Fetching..." : "Fetch Info"}
      </button>

      {/* Display error message if fetch fails */}
      {error && <p className="text-red-500">{error}</p>}

      {/* Display fetched article info */}
      {articleData && (
        <div className="border-t pt-4">
          <h3 className="font-semibold text-blue-700">{articleData.title}</h3>
          <p className="text-sm text-gray-600 mt-1">{articleData.description}</p>
          {articleData.image && (
            <img 
              src={articleData.image} 
              alt="Preview" 
              className="mt-2 max-w-sm mx-auto rounded"
            />
          )}

          <button
            onClick={handleAdd}
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Add Article
          </button>
        </div>
      )}
    </div>
  );
}
