import React from "react";
import { Article } from "../lib/types";

interface ArticleCardProps {
  article: Article;
  onDelete?: (articleId: string) => void;
}

// Extract source domain from URL
const extractSourceName = (url: string): string => {
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    // Capitalize first letter of each word
    return domain
      .split('.')
      .slice(0, -1) // Remove TLD (.com, .org, etc.)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  } catch {
    return 'Unknown Source';
  }
};

export default function ArticleCard({ article, onDelete }: ArticleCardProps) {
  const sourceName = extractSourceName(article.url);
  const fallbackImage = 'https://via.placeholder.com/800x600/e5e7eb/6b7280?text=No+Image';
  
  return (
    <div className="relative group aspect-[16/9] overflow-hidden cursor-pointer">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
        style={{ 
          backgroundImage: `url(${article.image || fallbackImage})`,
          backgroundColor: '#e5e7eb'
        }}
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      
      {/* Content Overlay */}
      <div className="absolute inset-0 flex flex-col justify-end p-6">
        <div className="space-y-2">
          <p className="text-sm font-medium text-white/90 uppercase tracking-wide">
            {sourceName}
          </p>
          <h3 className="text-xl md:text-2xl font-bold text-white line-clamp-3 leading-tight">
            {article.title}
          </h3>
        </div>
      </div>

      {/* Delete Button */}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(article.id);
          }}
          className="absolute top-3 right-3 bg-red-600/90 backdrop-blur-sm text-white rounded-full w-9 h-9 flex items-center justify-center hover:bg-red-700 transition focus:outline-none focus:ring-2 focus:ring-red-400 shadow-lg opacity-0 group-hover:opacity-100"
          title="Delete article"
        >
          <span className="text-xl font-bold leading-none">×</span>
        </button>
      )}
    </div>
  );
}
