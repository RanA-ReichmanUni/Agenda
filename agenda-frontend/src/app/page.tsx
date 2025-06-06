"use client"; // ✅ Enables interactivity on the client side

import React, { useState } from "react";
import { Agenda } from "../lib/types"; //  Adjust if path differs
import CreateAgendaForm from "../components/CreateAgendaForm"; //  Our form component
import AgendaCard from "../components/AgendaCard";

export default function HomePage() {
  const [agendas, setAgendas] = useState<Agenda[]>([]); // Store list of created agendas

  const handleCreateAgenda = (newAgenda: Agenda) => {
	  // Prev is just a name, when using the built in setAgendas (from useState definition), 
	  //this format indicate to React that it should fill the prev paramter with the previous state data.
	  // Then we use the spread ... operator to open the prev as a long list and attach the current new item (newAgenda) to the new state.
    setAgendas((prev) => [...prev, newAgenda]); // Append new agenda to the list
  };

  return (
    <div className="p-4 min-h-screen bg-gray-100">
      {/* Page title */}
      <h1 className="text-2xl font-bold text-center mb-6">Agenda Builder</h1>

      {/* Create form */}
	  {/*Embeding the CreateAgendaForm, and passing the "handleCreateAgenda" function that creates the new Agenda state.
	    The CreateAgendaForm recieves the function "handleCreateAgenda" as a parameter from the parent (props).
	    The CreateAgendaForm than creates the new agenda object and update the state using the "handleCreateAgenda" from the parent (this page/component) */} 
     
     <CreateAgendaForm onCreate={handleCreateAgenda} />
	  
      {/* Agenda list */}
      <div className="mt-8 space-y-4 max-w-md mx-auto">
        {agendas.map((agenda) => (
            <AgendaCard
              key={agenda.id}
              agenda={agenda}
              onAddArticle={(id) => alert(`Add article to agenda ${id}`)} // placeholder
            />
    
        ))}
      </div>

    </div>
	
  );
}
