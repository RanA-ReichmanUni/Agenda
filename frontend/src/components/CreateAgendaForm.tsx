import React, { useState } from "react";
import { useAgendaContext } from "../context/AgendaContext";
import { API_ENDPOINTS } from "../lib/api";

export default function CreateAgendaForm() {
  const { refetch } = useAgendaContext();
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
      const response = await fetch(API_ENDPOINTS.agendas, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!response.ok) {
        let message = `Failed to create agenda (HTTP ${response.status})`;
        try {
          const maybeJson = await response.json();
          if (maybeJson?.detail)
            message = Array.isArray(maybeJson.detail)
              ? maybeJson.detail.map((d: any) => d.msg || d).join(", ")
              : maybeJson.detail;
          if (maybeJson?.error) message = maybeJson.error;
        } catch {}
        throw new Error(message);
      }
      setTitle("");
      await refetch();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Agenda Title
        </label>
        <input
          id="title"
          type="text"
          placeholder="Enter agenda title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
          required
        />
      </div>
      {error && (
        <div className="text-red-600 bg-red-100 border border-red-200 rounded-xl p-3 text-sm">{error}</div>
      )}
      <button
        type="submit"
        disabled={loading}
        className={`w-full py-2 px-4 rounded-xl font-semibold transition 
          ${loading 
            ? "bg-gray-300 cursor-not-allowed" 
            : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg"}`}
      >
        {loading ? "Creating..." : "Create Agenda"}
      </button>
    </form>
  );
}
