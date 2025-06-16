import React from "react";
import { Article } from "../lib/types";

interface ArticleCardProps {
  article: Article;
  onDelete?: (articleId: string) => void;
}

export default function ArticleCard({ article, onDelete }: ArticleCardProps) {
  return (
    <div className="relative group">
      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block bg-white rounded-xl shadow-md hover:shadow-lg transition-all border border-gray-200 overflow-hidden"
      >
        <div className="p-6 space-y-4">
          <h3 className="text-xl font-semibold text-blue-700 group-hover:text-blue-800 transition-colors">
            {article.title}
          </h3>
          <p className="text-gray-600">{article.description}</p>
          {article.image && (
            <div className="flex justify-center">
              <img
                src={article.image}
                alt={article.title}
                className="rounded-xl shadow max-h-48 object-cover"
              />
            </div>
          )}
        </div>
      </a>

      {/* Optional delete button if handler is provided */}
      {onDelete && (
        <button
          onClick={() => onDelete(article.id)}
          className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-700"
          title="Delete article"
        >
          ×
        </button>
      )}
    </div>
  );
}
