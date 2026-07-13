import type { Env } from './types';
import { getAgentByName } from 'agents';
import { ingestKnowledge } from './rag';
import { seedDocs } from './seed-data';
import { listPendingReviews, submitReviewDecision, getReviewStatus } from './review';

export { TravelAgent } from './agent';

/**
 * Satisfies the "Users" and "Sessions" D1 tables requirement.
 * For simplicity we treat each browser sessionId as both the user ID
 * and the session ID (fine for this challenge — a real multi-user app
 * would separate login identity from session identity).
 */
async function ensureUserAndSession(env: Env, sessionId: string) {
  await env.DB.prepare(
    `INSERT OR IGNORE INTO users (id, name) VALUES (?, ?)`
  ).bind(sessionId, 'Guest User').run();

  await env.DB.prepare(
    `INSERT OR IGNORE INTO sessions (id, user_id) VALUES (?, ?)`
  ).bind(sessionId, sessionId).run();
}

function cors(response: Response): Response {
  const newResponse = new Response(response.body, response);
  newResponse.headers.set('Access-Control-Allow-Origin', '*');
  newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  return newResponse;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return cors(new Response(null, { status: 204 }));
    }

    // ---- One-time setup: seed the RAG knowledge base ----
    // POST /admin/seed
    if (url.pathname === '/admin/seed' && request.method === 'POST') {
      for (const doc of seedDocs) {
        await ingestKnowledge(env, doc);
      }
      return cors(Response.json({ status: 'seeded', count: seedDocs.length }));
    }

    // ---- Chat endpoint: routes to the correct per-session Durable Object ----
    // POST /chat  { message, sessionId }
    if (url.pathname === '/chat' && request.method === 'POST') {
      const body: any = await request.clone().json();
      const sessionId = body.sessionId || 'default-session';

      await ensureUserAndSession(env, sessionId);

      const agentStub = await getAgentByName(env.TRAVEL_AGENT, sessionId);

      const doRequest = new Request(new URL('/chat', request.url), {
        method: 'POST',
        headers: request.headers,
        body: JSON.stringify(body)
      });

      const res = await agentStub.fetch(doRequest);
      return cors(res);
    }

    // ---- Human-in-the-Loop review endpoints ----
    // GET /reviews  -> list pending
    if (url.pathname === '/reviews' && request.method === 'GET') {
      const reviews = await listPendingReviews(env);
      return cors(Response.json(reviews));
    }

    // GET /reviews/:id -> check status (for the user side polling)
    const statusMatch = url.pathname.match(/^\/reviews\/([\w-]+)$/);
    if (statusMatch && request.method === 'GET') {
      const review = await getReviewStatus(env, statusMatch[1]);
      return cors(Response.json(review));
    }

    // POST /reviews/:id/decision  { decision, notes?, modifiedContent? }
    const decisionMatch = url.pathname.match(/^\/reviews\/([\w-]+)\/decision$/);
    if (decisionMatch && request.method === 'POST') {
      const body: any = await request.json();
      const result = await submitReviewDecision(
        env,
        decisionMatch[1],
        body.decision,
        body.notes,
        body.modifiedContent
      );
      return cors(Response.json(result));
    }

    // ---- Static frontend (chat UI + reviewer UI) ----
    return env.ASSETS.fetch(request);
  }
};
