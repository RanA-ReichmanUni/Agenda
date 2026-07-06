import React, { useState } from "react";

interface CreateAgendaFormProps {
  onCreate: (title: string) => Promise<void>;
}

export default function CreateAgendaForm({ onCreate }: CreateAgendaFormProps) {
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onCreate(title);
      setTitle("");
    } catch (err: any) {
      setError(err.message || "Failed to create agenda");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        id="create-agenda-input"
        data-testid="create-agenda-input"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="State the claim you want to back with evidence…"
        className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        rows={2}
        disabled={loading}
        required
      />
      {error && (
        <div className="mt-1 text-sm text-rose-500">{error}</div>
      )}
      <button
        id="create-agenda-submit"
        data-testid="create-agenda-submit"
        type="submit"
        disabled={loading || !title.trim()}
        className="mt-3 w-full rounded-full bg-gradient-to-r from-blue-700 to-purple-700 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-700/20 transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
      >
        {loading ? "Creating…" : "Create Agenda"}
      </button>
    </form>
  );
}
