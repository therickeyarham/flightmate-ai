import type { Env, KnowledgeDoc } from './types';

const EMBEDDING_MODEL = '@cf/baai/bge-base-en-v1.5'; // 768-dim, free via Workers AI

async function embed(env: Env, text: string): Promise<number[]> {
  const result: any = await env.AI.run(EMBEDDING_MODEL, { text: [text] });
  return result.data[0];
}

/**
 * Ingests one knowledge document:
 * 1. Saves the raw text in D1 (source of truth)
 * 2. Generates an embedding via Workers AI
 * 3. Stores the embedding in Vectorize, linked by the same ID
 */
export async function ingestKnowledge(env: Env, doc: KnowledgeDoc) {
  const vector = await embed(env, doc.content);

  await env.VECTORIZE.upsert([
    { id: doc.id, values: vector, metadata: { title: doc.title, source_type: doc.source_type } }
  ]);

  await env.DB.prepare(
    `INSERT OR REPLACE INTO knowledge_sources (id, title, content, source_type, vector_id) VALUES (?, ?, ?, ?, ?)`
  ).bind(doc.id, doc.title, doc.content, doc.source_type, doc.id).run();
}

/**
 * The actual "Retrieval" in RAG: embeds the user's query, does a
 * semantic vector search, then pulls the matching text back from D1.
 * This result is injected into the LLM prompt — dynamic per query,
 * not static prompt-stuffing.
 */
export async function retrieveContext(env: Env, query: string, topK = 3): Promise<string> {
  const queryVector = await embed(env, query);
  const results = await env.VECTORIZE.query(queryVector, { topK, returnMetadata: true });

  if (!results.matches.length) return '';

  const ids = results.matches.map(m => m.id);
  const placeholders = ids.map(() => '?').join(',');
  const rows = await env.DB.prepare(
    `SELECT title, content FROM knowledge_sources WHERE id IN (${placeholders})`
  ).bind(...ids).all();

  return rows.results
    .map((r: any) => `[${r.title}]\n${r.content}`)
    .join('\n\n---\n\n');
}
