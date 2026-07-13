import type { Env } from './types';

/** Queues an agent-generated recommendation for human approval. */
export async function queueForHumanReview(env: Env, sessionId: string, userMessage: string, agentOutput: string): Promise<string> {
  const id = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO human_reviews (id, session_id, user_message, agent_output, status) VALUES (?, ?, ?, ?, 'pending')`
  ).bind(id, sessionId, userMessage, agentOutput).run();

  await env.DB.prepare(
    `INSERT INTO agent_logs (id, session_id, event_type, details) VALUES (?, ?, 'review_queued', ?)`
  ).bind(crypto.randomUUID(), sessionId, `Review ${id} queued`).run();

  return id;
}

export async function listPendingReviews(env: Env) {
  const rows = await env.DB.prepare(
    `SELECT * FROM human_reviews WHERE status = 'pending' ORDER BY created_at ASC`
  ).all();
  return rows.results;
}

export async function submitReviewDecision(
  env: Env,
  reviewId: string,
  decision: 'approved' | 'rejected' | 'modified',
  notes?: string,
  modifiedContent?: string
) {
  await env.DB.prepare(
    `UPDATE human_reviews
     SET status = ?, reviewer_notes = ?, modified_content = ?, reviewed_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).bind(decision, notes ?? null, modifiedContent ?? null, reviewId).run();

  return { reviewId, decision };
}

export async function getReviewStatus(env: Env, reviewId: string) {
  const row = await env.DB.prepare(`SELECT * FROM human_reviews WHERE id = ?`).bind(reviewId).first();
  return row;
}
