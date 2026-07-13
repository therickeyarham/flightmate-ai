export interface Env {
  DB: D1Database;
  VECTORIZE: VectorizeIndex;
  AI: Ai;
  ASSETS: Fetcher;
  TRAVEL_AGENT: DurableObjectNamespace;

  ACCOUNT_ID: string;
  AI_GATEWAY_NAME: string;
  // No external LLM API key needed — we use Cloudflare Workers AI directly
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface KnowledgeDoc {
  id: string;
  title: string;
  content: string;
  source_type: string;
}
