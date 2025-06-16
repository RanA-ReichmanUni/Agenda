// Component for displaying a single agenda as a card

import React from "react";
import { Agenda } from "../lib/types"; //  Use the shared interface
import Link from "next/link"; //  for navigation between pages

interface AgendaCardProps {
  agenda: Agenda;
  onAddArticle?: (agendaId: string) => void;
  onDelete?: (agendaId: string) => void; // ← חדש
}

export default function AgendaCard({ agenda, onAddArticle, onDelete }: AgendaCardProps) {
  return (
    <div className="relative">
      <Link href={`/agenda/${agenda.id}`} className="block">
        <div className="bg-white p-6 rounded-xl shadow hover:shadow-md transition-all border border-gray-200 cursor-pointer">
          <h3 className="text-xl font-semibold text-gray-800">{agenda.title}</h3>
          <p className="text-sm text-gray-500 mt-2">
            Created at: {agenda.createdAt.toLocaleString()}
          </p>
        </div>
      </Link>
      {onDelete && (
        <button
          onClick={() => onDelete(agenda.id)}
          className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-700"
          title="Delete agenda"
        >
          ×
        </button>
      )}
    </div>
  );
}