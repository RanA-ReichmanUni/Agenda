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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            Agenda Builder
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Create and manage your reading agendas. Add articles, organize your content, and build your knowledge base.
          </p>
        </div>

        {/* Create Agenda Form */}
        <div >
          <CreateAgendaForm onCreate={handleCreateAgenda} />
        </div>

        {/* Agendas List */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-800">
            Your Agendas
            {agendas.length > 0 && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({agendas.length})
              </span>
            )}
          </h2>

          {agendas.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-gray-500">No agendas yet. Create your first one above!</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {agendas.map((agenda) => (
                <AgendaCard
                  key={agenda.id}
                  agenda={agenda}
                  onAddArticle={(id) => alert(`Add article to agenda ${id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
