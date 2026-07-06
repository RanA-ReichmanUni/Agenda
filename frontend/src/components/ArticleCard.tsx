import React from "react";
import { Article } from "../lib/types";

interface ArticleCardProps {
  article: Article;
  onDelete?: (articleId: string) => void;
  /** 0-100 per-article AI support score, shown when a fresh analysis exists */
  supportScore?: number;
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

const scoreChipStyle = (score: number) =>
  score >= 70
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : score >= 40
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : "border-rose-200 bg-rose-50 text-rose-700";

export default function ArticleCard({ article, onDelete, supportScore }: ArticleCardProps) {
  const sourceName = extractSourceName(article.url);
  const fallbackImage = 'https://via.placeholder.com/800x600/e5e7eb/6b7280?text=No+Image';
  const hostname = (() => {
    try {
      return new URL(article.url).hostname.replace('www.', '');
    } catch {
      return 'unknown-source';
    }
  })();
  const favicon = `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
  
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-3">
      <div className="flex gap-3">
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
            <img src={favicon} alt="Source icon" className="h-4 w-4 rounded-sm" />
            <span className="font-semibold uppercase tracking-wide text-slate-700">{sourceName}</span>
            <span className="text-slate-300">|</span>
            <span className="truncate">{hostname}</span>
            {supportScore != null && (
              <span
                className={`ml-auto rounded-full border px-2 py-0.5 text-[11px] font-bold ${scoreChipStyle(supportScore)}`}
                title="AI support score: how specifically this source supports the claim"
              >
                {supportScore}/100
              </span>
            )}
          </div>
          <h3 className="line-clamp-2 text-base font-semibold leading-tight text-slate-900">
            {article.title}
          </h3>
          <p className="mt-2 line-clamp-2 text-sm text-slate-600">
            {article.description || "No summary available for this source."}
          </p>
          <a
            href={article.url}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="mt-3 inline-flex w-fit items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
          >
            Open source
          </a>
        </div>
        <img
          src={article.image || fallbackImage}
          alt="Evidence preview"
          className="h-24 w-28 shrink-0 rounded-xl border border-slate-100 object-cover"
        />
      </div>

      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(article.id);
          }}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/90 text-white opacity-0 shadow transition hover:bg-rose-600 group-hover:opacity-100"
          title="Delete article"
        >
          <span className="text-xl font-bold leading-none">×</span>
        </button>
      )}
    </div>
  );
}
