-- ===== Requirement: D1 must store users, sessions, conversations, =====
-- ===== human reviews, knowledge sources, and agent activity logs   =====

DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT,
  preferences TEXT DEFAULT '{}',   -- JSON: budget, seat pref, favorite airlines, etc.
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS sessions;
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  started_at TEXT DEFAULT CURRENT_TIMESTAMP,
  ended_at TEXT
);

DROP TABLE IF EXISTS conversations;
CREATE TABLE conversations (
  id TEXT PRIMARY KEY,
  session_id TEXT,
  role TEXT,               -- 'user' | 'agent' | 'tool'
  content TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS human_reviews;
CREATE TABLE human_reviews (
  id TEXT PRIMARY KEY,
  session_id TEXT,
  user_message TEXT,
  agent_output TEXT,        -- the draft recommendation awaiting review
  status TEXT DEFAULT 'pending',   -- pending | approved | rejected | modified
  reviewer_notes TEXT,
  modified_content TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TEXT
);

DROP TABLE IF EXISTS knowledge_sources;
CREATE TABLE knowledge_sources (
  id TEXT PRIMARY KEY,
  title TEXT,
  content TEXT,
  source_type TEXT,          -- 'airline_policy' | 'faq' | 'visa_info' | 'baggage' etc.
  vector_id TEXT,             -- links this row to its Vectorize embedding
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS agent_logs;
CREATE TABLE agent_logs (
  id TEXT PRIMARY KEY,
  session_id TEXT,
  event_type TEXT,           -- 'tool_call' | 'llm_call' | 'retrieval' | 'error' | 'review_queued'
  details TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
