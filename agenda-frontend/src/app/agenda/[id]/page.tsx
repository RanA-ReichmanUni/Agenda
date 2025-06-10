"use client";

import React from "react";
import { useAgenda } from "../../../context/AgendaContext";
import { useParams } from "next/navigation";

export default function AgendaPage() {
  const { id } = useParams();
  const { agendas } = useAgenda();
  
  const agenda = agendas.find(a => a.id === id);

  if (!agenda) {
    return <div className="p-4">Agenda not found</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">{agenda.title}</h1>
      <p className="text-gray-500">Created: {agenda.createdAt.toLocaleString()}</p>
      <div className="mt-4">
        <h2 className="text-xl font-semibold mb-2">Articles</h2>
        {agenda.articles.length === 0 ? (
          <p>No articles yet</p>
        ) : (
          <ul className="space-y-2">
            {agenda.articles.map((article) => (
              <li key={article.url} className="p-2 bg-white rounded shadow">
                <h3 className="font-medium">{article.title}</h3>
                <p className="text-sm text-gray-600">{article.description}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
} 