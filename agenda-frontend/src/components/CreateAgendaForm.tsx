// 🧠 This file defines a reusable React component for creating a new agenda

"use client"; //  This tells Next.js to render this component on the client side (not the server)

import React, { useState } from "react"; //  React and useState are required to build interactive UI and manage local state
import { Agenda } from "../lib/types"; //  Import the Agenda interface to ensure the created object follows the correct structure
import { v4 as uuidv4 } from "uuid"; //  UUID is used to generate a unique identifier for each agenda

// Props interface: this component receives a single function (onCreate) as a prop from its parent component
interface CreateAgendaFormProps {
  onCreate: (newAgenda: Agenda) => void; // onCreate receives a complete Agenda object
}

//  Functional component declaration with destructured props

// Recieved an object that confirms to the "CreateAgendaFormProps" interface rules.
// Uses destructring to extract the onCreate field directly from the object instead of using props.onCreate() directly.
// props is commen name for recieved object with parameters in React.
export default function CreateAgendaForm({ onCreate }: CreateAgendaFormProps) { 
  //  useState hook to manage the input value (agenda title)
  const [title, setTitle] = useState(""); // Initially empty

  //  This function is triggered when the form is submitted
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // Prevents the browser's default form submission behavior (which refreshes the page)

    if (!title.trim()) return; // Prevent submitting an empty or whitespace-only agenda title

    // Construct a new Agenda object using the structure from types.ts
    const newAgenda: Agenda = {
      id: uuidv4(), // Generate a unique ID
      title: title.trim(), // Remove unnecessary spaces from the title
      createdAt: new Date(), // Store the creation time
      articles: [], // Start with an empty list of articles
    };

    onCreate(newAgenda); // Call the parent function and send the new agenda object
    setTitle(""); // Clear the input field after submission
  };

  // Return the actual form UI that will be rendered
  return (
    <form
      onSubmit={handleSubmit} // Handle form submission
      className="flex flex-col gap-4 p-4 bg-white rounded-xl shadow max-w-md mx-auto mt-6"
    >
      {/*  Section title */}
      <h2 className="text-xl font-semibold">Create a New Agenda</h2>

      {/* Input field for agenda title */}
      <input
        type="text" // Standard text input
        placeholder="Agenda Title" // Placeholder text inside the field
        className="border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500" // Tailwind styling
        value={title} // Controlled input: bound to the title state
        onChange={(e) => setTitle(e.target.value)} // Update state whenever user types
      />

      {/* Submit button */}
      <button
        type="submit" // Triggers the form's onSubmit event
        className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition" // Tailwind styles
      >
        Create
      </button>
    </form>
  );
}
