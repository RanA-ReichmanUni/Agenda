"use client"; // Enable interactivity on the client side

import React from "react";
import { useAgenda } from "../../../context/AgendaContext";
import { useParams } from "next/navigation";
import AddArticleForm from "../../../components/AddArticleForm"; // Form component to add articles
import { Article } from "../../../lib/types";

export default function AgendaPage() {
  const params = useParams();
  
  // Handle case where params or id is undefined
  if (!params || !params.id) {
    return <div className="p-4 text-red-600">Invalid agenda ID</div>;
  }

  const id = params.id as string;
  const { agendas, setAgendas } = useAgenda();
  
  const agenda = agendas.find(a => a.id === id);

  if (!agenda) {
    return <div className="p-4 text-red-600">Agenda not found</div>;
  }

  // Function to add a new article to the current agenda
  const handleAddArticle = (newArticle: Article) => {
    try {
      const updatedAgendas = agendas.map((a) =>
        a.id === agenda.id
          ? { ...a, articles: [...a.articles, newArticle] }
          : a
      );
      setAgendas(updatedAgendas);
    } catch (error) {
      console.error('Failed to add article:', error);
      // You might want to show an error message to the user here
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Agenda title */}
      <h1 className="text-2xl font-bold text-gray-800">{agenda.title}</h1>

      {/* Agenda creation time */}
      <p className="text-sm text-gray-500">
        Created at: {agenda.createdAt.toLocaleString()}
      </p>

      {/* Add Article Form */}
      <AddArticleForm onAdd={handleAddArticle} />

      {/* Display Articles */}
      <div className="mt-6 space-y-4">
        <h2 className="text-lg font-semibold">Articles</h2>

        {agenda.articles.length === 0 && (
          <p className="text-gray-500 italic">No articles yet.</p>
        )}

        {agenda.articles.map((article) => (
          <a
            key={article.id}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-4 bg-white rounded shadow hover:shadow-md transition-all border"
          >
            <h3 className="font-semibold text-blue-700">{article.title}</h3>
            <p className="text-sm text-gray-600 mt-1">{article.description}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
