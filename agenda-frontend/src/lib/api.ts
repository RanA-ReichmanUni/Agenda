// API Configuration
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// API Endpoints
export const API_ENDPOINTS = {
  // Metadata
  extract: `${API_URL}/api/extract`,
  
  // Agendas
  agendas: `${API_URL}/agendas`,
  agenda: (id: number | string) => `${API_URL}/agendas/${id}`,
  
  // Articles
  articles: (agendaId: number | string) => `${API_URL}/agendas/${agendaId}/articles`,
  article: (id: number | string) => `${API_URL}/articles/${id}`,
};
