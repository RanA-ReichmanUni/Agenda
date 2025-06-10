// Component for displaying a single agenda as a card

import React from "react";
import { Agenda } from "../lib/types"; //  Use the shared interface
import Link from "next/link"; //  for navigation between pages

interface AgendaCardProps {
  agenda: Agenda; // ✅ The agenda to display
  onAddArticle?: (agendaId: string) => void; // ✅ Function for handling article addition (for next steps)
}

export default function AgendaCard({ agenda, onAddArticle }: AgendaCardProps) {
  return (
    <Link href={`/agenda/${agenda.id}`} className="block">
  <div className="bg-white p-6 rounded-xl shadow hover:shadow-md transition-all border border-gray-200 cursor-pointer">
    <h3 className="text-xl font-semibold text-gray-800">{agenda.title}</h3>
    <p className="text-sm text-gray-500 mt-2">
      Created at: {agenda.createdAt.toLocaleString()}
    </p>
  </div>
</Link>
  );
}
