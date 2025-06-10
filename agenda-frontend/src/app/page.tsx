"use client"; // ✅ Enables interactivity on the client side

import React from "react";
import CreateAgendaForm from "../components/CreateAgendaForm"; // The form used to create new agendas
import AgendaCard from "../components/AgendaCard"; // Card component displaying a single agenda
import { useAgenda } from "../context/AgendaContext"; // Custom hook to access global agenda state
import { Agenda } from "../lib/types"; // Import the Agenda type

export default function HomePage() {
  // ✅ Pull the global agendas state and its updater from the context
  const { agendas, setAgendas } = useAgenda();

  // ✅ Function to be passed down to CreateAgendaForm, appends a new agenda to the global list
  const handleCreateAgenda = (newAgenda: Agenda) => {
    // prev here is just a name; it's the previous value of the agendas array
    // React fills it when using the "functional update form" of setState
    setAgendas((prev) => [...prev, newAgenda]);
  };

  return (
    <div className="p-4 min-h-screen bg-gray-100">
      {/* Title of the page */}
      <h1 className="text-2xl font-bold text-center mb-6">Agenda Builder</h1>

      {/* ✅ Form for creating new agendas, receives a callback that updates the global state */}
      <CreateAgendaForm onCreate={handleCreateAgenda} />

      {/* ✅ Render all agendas as cards */}
      <div className="mt-8 space-y-4 max-w-md mx-auto">
        {agendas.map((agenda) => (
          <AgendaCard
            key={agenda.id}
            agenda={agenda}
            onAddArticle={(id) => alert(`Add article to agenda ${id}`)} // Placeholder for article-adding logic
          />
        ))}
      </div>
    </div>
  );
}
