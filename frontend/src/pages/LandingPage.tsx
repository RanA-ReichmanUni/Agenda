import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const GITHUB_URL = "https://github.com/RanA-ReichmanUni/Agenda";

const CLAIM_TEXT = "The 4-day work week is ideal";

const MOCK_SOURCES = [
  { domain: "autonomy.work", headline: "UK's four-day week pilot was a resounding success" },
  { domain: "apa.org", headline: "The rise of the 4-day workweek" },
  { domain: "theguardian.com", headline: "Microsoft Japan tested a 4-day week — productivity rose 40%" },
];

/**
 * Phases of the looping hero animation:
 * 0      — typing the claim
 * 1..3   — evidence sources appearing one by one
 * 4      — AI verification in progress
 * 5      — verdict revealed (hold, then loop)
 */
const FINAL_PHASE = 5;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

function PipelineShowcase() {
  const reducedMotion = usePrefersReducedMotion();
  const [phase, setPhase] = useState(reducedMotion ? FINAL_PHASE : 0);
  const [typedCount, setTypedCount] = useState(reducedMotion ? CLAIM_TEXT.length : 0);
  const timerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (reducedMotion) {
      setPhase(FINAL_PHASE);
      setTypedCount(CLAIM_TEXT.length);
      return;
    }

    const schedule = (fn: () => void, ms: number) => {
      timerRef.current = window.setTimeout(fn, ms);
    };

    if (phase === 0) {
      if (typedCount < CLAIM_TEXT.length) {
        schedule(() => setTypedCount((c) => c + 1), 45);
      } else {
        schedule(() => setPhase(1), 600);
      }
    } else if (phase < 4) {
      schedule(() => setPhase((p) => p + 1), 750);
    } else if (phase === 4) {
      schedule(() => setPhase(5), 2400);
    } else {
      // Hold the verdict, then restart the loop.
      schedule(() => {
        setTypedCount(0);
        setPhase(0);
      }, 5000);
    }

    return () => window.clearTimeout(timerRef.current);
  }, [phase, typedCount, reducedMotion]);

  const typedClaim = CLAIM_TEXT.slice(0, typedCount);
  const isTyping = phase === 0 && typedCount < CLAIM_TEXT.length;
  const verifying = phase === 4;
  const done = phase >= 5;

  return (
    <div className="relative">
      {/* Soft glow behind the card */}
      <div
        aria-hidden
        className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-blue-200/60 via-purple-200/40 to-transparent blur-2xl"
      />

      <div className="relative rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-blue-700">Live workflow</p>
          <div className="flex gap-1.5" aria-hidden>
            {[0, 1, 4, 5].map((p) => (
              <span
                key={p}
                className={`h-1.5 w-1.5 rounded-full transition-colors duration-500 ${
                  phase >= p ? "bg-blue-600" : "bg-slate-200"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Claim */}
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Claim</p>
          <p className="mt-1 min-h-[1.75rem] text-lg font-semibold text-slate-900">
            {typedClaim}
            {isTyping && <span className="ml-0.5 inline-block h-5 w-[2px] animate-pulse bg-blue-600 align-middle" />}
          </p>
        </div>

        {/* Evidence */}
        <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Evidence</p>
        <div className="mt-2 space-y-2">
          {MOCK_SOURCES.map((source, i) => {
            const visible = phase >= i + 1;
            return (
              <div
                key={source.domain}
                className={`flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 transition-all duration-500 ${
                  visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
                }`}
              >
                <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-500">
                  {source.domain}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700">{source.headline}</span>
                <span
                  className={`text-emerald-500 transition-opacity duration-500 ${done ? "opacity-100" : "opacity-0"}`}
                  aria-hidden
                >
                  ✓
                </span>
              </div>
            );
          })}
        </div>

        {/* Verification / verdict */}
        <div className="mt-4 min-h-[92px]">
          {!done ? (
            <div
              className={`rounded-2xl border border-blue-200 bg-blue-50 p-4 transition-opacity duration-500 ${
                verifying ? "opacity-100" : "opacity-0"
              }`}
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-blue-800">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                AI verification in progress
              </div>
              <p className="mt-1 text-xs text-blue-700/80">Reading each source · cross-referencing against the claim…</p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-blue-100">
                <div className={`h-full rounded-full bg-blue-600 ${verifying ? "landing-progress" : "w-0"}`} />
              </div>
            </div>
          ) : (
            <div className="landing-verdict rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black leading-none text-emerald-600">92<span className="text-xs font-semibold text-emerald-700/60"> / 100</span></span>
                  <span className="rounded-full border border-emerald-300 bg-white px-3 py-1 text-xs font-bold text-emerald-700">
                    High Reliability
                  </span>
                </div>
                <span className="text-xs font-medium text-emerald-800/80">3 of 3 sources support the claim</span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-emerald-100">
                <div className="landing-score h-full rounded-full bg-emerald-500" />
              </div>
              <p className="mt-2 text-xs leading-relaxed text-emerald-900/70">
                Cited evidence substantively supports the stated narrative.
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes landing-progress {
          from { width: 4%; }
          to { width: 96%; }
        }
        .landing-progress {
          animation: landing-progress 2.3s ease-in-out both;
        }
        @keyframes landing-score {
          from { width: 0; }
          to { width: 92%; }
        }
        .landing-score {
          animation: landing-score 0.9s ease-out 0.15s both;
        }
        @keyframes landing-verdict-in {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .landing-verdict {
          animation: landing-verdict-in 0.45s ease-out both;
        }
        @media (prefers-reduced-motion: reduce) {
          .landing-progress, .landing-score, .landing-verdict { animation: none; }
          .landing-score { width: 92%; }
        }
      `}</style>
    </div>
  );
}

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "State your claim",
    text: "Create a narrative — a single arguable statement you want to stand behind.",
  },
  {
    step: "02",
    title: "Attach evidence",
    text: "Paste article URLs. Title, image and description are scraped automatically into a visual evidence board.",
  },
  {
    step: "03",
    title: "AI verification",
    text: "An async pipeline reads each source's actual text and scores how credibly it supports your claim.",
  },
  {
    step: "04",
    title: "Share your case",
    text: "Publish a read-only link so anyone can audit your narrative — sources, scores and all.",
  },
];

