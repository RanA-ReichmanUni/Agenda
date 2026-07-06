import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[radial-gradient(circle_at_top_left,#f5f7ff,transparent_42%),radial-gradient(circle_at_top_right,#eef5ff,transparent_38%),#f8fafc] p-4">

      {/* Brand Title */}
      <div className="text-center mb-8 animate-fade-in-down">
        <h1 className="text-7xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-900 via-blue-700 to-purple-800 drop-shadow-2xl tracking-tighter" style={{ fontFamily: "'Playfair Display', serif" }}>
          AGENDA
        </h1>
        <p className="text-slate-500 font-medium text-base md:text-lg tracking-[0.5em] uppercase mt-2">
          PROVE YOUR POINT
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-xl p-8 max-w-md w-full animate-fade-in-up">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-1">
            Welcome back
          </h2>
          <p className="text-sm text-slate-500">Sign in to your Agenda account</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-slate-300 bg-slate-50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition"
              placeholder="you@example.com"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-slate-300 bg-slate-50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition"
              placeholder="••••••••"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-700 to-purple-700 text-white font-semibold py-2.5 px-6 rounded-full shadow-lg shadow-blue-700/20 hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {isLoading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-4">
          <p className="text-sm text-slate-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-700 hover:text-blue-800 font-semibold">
              Sign up
            </Link>
          </p>

          <div className="border-t border-slate-100 pt-4">
            <button
              onClick={() => {
                // Clear tutorial seen flag in local storage so it always shows on fresh demo entry from login
                localStorage.removeItem('agenda_demo_tutorial_home');
                localStorage.removeItem('agenda_demo_tutorial_agenda');
                navigate('/demo');
              }}
              className="inline-block w-full text-center rounded-full border border-slate-300 bg-white text-slate-800 font-semibold py-2.5 px-6 hover:border-slate-400 hover:bg-slate-50 transition"
            >
              Try Demo Mode (No Login)
            </button>

            <button
              onClick={() => navigate('/auto-pilot-demo')}
              className="mt-3 inline-block w-full text-center rounded-full border border-purple-200 bg-purple-50 text-purple-800 font-semibold py-2.5 px-6 hover:bg-purple-100 transition"
            >
              ▶ Watch the guided tour
            </button>

            <Link to="/" className="mt-4 inline-block text-sm text-slate-500 hover:text-slate-700 transition">
              ← What is Agenda?
            </Link>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fade-in-down {
          0% { opacity: 0; transform: translateY(-20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.8s ease-out both;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out 0.2s both;
        }
      `}</style>
    </div>
  );
}
