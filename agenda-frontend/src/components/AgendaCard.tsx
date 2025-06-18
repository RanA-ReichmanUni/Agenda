// Component for displaying a single agenda as a card

import React from "react";
import { Agenda } from "../lib/types"; //  Use the shared interface
import Link from "next/link"; //  for navigation between pages

interface AgendaCardProps {
  agenda: Agenda;
  onAddArticle?: (agendaId: string) => void;
  onDelete?: (agendaId: number) => void;
}

export default function AgendaCard({ agenda, onAddArticle, onDelete }: AgendaCardProps) {
  // Get up to 4 article images, ordered by creation date
  const articleImages = (agenda.articles || [])
    .filter((a: any) => a.image)
    .sort((a: any, b: any) => new Date(a.createdAt || a.created_at).getTime() - new Date(b.createdAt || b.created_at).getTime())
    .slice(0, 4)
    .map((a: any) => a.image);

  return (
    <div className="relative">
      <Link href={`/agenda/${agenda.id}`} className="block">
        <div className="bg-white p-6 rounded-xl shadow hover:shadow-md transition-all border border-gray-200 cursor-pointer">
          <h3 className="text-xl font-semibold text-gray-800">{agenda.title}</h3>
          <p className="text-sm text-gray-500 mt-2">
            Created at: {agenda.createdAt?.toLocaleString?.()}
          </p>
          {/* Article Thumbnails Horizontal Row */}
          {articleImages.length > 0 && (
            <div
              className="mt-4 flex gap-2 rounded-lg overflow-hidden w-full"
              style={{ height: 56 }}
            >
              {articleImages.map((img: string, idx: number) => (
                <img
                  key={idx}
                  src={img}
                  alt="Article thumbnail"
                  className="object-cover w-full h-full flex-1 border border-gray-200 rounded shadow-sm"
                  style={{ aspectRatio: '1 / 1', minWidth: 0, minHeight: 0 }}
                />
              ))}
            </div>
          )}
        </div>
      </Link>
      {onDelete && (
        <button
          onClick={() => onDelete(Number(agenda.id))}
          className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center hover:bg-red-700 transition focus:outline-none focus:ring-2 focus:ring-red-400 shadow"
          title="Delete agenda"
          style={{ padding: 0 }}
        >
          <span className="text-base font-bold leading-none">×</span>
        </button>
      )}
    </div>
  );
}