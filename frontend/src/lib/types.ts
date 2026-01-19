export interface Article {
  id: string;
  title: string;
  url: string;
  description: string;
  image?: string;
  agenda_id?: string;
  createdAt?: string;
}

export type AnalysisResult = {
  score: 'High' | 'Medium' | 'Low';
  reasoning: string;
  claim: string;
  is_cached?: boolean;
  is_stale?: boolean;
  articleCount?: number;
};

export interface Agenda {
  id: string | number;
  user_id?: string | number;
  title: string;
  createdAt: Date;
  articles: Article[];
  share_token?: string;
  owner_name?: string;
  analysisResult?: AnalysisResult;
}
