import React from "react";
import { Article } from "../lib/types";

interface ArticleCardProps {
  article: Article;
  onDelete?: (articleId: string) => void;
}

export default function ArticleCard({ article, onDelete }: ArticleCardProps) {
  return (
    <div className="relative group">
      <div className="block bg-white rounded-xl shadow-md hover:shadow-lg transition-all border border-gray-200 overflow-hidden">
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
      </div>

      {/* Optional delete button if handler is provided */}
      {onDelete && (
        <button
          onClick={() => onDelete(article.id)}
          className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center hover:bg-red-700 transition focus:outline-none focus:ring-2 focus:ring-red-400 shadow"
          title="Delete article"
          style={{ padding: 0 }}
        >
          <span className="text-base font-bold leading-none" style={{ lineHeight: 1 }}>×</span>
        </button>
      )}
    </div>
  );
}
