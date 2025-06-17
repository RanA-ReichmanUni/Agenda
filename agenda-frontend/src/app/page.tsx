"use client";

import React from "react";
import CreateAgendaForm from "../components/CreateAgendaForm";
import AgendaCard from "../components/AgendaCard";
import { useAgendaContext } from "../context/AgendaContext";

export default function HomePage() {
  const { agendas, loading, error } = useAgendaContext();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            Agenda Builder
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Create and manage your reading agendas. Add articles, organize your content, and build your knowledge base.
          </p>
        </div>

        {/* Create Form */}
        <div>
          <CreateAgendaForm />
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

          {loading ? (
            <div className="text-center text-gray-500 py-12">Loading agendas...</div>
          ) : error ? (
            <div className="text-center text-red-500 py-12">Error: {error}</div>
          ) : agendas.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-gray-500">No agendas yet. Create your first one above!</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {agendas.map((agenda) => (
                <AgendaCard
                  key={agenda.id}
                  agenda={agenda}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
