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

// Helper function to get auth headers
export function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
}

// Authenticated fetch wrapper
export async function authFetch(url: string, options: RequestInit = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  });

  if (response.status === 401) {
    // Token expired or invalid, redirect to login
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  return response;
}
