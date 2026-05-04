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
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm mb-6">
      <form onSubmit={handleSubmit}>
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            {/* Mock User Avatar */}
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
              U
            </div>
          </div>
          <div className="flex-grow">
            <textarea
              id="create-agenda-input"
              data-testid="create-agenda-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What narrative are you backing up?"
              className="w-full bg-transparent text-lg focus:outline-none resize-none pt-1.5"
              rows={2}
              disabled={loading}
              required
            />
            {error && (
              <div className="text-red-500 text-sm mt-1">{error}</div>
            )}
            <div className="flex justify-end mt-3 border-t border-gray-100 pt-3">
              <button
                id="create-agenda-submit"
                data-testid="create-agenda-submit"
                type="submit"
                disabled={loading || !title.trim()}
                className="bg-blue-600 text-white px-5 py-1.5 rounded-full font-medium hover:bg-blue-700 active:bg-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Posting..." : "Post Agenda"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
