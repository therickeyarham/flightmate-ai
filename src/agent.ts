import { Agent } from 'agents';
import type { Env, ChatMessage } from './types';
import { retrieveContext } from './rag';
import { maybeCallWeatherTool } from './tools';
import { queueForHumanReview } from './review';
import { callLLM } from './llm';

interface AgentState {
  memory: ChatMessage[];
  preferences: Record<string, unknown>;
}

// Recommendations/bookings must go through human review before being
// shown to the user as final. Simple Q&A does not need to be queued.
function looksLikeRecommendation(userMessage: string): boolean {
  return /\b(book|recommend|suggest|which flight|best option|reserve)\b/i.test(userMessage);
}

/**
 * TravelAgent — one Durable Object instance per session (see index.ts,
 * which routes by sessionId via idFromName). This is what satisfies:
 *   - Agents SDK (this class extends Agent)
 *   - Durable Objects (Agent runs on top of a DO automatically)
 *   - Persistent Memory (this.state.memory survives across requests
 *     for the lifetime of this session's Durable Object instance,
 *     and is additionally logged to D1 for long-term history)
 */
export class TravelAgent extends Agent<Env, AgentState> {
  initialState: AgentState = { memory: [], preferences: {} };

  async onRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (request.method !== 'POST' || url.pathname !== '/chat') {
      return new Response('Not found', { status: 404 });
    }

    const { message, sessionId } = await request.json<{ message: string; sessionId: string }>();

    // ---- 1. RAG: retrieve grounded knowledge relevant to this question ----
    const context = await retrieveContext(this.env, message);
    await this.logEvent(sessionId, 'retrieval', `Retrieved ${context ? 'context' : 'no context'} for: ${message}`);

    // ---- 2. Tool calling: optionally enrich with live weather data ----
    const toolResult = await maybeCallWeatherTool(this.env, sessionId, message);

    // ---- 3. Pull persistent memory from this session's Durable Object ----
    const memory = this.state.memory ?? [];

    // ---- 4. Build the grounded prompt ----
    const systemPrompt: ChatMessage = {
      role: 'system',
      content:
        'You are FlightMate AI, a helpful travel planning assistant for a flight booking agency. ' +
        'Use the retrieved knowledge below to ground your answers in real policy/travel info whenever relevant. ' +
        'If you make a specific flight recommendation or suggest booking something, keep it concise and clearly labeled as a "Recommendation:".\n\n' +
        (context ? `Retrieved knowledge:\n${context}\n\n` : '') +
        (toolResult ? `Live data:\n${toolResult}\n\n` : '')
    };

    const messages: ChatMessage[] = [systemPrompt, ...memory, { role: 'user', content: message }];

    // ---- 5. Call the LLM through AI Gateway ----
    const reply = await callLLM(this.env, messages);
    await this.logEvent(sessionId, 'llm_call', `Prompted with ${messages.length} messages`);

    // ---- 6. Update memory (DO state) + log conversation turn to D1 ----
    const updatedMemory: ChatMessage[] = [
      ...memory,
      { role: 'user', content: message },
      { role: 'assistant', content: reply }
    ].slice(-20); // keep last 20 turns to bound memory size

    await this.setState({ ...this.state, memory: updatedMemory });
    await this.logConversationTurn(sessionId, 'user', message);
    await this.logConversationTurn(sessionId, 'agent', reply);

    // ---- 7. Human-in-the-Loop: recommendations must be approved first ----
    if (looksLikeRecommendation(message) || /recommendation:/i.test(reply)) {
      const reviewId = await queueForHumanReview(this.env, sessionId, message, reply);
      return Response.json({
        status: 'pending_review',
        reviewId,
        message: 'Your recommendation is being reviewed by a travel specialist before being finalized.'
      });
    }

    return Response.json({ status: 'ok', reply });
  }

  private async logConversationTurn(sessionId: string, role: 'user' | 'agent', content: string) {
    await this.env.DB.prepare(
      `INSERT INTO conversations (id, session_id, role, content) VALUES (?, ?, ?, ?)`
    ).bind(crypto.randomUUID(), sessionId, role, content).run();
  }

  private async logEvent(sessionId: string, eventType: string, details: string) {
    await this.env.DB.prepare(
      `INSERT INTO agent_logs (id, session_id, event_type, details) VALUES (?, ?, ?, ?)`
    ).bind(crypto.randomUUID(), sessionId, eventType, details).run();
  }
}
