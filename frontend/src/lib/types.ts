export interface Article {
  id: string;
  title: string;
  url: string;
  description: string;
  image?: string;
  agenda_id?: string;
  created_at?: string;
  createdAt?: string;
}

export interface Agenda {
  id: string | number;
  title: string;
  createdAt: Date;
  articles: Article[];
}
