import React, { useState } from "react";
import { Link } from "react-router-dom";

interface AgendaCardProps {
  agenda: any;
  href?: string;
  onDelete?: (agendaId: number) => void;
  onShare?: (agenda: any) => void;
  onVerify?: (agenda: any) => void;
  isVerifying?: boolean;
  id?: string;
}

type Reliability = "High" | "Medium" | "Low" | "Unknown";

const getReliability = (agenda: any): Reliability => {
  const score = agenda?.analysisResult?.score;
  if (score === "High" || score === "Medium" || score === "Low") return score;
  return "Unknown";
};

export default function AgendaCard({ agenda, href, onDelete, onShare, onVerify, isVerifying, id }: AgendaCardProps) {
  const reliability = getReliability(agenda);
  const evidenceCount = agenda.articles?.length || 0;
  const isStale = Boolean(agenda?.analysisResult?.is_stale);
  const numericScore = agenda?.analysisResult?.numeric_score ?? null;

  const displayArticles = (agenda.articles || [])
    .sort(
      (a: any, b: any) =>
        new Date(a.createdAt || a.created_at).getTime() -
        new Date(b.createdAt || b.created_at).getTime()
    )
    .slice(0, 3);

  const bgImages = displayArticles.filter((a: any) => a.image).map((a: any) => a.image);

  const [isMounted, setIsMounted] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setIsMounted(true), 10);
    return () => clearTimeout(t);
  }, []);

  // Unique clip IDs per card
  const clipIdLeft = `wave-l-${agenda.id}`;
  const clipIdMid = `wave-m-${agenda.id}`;

  // Verdict styling
  let verdictBorder = "border-slate-200";
  let verdictBg = "bg-slate-50";
  let barColor = "bg-slate-300";
  let scoreTextColor = "text-slate-600";
  let badgeColor = "border-slate-300 bg-white text-slate-600";

  if (reliability === "High") {
    verdictBorder = "border-emerald-200"; verdictBg = "bg-emerald-50";
    barColor = "bg-emerald-500"; scoreTextColor = "text-emerald-600";
    badgeColor = "border-emerald-300 bg-white text-emerald-700";
  } else if (reliability === "Medium") {
    verdictBorder = "border-amber-200"; verdictBg = "bg-amber-50";
    barColor = "bg-amber-500"; scoreTextColor = "text-amber-600";
    badgeColor = "border-amber-300 bg-white text-amber-700";
  } else if (reliability === "Low") {
    verdictBorder = "border-rose-200"; verdictBg = "bg-rose-50";
    barColor = "bg-rose-500"; scoreTextColor = "text-rose-600";
    badgeColor = "border-rose-300 bg-white text-rose-700";
  }

  return (
    <div id={id} data-title={agenda.title} className="group relative">
      {/* Soft glow behind the card — same treatment as LandingPage PipelineShowcase */}
      <div
        aria-hidden
        className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-br from-blue-200/40 via-purple-200/20 to-transparent blur-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      />

      <Link
        to={href || `/agenda/${agenda.id}`}
        className="relative block rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1"
      >
        <div className="flex flex-col md:flex-row gap-6 md:items-stretch">
          
          {/* ── Column 1: Claim ── */}
          <div className="flex flex-1 flex-col">
            <div className="flex items-center gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-blue-700">Narrative</p>
              {isStale && (
                <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 uppercase tracking-wide">
                  Stale
                </span>
              )}
            </div>
            <div className="mt-3 flex-1 flex flex-col justify-center">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3
                  className="text-lg font-semibold text-slate-800 leading-snug line-clamp-3 italic"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  "{agenda.title}"
                </h3>
              </div>
            </div>
          </div>

          {/* ── Column 2: Evidence ── */}
          <div className="w-full md:w-80 flex flex-col">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 mb-3 md:mt-1">
              Evidence ({evidenceCount})
            </p>
            <div className="space-y-2 flex-1 flex flex-col justify-center">
              {displayArticles.length > 0 ? (
                displayArticles.map((article: any, idx: number) => {
                  let domain = "source";
                  try {
                    domain = new URL(article.url).hostname.replace("www.", "");
                  } catch { /* ignore */ }

                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 transition-all duration-500"
                      style={{ transitionDelay: `${idx * 60}ms` }}
                    >
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis max-w-[80px]">
                        {domain}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700">
                        {article.title || "Evidence Article"}
                      </span>
                      <span className="text-emerald-500 opacity-0 transition-opacity duration-500 group-hover:opacity-100" aria-hidden>
                        ✓
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-xl border border-slate-200 border-dashed bg-slate-50/50 px-3 py-4 text-center text-sm text-slate-400">
                  No evidence attached yet
                </div>
              )}
            </div>
          </div>

          {/* ── Column 3: Visuals & Verdict ── */}
          <div className="w-full md:w-72 flex flex-col">
            <div className="flex items-center justify-end gap-4 mb-3 md:mt-0 h-5">
              {onShare && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onShare(agenda);
                  }}
                  className="z-20 text-slate-400 hover:text-blue-500 transition-colors focus:outline-none"
                  title="Share narrative"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDelete(Number(agenda.id));
                  }}
                  className="z-20 text-slate-400 hover:text-rose-500 transition-colors focus:outline-none"
                  title="Delete narrative"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>

            <div className="flex-1 flex flex-col justify-end gap-3">
              {bgImages.length > 0 && (
                <div className="relative h-20 rounded-xl overflow-hidden shrink-0">
                  <svg width="0" height="0" className="absolute" aria-hidden>
                    <defs>
                      <clipPath id={clipIdLeft} clipPathUnits="objectBoundingBox">
                        <path d="M 0 0 L 0.38 0 C 0.44 0.3 0.30 0.7 0.38 1 L 0 1 Z" />
                      </clipPath>
                      <clipPath id={clipIdMid} clipPathUnits="objectBoundingBox">
                        <path d="M 0 0 L 0.66 0 C 0.74 0.3 0.58 0.7 0.66 1 L 0 1 Z" />
                      </clipPath>
                    </defs>
                  </svg>

                  <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.03]">
                    {/* Base layer */}
                    <img src={bgImages[bgImages.length - 1]} className="absolute inset-0 w-full h-full object-cover" alt="" aria-hidden />

                    {/* Middle layer */}
                    {bgImages.length >= 2 && (
                      <div className="absolute inset-0" style={{ filter: "drop-shadow(2px 0 6px rgba(0,0,0,0.18))" }}>
                        <img
                          src={bgImages.length === 3 ? bgImages[1] : bgImages[0]}
                          className="absolute inset-0 w-full h-full object-cover"
                          style={{ clipPath: `url(#${clipIdMid})` }}
                          alt="" aria-hidden
                        />
                      </div>
                    )}

                    {/* Left layer */}
                    {bgImages.length === 3 && (
                      <div className="absolute inset-0" style={{ filter: "drop-shadow(2px 0 6px rgba(0,0,0,0.18))" }}>
                        <img
                          src={bgImages[0]}
                          className="absolute inset-0 w-full h-full object-cover"
                          style={{ clipPath: `url(#${clipIdLeft})` }}
                          alt="" aria-hidden
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Verdict Block */}
              <div className="flex flex-col gap-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Reliability Score
                </p>
                <div className={`rounded-xl border p-3 ${verdictBorder} ${verdictBg}`}>
                  {reliability === "Unknown" ? (
                    <div className="flex items-center justify-between gap-2 py-1">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-70" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        Not Verified
                      </div>
                      <button
                        onClick={(e) => {
                          if (onVerify && !isVerifying) {
                            e.preventDefault();
                            e.stopPropagation();
                            onVerify(agenda);
                          }
                        }}
                        disabled={isVerifying}
                        className="group flex items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white shadow-sm transition-all hover:shadow hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {isVerifying ? (
                          <>
                            <span className="h-3 w-3 animate-spin rounded-full border-[1.5px] border-white/30 border-t-white" />
                            Verifying
                          </>
                        ) : (
                          <>
                            Verify with AI
                            <span className="transition-transform group-hover:translate-x-0.5">&rarr;</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {numericScore != null && (
                            <span className={`text-xl font-black leading-none ${scoreTextColor}`}>
                              {numericScore}
                              <span className="text-[10px] font-semibold opacity-60"> / 100</span>
                            </span>
                          )}
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${badgeColor}`}>
                            {reliability}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-black/5">
                        <div
                          className={`h-full rounded-full transition-all duration-[1200ms] ease-out ${barColor}`}
                          style={{ width: isMounted ? `${numericScore || 0}%` : "0%" }}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
