"use client";

import React, { useState } from "react";
import { useAgendaContext } from "../context/AgendaContext";

/**
 * Form component to create a new agenda by sending POST request to backend.
 */
export default function CreateAgendaForm() {
  const { refetch } = useAgendaContext(); // Get refetch function from context
  const [title, setTitle] = useState("");// New Agenda title state, to be created and sent to database when agenda is being created
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
      const response = await fetch("http://localhost:4000/agendas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || "Failed to create agenda");
      }

      // Clear form + refresh context
      setTitle("");
      await refetch(); //Update all agenda list after the new agenda addition
    } catch (err: any) {
      console.error("Create agenda error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md mx-auto">
      <input
        type="text"
        placeholder="Agenda title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="border border-gray-300 rounded px-4 py-2"
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Creating..." : "Create Agenda"}
      </button>
    </form>
  );
}
