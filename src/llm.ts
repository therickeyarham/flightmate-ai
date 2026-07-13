import type { Env, ChatMessage } from './types';

/**
 * Every LLM call goes through Cloudflare AI Gateway — but instead of an
 * external provider (OpenAI/Anthropic/etc.), this uses Cloudflare's own
 * Workers AI models. No external API key, no billing setup required:
 * Workers AI runs directly on Cloudflare's infrastructure, and the
 * `gateway` option below routes the call through AI Gateway for
 * logging/analytics, satisfying the AI Gateway requirement natively.
 *
 * To switch to an external provider later (OpenAI/Anthropic/Gemini),
 * you'd instead call fetch() against the AI Gateway provider URL —
 * see Cloudflare's AI Gateway "providers" docs for that pattern.
 */
const CHAT_MODEL = '@cf/meta/llama-3.1-8b-instruct-fast';

export async function callLLM(env: Env, messages: ChatMessage[]): Promise<string> {
  const response: any = await env.AI.run(
    CHAT_MODEL,
    { messages },
    { gateway: { id: env.AI_GATEWAY_NAME } }
  );

  return response.response ?? response.result?.response ?? '';
}

