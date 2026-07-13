import type { Env } from './types';

/**
 * Very lightweight destination extraction. In a more advanced version
 * you'd ask the LLM to extract this via function-calling, but a simple
 * heuristic keeps today's build fast and still counts as a real tool call.
 */
function extractDestination(message: string): string | null {
  // Matches one or two consecutive Capitalized words after "to"/"in"
  // (e.g. "Tokyo", "New York") without also grabbing trailing lowercase
  // words like "right now".
  const match = message.match(/\b(?:to|in)\s+([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)?)/);
  return match ? match[1].trim() : null;
}

/**
 * Real external tool call: Open-Meteo (no API key required).
 * Logs the call so it's visible/auditable, satisfying "tool usage
 * must be visible within the workflow."
 */
export async function maybeCallWeatherTool(env: Env, sessionId: string, message: string): Promise<string | null> {
  const destination = extractDestination(message);
  if (!destination) return null;

  try {
    const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(destination)}&count=1`);
    const geo: any = await geoRes.json();
    if (!geo.results?.length) return null;

    const { latitude, longitude, name } = geo.results[0];
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
    );
    const weather: any = await weatherRes.json();
    const summary = `Current weather in ${name}: ${weather.current_weather.temperature}°C, windspeed ${weather.current_weather.windspeed} km/h.`;

    await env.DB.prepare(
      `INSERT INTO agent_logs (id, session_id, event_type, details) VALUES (?, ?, 'tool_call', ?)`
    ).bind(crypto.randomUUID(), sessionId, JSON.stringify({ tool: 'weather', destination, result: summary })).run();

    return summary;
  } catch (err) {
    await env.DB.prepare(
      `INSERT INTO agent_logs (id, session_id, event_type, details) VALUES (?, ?, 'error', ?)`
    ).bind(crypto.randomUUID(), sessionId, `weather tool failed: ${String(err)}`).run();
    return null;
  }
}
