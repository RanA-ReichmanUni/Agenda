import React from 'react';
import { AnalysisResult } from '../lib/types';

export const BAND_STYLES = {
  High: { text: 'text-emerald-700', chip: 'border-emerald-300 bg-emerald-50 text-emerald-700', bar: 'bg-emerald-500', soft: 'border-emerald-200 bg-emerald-50', label: 'High Reliability' },
  Medium: { text: 'text-amber-700', chip: 'border-amber-300 bg-amber-50 text-amber-700', bar: 'bg-amber-500', soft: 'border-amber-200 bg-amber-50', label: 'Moderate Reliability' },
  Low: { text: 'text-rose-700', chip: 'border-rose-300 bg-rose-50 text-rose-700', bar: 'bg-rose-500', soft: 'border-rose-200 bg-rose-50', label: 'Low Reliability' },
} as const;

export const bandOf = (score: 'High' | 'Medium' | 'Low' | undefined) => BAND_STYLES[score || 'Low'] || BAND_STYLES.Low;
export const bandOfNumeric = (n: number) => (n >= 70 ? BAND_STYLES.High : n >= 40 ? BAND_STYLES.Medium : BAND_STYLES.Low);

interface AnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysisResult: AnalysisResult | null;
  onReanalyze?: () => void;
}

export default function AnalysisModal({ isOpen, onClose, analysisResult, onReanalyze }: AnalysisModalProps) {
  if (!isOpen || !analysisResult) return null;

  const band = bandOf(analysisResult.score);
  const numericScore = analysisResult.numeric_score;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 p-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-blue-700">AI Verification</p>
            <h3 className="text-lg font-bold text-slate-900">Credibility Report</h3>
          </div>
          <button onClick={onClose} className="rounded-full p-2 transition-colors hover:bg-slate-200">
            <svg className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-6">
          <p className="text-center text-sm font-medium text-slate-500">"{analysisResult.claim}"</p>

          {/* Score hero */}
          <div className={`mt-4 rounded-2xl border p-5 ${band.soft}`}>
            <div className="flex items-end justify-between gap-3">
              {numericScore != null ? (
                <div className="flex items-end gap-1.5">
                  <span className={`text-6xl font-black leading-none ${band.text}`}>{numericScore}</span>
                  <span className="pb-1.5 text-sm font-semibold text-slate-500">/ 100</span>
                </div>
              ) : (
                <span className={`text-4xl font-black ${band.text}`}>{analysisResult.score}</span>
              )}
              <span className={`rounded-full border px-3 py-1 text-xs font-bold ${band.chip}`}>
                {band.label}
              </span>
            </div>
            {numericScore != null && (
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/70">
                <div className={`h-full rounded-full ${band.bar}`} style={{ width: `${numericScore}%` }} />
              </div>
            )}
          </div>

          {analysisResult.is_stale && onReanalyze && (
            <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-bold text-amber-800">⚠️ Outdated rating — the claim or evidence changed since this analysis ran.</p>
              <button
                onClick={onReanalyze}
                className="w-full rounded-full bg-amber-200 py-2 text-sm font-bold text-amber-900 transition hover:bg-amber-300"
              >
                Re-run analysis
              </button>
            </div>
          )}

          {/* Per-source breakdown */}
          {analysisResult.article_scores && analysisResult.article_scores.length > 0 && (
            <div className="mt-5">
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Source breakdown</h4>
              <div className="space-y-2">
                {analysisResult.article_scores.map((s, i) => {
                  const sBand = bandOfNumeric(s.score);
                  return (
                    <div key={s.id || i} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                      <div className="flex items-center justify-between gap-3">
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700" title={s.title || s.topic || ''}>
                          {s.title || s.topic || `Source ${i + 1}`}
                        </span>
                        <span className={`shrink-0 text-sm font-bold ${sBand.text}`}>{s.score}</span>
                      </div>
                      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-slate-100">
                        <div className={`h-full rounded-full ${sBand.bar}`} style={{ width: `${s.score}%` }} />
                      </div>
                      {s.topic && s.title && (
                        <p className="mt-1 truncate text-xs text-slate-400">{s.topic}{s.verdict ? ` · ${s.verdict}` : ''}</p>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
                Overall score = average per-source support × corroboration (number of relevant sources) × source diversity (unique outlets).
              </p>
            </div>
          )}

          <div className="mt-5 rounded-2xl bg-slate-50 p-4">
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Reasoning</h4>
            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
              {analysisResult.reasoning}
            </p>
          </div>
        </div>
        <div className="flex justify-end border-t border-slate-100 p-4">
          <button
            id="close-analysis-btn"
            onClick={onClose}
            className="rounded-full bg-slate-900 px-6 py-2 font-bold text-white transition-colors hover:bg-slate-700"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
