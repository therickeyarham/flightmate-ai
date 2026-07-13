# FlightMate AI — Travel Planner & Booking Assistant

Built for the Cloudflare Native AI Agent Challenge. Runs entirely on Cloudflare Workers, Agents SDK, AI Gateway, D1, Durable Objects, Vectorize, and Workers AI.

## Product Overview

FlightMate AI is a chat-based travel planning assistant for a flight booking agency context. It answers questions about baggage policy, visas, and travel logistics using a real retrieval-augmented knowledge base, enriches answers with live weather data via tool calling, and routes any flight/booking **recommendation** through a human reviewer before it's shown to the user as final — mirroring how a real travel agency workflow should work (agent drafts, human approves).

## Architecture

**Worker (`src/index.ts`)** — the API layer. Routes:
- `POST /chat` → forwards to the correct per-session Durable Object (`TravelAgent`)
- `GET /reviews`, `GET /reviews/:id`, `POST /reviews/:id/decision` → Human-in-the-Loop queue
- `POST /admin/seed` → one-time knowledge base ingestion
- Everything else → static frontend (`/public`)

**Agent (`src/agent.ts`)** — `TravelAgent` extends the Cloudflare `Agent` class (Agents SDK), which runs on a Durable Object per session (keyed by `sessionId`). On each chat turn it:
1. Retrieves relevant knowledge via RAG (`src/rag.ts`)
2. Optionally calls the weather tool (`src/tools.ts`)
3. Reads persistent memory from Durable Object state
4. Calls the LLM via AI Gateway (`src/llm.ts`)
5. Updates memory + logs the turn to D1
6. If the reply looks like a recommendation, queues it for human review instead of returning it directly

**RAG pipeline (`src/rag.ts`)** — knowledge documents (`src/seed-data.ts`) are embedded with Workers AI (`@cf/baai/bge-base-en-v1.5`) and stored in Vectorize; raw text lives in D1's `knowledge_sources` table, linked by ID. Retrieval embeds the user's query, does a vector similarity search, and pulls the matching text back from D1 — this is dynamic per-query retrieval, not static prompt-stuffing.

**Human-in-the-Loop (`src/review.ts` + `public/review.html`)** — recommendations are inserted into `human_reviews` with status `pending`. A reviewer dashboard polls `GET /reviews`, and Approve/Reject/Modify decisions are submitted via `POST /reviews/:id/decision`. The user-facing chat polls the review status and displays the outcome once a human has acted.

**Durable Object usage** — each `TravelAgent` DO instance holds per-session conversation memory (`this.state.memory`), giving the agent multi-turn context without race conditions across concurrent sessions. Long-term history is additionally persisted to D1 for durability beyond a single DO's lifetime.

## Cloudflare Services Used & Why

| Service | Why |
|---|---|
| Workers | Primary backend — routing, orchestration |
| Agents SDK | `TravelAgent` class — agent lifecycle, stateful conversation loop |
| AI Gateway | All LLM calls proxied through it for logging/analytics/model routing |
| D1 | Structured storage: users, sessions, conversations, human_reviews, knowledge_sources, agent_logs |
| Durable Objects | Per-session agent memory (via Agents SDK) |
| Vectorize | Embedding storage + semantic search for RAG |
| Workers AI | Generates embeddings for RAG (`@cf/baai/bge-base-en-v1.5`) |

## Local Setup

```bash
npm install
npx wrangler login
npx wrangler d1 create flightmate-db          # copy database_id into wrangler.jsonc
npx wrangler vectorize create flightmate-knowledge --dimensions=768 --metric=cosine
npx wrangler d1 execute flightmate-db --file=./schema.sql
npx wrangler secret put OPENAI_API_KEY
```

Update `wrangler.jsonc`:
- `d1_databases[0].database_id` → your D1 database ID
- `vars.ACCOUNT_ID` → your Cloudflare account ID

Then also create an AI Gateway named `flightmate-gateway` in the Cloudflare dashboard (AI → AI Gateway → Create Gateway), or change `AI_GATEWAY_NAME` in `wrangler.jsonc` to match whatever name you choose.

Run locally:
```bash
npm run dev
```

Seed the knowledge base once the dev server is running:
```bash
curl -X POST http://127.0.0.1:8787/admin/seed
```

Open `http://127.0.0.1:8787` for the chat UI, and `http://127.0.0.1:8787/review.html` for the reviewer dashboard.

## Deployment

```bash
npm run deploy
```

After deploying, re-run the seed step against your live URL:
```bash
curl -X POST https://YOUR-WORKER.workers.dev/admin/seed
```

## Environment Variables / Secrets

| Name | Set via |
|---|---|
| `OPENAI_API_KEY` | `npx wrangler secret put OPENAI_API_KEY` |
| `ACCOUNT_ID` | plain var in `wrangler.jsonc` |
| `AI_GATEWAY_NAME` | plain var in `wrangler.jsonc` |

## Live URLs

- App: https://flightmate-ai.hatricks2374.workers.dev
- Repository: https://github.com/therickeyarham/flightmate-ai

## Requirements Checklist

- [x] Workers — API backend
- [x] Agents SDK — `TravelAgent`
- [x] AI Gateway — all LLM calls routed through it
- [x] D1 — 6 required tables + more
- [x] Durable Objects — per-session agent memory
- [x] RAG — Vectorize + Workers AI embeddings + D1, dynamic retrieval
- [x] Human-in-the-Loop — approval queue with Approve/Reject/Modify
- [x] Tool Calling — live weather API call
- [x] Persistent Memory — DO state + D1 conversation history
- [x] Real LLM Integration — OpenAI via AI Gateway, no mocks
