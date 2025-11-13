export interface ScraperOptions {
  includeMetadata?: boolean;
  includeLinks?: boolean;
  cleanWhitespace?: boolean;
  selectors?: {
    remove?: string[];
    focus?: string;
  };
}

export interface WebContent {
  content: string;
  metadata?: {
    title?: string;
    description?: string;
    url?: string;
    author?: string;
    publishDate?: string;
  };
}

export interface FetchOptions {
  timeout?: number;
  headers?: Record<string, string>;
}

export interface FetchResult {
  success: boolean;
  data?: WebContent;
  error?: string;
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  icon?: string;
}

export interface CommonTypes {
  error?: string;
  status?: string;
}
