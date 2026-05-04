import React from "react";
import { Link } from "react-router-dom";

interface AgendaCardProps {
  agenda: any;
  href?: string;
  onDelete?: (agendaId: number) => void;
  id?: string;
}

type Reliability = "High" | "Medium" | "Low" | "Unknown";

const getReliability = (agenda: any): Reliability => {
  const score = agenda?.analysisResult?.score;
  if (score === "High" || score === "Medium" || score === "Low") return score;
  return "Unknown";
};

const reliabilityStyle: Record<Reliability, string> = {
  High: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-200",
  Low: "bg-rose-50 text-rose-700 border-rose-200",
  Unknown: "bg-slate-100 text-slate-600 border-slate-200",
};

export default function AgendaCard({ agenda, href, onDelete, id }: AgendaCardProps) {
  const reliability = getReliability(agenda);
  const evidenceCount = agenda.articles?.length || 0;
  const isStale = Boolean(agenda?.analysisResult?.is_stale);
  const articleImages = (agenda.articles || [])
    .filter((a: any) => a.image)
    .sort(
      (a: any, b: any) =>
        new Date(a.createdAt || a.created_at).getTime() -
        new Date(b.createdAt || b.created_at).getTime()
    )
    .slice(0, 4)
    .map((a: any) => a.image);

  // Format time ago mock
  const timeAgo = agenda.createdAt 
    ? new Date(agenda.createdAt).toLocaleDateString()
    : "Just now";

  return (
    <div id={id} className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      {onDelete && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete(Number(agenda.id));
          }}
          className="absolute right-4 top-4 text-slate-400 transition hover:text-rose-500 focus:outline-none"
          title="Delete agenda"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </button>
      )}

      <Link to={href || `/agenda/${agenda.id}`} className="block">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${reliabilityStyle[reliability]}`}>
            {reliability === "Unknown" ? "Not Verified" : `${reliability} Reliability`}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {evidenceCount} {evidenceCount === 1 ? "Source" : "Sources"}
          </span>
          {isStale && (
            <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
              Needs Recheck
            </span>
          )}
        </div>

        <h3 className="pr-10 text-xl font-semibold leading-tight text-slate-900">
          {agenda.title}
        </h3>

        <p className="mt-2 text-sm text-slate-500">Filed {timeAgo}</p>

        {articleImages.length > 0 && (
          <div className="mt-4 grid max-h-[200px] grid-cols-3 gap-1 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
            {articleImages.slice(0, 3).map((img: string, idx: number) => (
              <img
                key={idx}
                src={img}
                alt="Evidence thumbnail"
                className="h-24 w-full object-cover"
              />
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
          <span className="text-sm font-medium text-slate-600">Open dossier</span>
          <span className="text-sm font-semibold text-blue-700">View details</span>
        </div>
      </Link>
    </div>
  );
}
