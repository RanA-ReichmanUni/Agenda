export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const API_ENDPOINTS = {
  // Metadata
  extract: `${API_URL}/api/extract`,
  checkIframe: (url: string) => `${API_URL}/api/check-iframe?url=${encodeURIComponent(url)}`,

  // Agendas
  agendas: `${API_URL}/agendas`,
  agenda: (id: number | string) => `${API_URL}/agendas/${id}`,

  // Articles
  articles: (agendaId: number | string) => `${API_URL}/agendas/${agendaId}/articles`,
  article: (id: number | string) => `${API_URL}/articles/${id}`,
};