const STACK_CHIPS = [
  "React 18 + TypeScript",
  "Vite + Tailwind",
  ".NET 10 Web API",
  "MassTransit + RabbitMQ",
  "Groq LLM inference",
  "PostgreSQL",
  "JWT auth",
  "Docker Compose",
  "Backend test suite",
];

const PIPELINE_FLOW = ["React UI", ".NET 10 API", "RabbitMQ", "C# Worker", "Groq LLM", "PostgreSQL"];

export default function LandingPage() {
  const navigate = useNavigate();

  const enterSandbox = () => {
    // Reset tutorial flags so first-time guidance always shows on a fresh visit.
    localStorage.removeItem("agenda_demo_tutorial_home");
    localStorage.removeItem("agenda_demo_tutorial_agenda");
    navigate("/demo");
  };

  const startGuidedTour = () => {
    navigate("/auto-pilot-demo");
  };

  const year = useMemo(() => new Date().getFullYear(), []);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#f5f7ff,transparent_42%),radial-gradient(circle_at_top_right,#eef5ff,transparent_38%),#f8fafc] pb-24">
      {/* Top bar */}
      <header className="mx-auto flex w-[min(1120px,92vw)] items-center justify-between py-5">
        <span
          className="bg-gradient-to-r from-blue-900 via-blue-700 to-purple-800 bg-clip-text text-2xl font-black tracking-tighter text-transparent"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          AGENDA
        </span>
        <nav className="flex items-center gap-2 sm:gap-3">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full px-3 py-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
          >
            GitHub
          </a>
          <button
            onClick={() => navigate("/login")}
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
          >
            Sign in
          </button>
          <button
            onClick={enterSandbox}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Try the demo
          </button>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto mt-6 grid w-[min(1120px,92vw)] items-center gap-10 lg:mt-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-700">Evidence-driven platform</p>
          <h1
            className="mt-3 text-5xl font-black leading-[1.05] tracking-tight text-slate-900 sm:text-6xl"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Make a claim.
            <br />
            <span className="bg-gradient-to-r from-blue-800 via-blue-600 to-purple-700 bg-clip-text text-transparent">
              Prove it with evidence.
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
            Agenda lets you state a narrative, back it with news sources, and runs an{" "}
            <span className="font-semibold text-slate-800">AI verification pipeline</span> that reads every article and
            scores how credibly your evidence supports the claim.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              onClick={startGuidedTour}
              className="group flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-700 to-purple-700 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-700/20 transition hover:shadow-xl hover:shadow-purple-700/25"
            >
              <span className="transition-transform group-hover:translate-x-0.5">▶</span>
              Watch it drive itself
            </button>
            <button
              onClick={enterSandbox}
              className="rounded-full border border-slate-300 bg-white px-6 py-3.5 text-base font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
            >
              Explore the sandbox
            </button>
          </div>
          <p className="mt-3 text-sm text-slate-500">
            No account needed — the demo runs entirely in your browser.
          </p>
        </div>

        <PipelineShowcase />
      </section>

      {/* How it works */}
      <section className="mx-auto mt-20 w-[min(1120px,92vw)]">
        <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "'Playfair Display', serif" }}>
          How it works
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS.map((item) => (
            <div key={item.step} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="text-sm font-bold text-blue-700">{item.step}</span>
              <h3 className="mt-2 text-lg font-bold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Under the hood */}
      <section className="mx-auto mt-20 w-[min(1120px,92vw)]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "'Playfair Display', serif" }}>
                Under the hood
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
                Agenda is built as a production-style distributed system. AI verification runs asynchronously — the API
                responds instantly with <span className="font-semibold text-slate-800">202 Accepted</span> while a
                message-driven worker performs the analysis in the background.
              </p>
            </div>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
            >
              View source on GitHub →
            </a>
          </div>

          {/* Architecture flow */}
          <div className="mt-6 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            {PIPELINE_FLOW.map((node, i) => (
              <React.Fragment key={node}>
                {i > 0 && <span className="text-slate-400">→</span>}
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm">
                  {node}
                </span>
              </React.Fragment>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {STACK_CHIPS.map((chip) => (
              <span
                key={chip}
                className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="mx-auto mt-20 w-[min(1120px,92vw)]">
        <div className="rounded-3xl bg-gradient-to-r from-blue-800 via-blue-700 to-purple-800 p-8 text-center shadow-xl sm:p-12">
          <h2 className="text-3xl font-black text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
            See the full workflow in 90 seconds
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-blue-100">
            The guided tour creates a narrative, attaches evidence, runs the AI verification and shares the result — all
            by itself, with narration.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <button
              onClick={startGuidedTour}
              className="rounded-full bg-white px-6 py-3.5 text-base font-semibold text-blue-900 shadow-lg transition hover:bg-blue-50"
            >
              ▶ Start the guided tour
            </button>
            <button
              onClick={enterSandbox}
              className="rounded-full border border-white/40 px-6 py-3.5 text-base font-semibold text-white transition hover:bg-white/10"
            >
              Explore on my own
            </button>
          </div>
        </div>
        <p className="mt-8 text-center text-xs text-slate-400">
          © {year} Agenda · Designed &amp; engineered end-to-end by Ran Amir
        </p>
      </section>
    </div>
  );
}
