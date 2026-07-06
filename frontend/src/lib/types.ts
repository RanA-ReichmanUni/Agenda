export interface Article {
  id: string;
  title: string;
  url: string;
  description: string;
  image?: string;
  agenda_id?: string;
  createdAt?: string;
}

export type ArticleScore = {
  id?: string;
  title?: string;
  topic?: string;
  verdict?: string;
  score: number; // 0-100 per-article support score
};

export type AnalysisResult = {
  score: 'High' | 'Medium' | 'Low';
  reasoning: string;
  claim: string;
  numeric_score?: number | null; // 0-100 aggregate credibility score
  article_scores?: ArticleScore[] | null;
  is_cached?: boolean;
  is_stale?: boolean;
  articleCount?: number;
};

// The Python API emits snake_case while the C# API emits camelCase for some
// fields; normalize both shapes into the AnalysisResult the UI expects.
export function normalizeAnalysisResult(data: any): AnalysisResult {
  return {
    score: data.score,
    reasoning: data.reasoning ?? '',
    claim: data.claim ?? '',
    numeric_score: data.numeric_score ?? data.numericScore ?? null,
    article_scores: data.article_scores ?? data.articleScores ?? null,
    is_cached: data.is_cached ?? data.isCached,
    is_stale: data.is_stale ?? data.isStale,
    articleCount: data.articleCount ?? data.article_count,
  };
}

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
