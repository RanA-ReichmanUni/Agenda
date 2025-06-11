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
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-600">
            Invalid agenda ID
          </div>
        </div>
      </div>
    );
  }

  const id = params.id as string;
  const { agendas, setAgendas } = useAgenda();
  
  const agenda = agendas.find(a => a.id === id);

  if (!agenda) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-600">
            Agenda not found
          </div>
        </div>
      </div>
    );
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="bg-white shadow-xl rounded-2xl p-6 border border-gray-200">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{agenda.title}</h1>
          <p className="text-sm text-gray-500">
            Created at: {agenda.createdAt.toLocaleString()}
          </p>
        </div>

        {/* Add Article Form */}
        <div >
          <AddArticleForm onAdd={handleAddArticle} />
        </div>

        {/* Articles List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-800">
              Articles
              {agenda.articles.length > 0 && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({agenda.articles.length})
                </span>
              )}
            </h2>
          </div>

          {agenda.articles.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-gray-500">No articles yet. Add your first one above!</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {agenda.articles.map((article) => (
                <a
                  key={article.id}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-white rounded-xl shadow-md hover:shadow-lg transition-all border border-gray-200 overflow-hidden group"
                >
                  <div className="p-6 space-y-4">
                    <h3 className="text-xl font-semibold text-blue-700 group-hover:text-blue-800 transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-gray-600">{article.description}</p>
                    {article.image && (
                      <div className="flex justify-center">
                        <img 
                          src={article.image} 
                          alt={article.title} 
                          className="rounded-xl shadow max-h-48 object-cover"
                        />
                      </div>
                    )}
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
