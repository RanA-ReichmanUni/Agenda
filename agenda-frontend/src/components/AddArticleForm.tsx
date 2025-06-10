// React import for building components and using state
import React, { useState } from "react";

// Import the Article type definition to enforce structure and type safety
import { Article } from "../lib/types";

// Import UUID generator for assigning unique IDs to articles
import { v4 as uuidv4 } from "uuid";

// Define the props for the AddArticleForm component
// This component expects a single function `onAdd` that receives an Article object
interface AddArticleFormProps {
  onAdd: (article: Article) => void;
}

// Define the functional component for the Add Article form
export default function AddArticleForm({ onAdd }: AddArticleFormProps) {
  // React state to store all form input values in a single object
  // This simplifies managing multiple related fields
  const [articleData, setArticleData] = useState({
    title: "",         // The title of the article
    url: "",           // The URL to the article
    description: "",   // A short description of the article
  });

  // Handler function for input changes (called on each keystroke in a field)
  // Uses `name` of the input field to determine which property to update
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target; // Destructure input field's name and value
    setArticleData((prev) => ({
      ...prev,         // Spread the existing state
      [name]: value,   // Update only the field that changed (dynamic key)
    }));
  };

  // Handler function called when the form is submitted
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default page reload behavior on form submit

    // Construct a new article object based on form data
    const newArticle: Article = {
      id: uuidv4(),                        // Generate a unique ID for the article
      title: articleData.title,           // Use the current value from state
      url: articleData.url,
      description: articleData.description,
    };

    onAdd(newArticle); // Call the parent's `onAdd` function to update article list

    // Reset the form fields back to empty
    setArticleData({
      title: "",
      url: "",
      description: "",
    });
  };

  // JSX return: render the form
  return (
    <form
      onSubmit={handleSubmit} // Link the form submission to the handler
      className="space-y-4 bg-white p-4 rounded-xl shadow-md"
    >
      <h2 className="text-lg font-semibold">Add Article</h2>

      {/* Input field for article title */}
      <input
        name="title" // Important: used as key in articleData
        type="text"
        placeholder="Article Title"
        value={articleData.title} // Controlled component: value is bound to state
        onChange={handleChange}   // Call change handler on keystroke
        className="w-full border px-3 py-2 rounded"
        required // User must fill this field
      />

      {/* Input field for article URL */}
      <input
        name="url"
        type="url"
        placeholder="https://example.com"
        value={articleData.url}
        onChange={handleChange}
        className="w-full border px-3 py-2 rounded"
        required
      />

      {/* Textarea for article description */}
      <textarea
        name="description"
        placeholder="Short description"
        value={articleData.description}
        onChange={handleChange}
        className="w-full border px-3 py-2 rounded"
        rows={3} // Set initial height of the text area
      />

      {/* Submit button */}
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Add Article
      </button>
    </form>
  );
}
