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
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="relative">
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Agenda Title..."
          className="w-full px-6 py-4 text-lg bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition shadow-inner"
          disabled={loading}
          required // Keep required if desired, though disabled button handles it visually
        />
        
        <button
          type="submit"
          disabled={loading || !title.trim()}
          className="absolute right-2 top-2 bottom-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 rounded-lg font-semibold hover:shadow-lg hover:scale-105 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "..." : "Create"}
        </button>
      </form>
      {error && (
        <div className="text-red-600 bg-red-100 border border-red-200 rounded-xl p-3 text-sm">{error}</div>
      )}
    </div>
  );
}
