# BorgMeeting — Project Brief & Launch Roadmap

## What It Is

BorgMeeting is a bring-your-own-key (BYOK) multi-participant AI chat application. Users create a
named "room", invite other humans, and can @-mention any of the supported AI providers
mid-conversation. Because users supply their own API keys, BorgMeeting has zero AI inference
costs — a fundamental differentiator from every other AI chat product.

**Tagline:** *Where humans and AI meet.*

**Live worker:** `claud-chat-worker` (Cloudflare Workers)
**Database:** `claudesourcing` (Cloudflare D1 / SQLite)

---

## Current Stack

### Frontend

- React + Vite, deployed statically
- React Router for `/` (Home) and `/room/:roomId` (Room)
- `sessionStorage` for per-room API keys and display names (keyed by roomId)
- `localStorage` for skin preference

**Key components:**

| File | Purpose |
|---|---|
| `Home.jsx` | Room creation, provider/model selection, skin picker |
| `Room.jsx` | Chat UI, AI @-mention dispatch, export trigger, join screen |
| `ContextPicker.jsx` | Message subset selector (used for AI context windowing) |
| `ExportPicker.jsx` | Export variant of ContextPicker with format buttons |
| `SkinPicker.jsx` | Floating theme switcher dropdown |
| `SkinContext.jsx` | React context — applies CSS vars to `:root`, persists to localStorage |
| `skins.js` | All skin definitions: CSS variables, copy overrides, SVG avatars per provider |
| `exportUtils.js` | Pure export functions: JSON, Markdown, PDF (via `window.print`) |

**Supported AI providers:** Claude (Anthropic), ChatGPT (OpenAI), Gemini (Google), Grok (xAI)

**Supported skins:** Borg Meeting, Couples Therapy, Project Launch, Vacation Planner, Light, Dark

---

### Backend

**Runtime:** Cloudflare Worker (`worker/src/index.js` + `worker/src/Ai.js`)
**Database:** Cloudflare D1 SQLite (`worker/src/schema.sql`)
**Config:** `worker/wrangler.toml`
**Cron:** Daily at 03:00 UTC — cleans up rooms inactive for 7+ days

---

## Database Schema

```sql
CREATE TABLE rooms (
  id            TEXT PRIMARY KEY,       -- 12-char random hex (UUID stripped)
  name          TEXT NOT NULL,          -- human-readable room name
  api_keys      TEXT NOT NULL,          -- JSON object: { provider: apiKey }
  creator_name  TEXT NOT NULL,
  created_at    TEXT NOT NULL,          -- ISO 8601
  last_activity TEXT NOT NULL           -- ISO 8601, updated on every message GET/POST
);

CREATE TABLE messages (
  id           TEXT PRIMARY KEY,        -- UUID v4
  room_id      TEXT NOT NULL,           -- FK → rooms.id
  sender_name  TEXT NOT NULL,
  content      TEXT NOT NULL,
  is_claude    INTEGER NOT NULL DEFAULT 0,  -- 1 = AI message
  ai_model     TEXT,                    -- e.g. "claude-sonnet-4-6", null for humans
  created_at   TEXT NOT NULL            -- ISO 8601
);

-- Indexes
CREATE INDEX idx_messages_room_id   ON messages(room_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_rooms_last_activity ON rooms(last_activity);
```

**Planned schema changes:**
- `rooms.api_keys` — **remove entirely**. Keys are managed client-side in sessionStorage
  and sent per-request to `/api/ai`. They serve no purpose in D1 and represent the
  largest current security exposure. The frontend never reads them back from the server.
- `messages.is_claude` — **deprecate**. Legacy binary flag meaning "this message came from
  an AI". Entirely redundant with `ai_model IS NOT NULL`. Remove from schema and all
  queries once frontend references are updated.
- `rooms.enabled_providers` — **add**. A simple comma-separated or JSON list of provider
  names (e.g. `["claude","gemini"]`). Replaces the current pattern of deriving
  `enabledModels` from the `api_keys` JSON keys.

**Current schema notes:**
- `last_activity` is updated on both GET and POST to `/messages`, keeping the TTL alive
  as long as anyone is polling the room
- The cron job does a two-step delete: messages first, then the room (respects FK intent
  even though D1 doesn't enforce FKs)

---

## API Reference

All endpoints return JSON. All support CORS (currently `*` — see hardening notes).

### Rooms

#### `POST /api/rooms`
Create a new room.

**Body:**
```json
{
  "roomName": "Strategy brainstorm",
  "creatorName": "Maya",
  "apiKeys": { "claude": "sk-ant-...", "gemini": "AIza..." }
}
```
**Returns:** `{ roomId: "a3f9bc12e401" }` (201)

**Validation:** roomName, creatorName, and at least one non-empty apiKey required.
RoomId is `crypto.randomUUID()` with dashes stripped, sliced to 12 chars.

---

#### `GET /api/rooms/:roomId`
Get room metadata. Used by the join screen and Room component on load.

**Returns:**
```json
{
  "id": "a3f9bc12e401",
  "name": "Strategy brainstorm",
  "creator_name": "Maya",
  "created_at": "2025-05-21T14:00:00.000Z",
  "enabledModels": ["claude", "gemini"]
}
```
Note: `api_keys` values are intentionally stripped — only provider names returned.

---

#### `DELETE /api/rooms/:roomId`
Delete a room and all its messages. Called by the host via the "End meeting" button.

**Returns:** `{ success: true }`

---

#### `PATCH /api/rooms/:roomId/keys`
Add or update an API key for a provider in an existing room.
Currently unused by the frontend (keys are stored client-side in sessionStorage)
but available for future use.

**Body:** `{ "model": "grok", "apiKey": "xai-..." }`
**Returns:** `{ enabledModels: ["claude", "gemini", "grok"] }`

---

### Messages

#### `GET /api/rooms/:roomId/messages`
Fetch messages. Supports incremental polling via `?since=<ISO timestamp>`.

- Without `since`: returns up to 200 most recent messages, ordered ASC
- With `since`: returns only messages with `created_at > since`, up to 100, ordered ASC

Also updates `rooms.last_activity` on every call (keeps TTL alive while room is open).

**Returns:** Array of message objects:
```json
[
  {
    "id": "uuid",
    "room_id": "a3f9bc12e401",
    "sender_name": "Maya",
    "content": "Let's talk strategy",
    "is_claude": 0,
    "ai_model": null,
    "created_at": "2025-05-21T14:01:00.000Z"
  },
  {
    "id": "uuid",
    "sender_name": "Claude (claude-sonnet-4-6)",
    "content": "Happy to help...",
    "is_claude": 1,
    "ai_model": "claude-sonnet-4-6",
    ...
  }
]
```

---

#### `POST /api/rooms/:roomId/messages`
Post a new message (human or AI).

**Body:**
```json
{
  "senderName": "Maya",
  "content": "What do you think, @claude?",
  "isClaude": false,
  "aiModel": null
}
```
Also updates `rooms.last_activity`.

**Returns:** `{ id: "uuid", created_at: "..." }` (201)

---

### AI Proxy

#### `POST /api/ai`
Proxies a request to the appropriate AI provider. Called by the Room after the user
confirms context via ContextPicker.

**Body:**
```json
{
  "roomId": "a3f9bc12e401",
  "provider": "gemini",
  "model": "gemini-2.5-flash",
  "apiKey": "AIza...",
  "messages": [
    { "role": "user", "content": "Maya: What do you think about the Q3 plan?" },
    { "role": "assistant", "content": "I think it's solid but..." },
    { "role": "user", "content": "Maya: @gemini weigh in here" }
  ]
}
```

**Validation:** All six fields required. Returns 400 `{ error: 'Missing required fields' }` if any absent.

**Returns:** `{ text: "...", provider: "gemini", model: "gemini-2.5-flash" }`

**Provider routing in `Ai.js`:**

| Provider | Endpoint | Auth | Notes |
|---|---|---|---|
| `claude` | `api.anthropic.com/v1/messages` | `x-api-key` header | `anthropic-version: 2023-06-01`, system prompt separate |
| `chatgpt` | `api.openai.com/v1/chat/completions` | `Authorization: Bearer` | System prompt prepended to messages array |
| `gemini` | `generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key=` | Query param | Roles mapped: `assistant` → `model`; system prompt via `system_instruction` |
| `grok` | `api.x.ai/v1/chat/completions` | `Authorization: Bearer` | Same shape as ChatGPT/OpenAI |

**System prompt (all providers):**
> *"You are a helpful AI participant in a group meeting chat called BorgMeeting.
> Be conversational, concise, and helpful. You are being @mentioned by users who want your input.
> Respond naturally as a meeting participant, not as a generic assistant."*

**Important:** The `apiKey` field passes through the worker in plaintext and is forwarded
directly to the provider. It is never persisted to D1 from this endpoint, but it does
appear in Cloudflare request logs. See hardening notes below.

---

### Cron Job

Runs daily at 03:00 UTC via `[triggers] crons = ["0 3 * * *"]` in wrangler.toml.

```js
// Pseudocode
SELECT id FROM rooms WHERE last_activity < datetime('now', '-7 days')
→ for each: DELETE messages WHERE room_id = ?
→ then:     DELETE rooms WHERE id = ?
```

---

## Multi-participant Key Model

Each participant brings their own API keys. Keys are never shared between participants.

```
Maya's browser                        Jon's browser
─────────────────────                 ─────────────────────
sessionStorage:                       sessionStorage:
  keys_a3f9bc12e401: {                  keys_a3f9bc12e401: {
    gemini: { key: "AIza-maya..." }       gemini: { key: "AIza-jon..." }
    claude: { key: "sk-ant-..."  }        chatgpt: { key: "sk-..."     }
  }                                     }
  name_a3f9bc12e401: "Maya"             name_a3f9bc12e401: "Jon"
```

- Maya @gemini → uses Maya's Gemini key, billed to Maya
- Jon @gemini → uses Jon's Gemini key, billed to Jon
- Jon @claude → Jon has no Claude key → prompted to add one
- Neither can use the other's key — keys never leave their owner's browser

---

## What Is Stored on the Server

### Current state (before planned cleanup)

```
D1 table: rooms
  id                TEXT   "a3f9bc12e401"
  name              TEXT   "Strategy brainstorm"
  api_keys          TEXT   '{"claude":"sk-ant-...","gemini":"AIza..."}' ← REMOVE
  creator_name      TEXT   "Maya"
  created_at        TEXT   "2025-05-21T14:00:00.000Z"
  last_activity     TEXT   "2025-05-21T15:30:00.000Z"

D1 table: messages
  id                TEXT   "uuid-v4"
  room_id           TEXT   "a3f9bc12e401"
  sender_name       TEXT   "Maya"
  content           TEXT   "What do you think, @claude?"  ← ENCRYPT
  is_claude         INT    0                               ← REMOVE
  ai_model          TEXT   null
  created_at        TEXT   "2025-05-21T14:01:00.000Z"
```

### After planned changes (target state)

```
D1 table: rooms
  id                TEXT   "a3f9bc12e401"
  name              TEXT   "Strategy brainstorm"
  enabled_providers TEXT   '["claude","gemini"]'   ← replaces api_keys (no secrets)
  creator_name      TEXT   "Maya"
  created_at        TEXT   "2025-05-21T14:00:00.000Z"
  last_activity     TEXT   "2025-05-21T15:30:00.000Z"

D1 table: messages
  id                TEXT   "uuid-v4"
  room_id           TEXT   "a3f9bc12e401"
  sender_name       TEXT   "Maya"
  content           TEXT   "AES-GCM ciphertext..."   ← server cannot read
  ai_model          TEXT   null
  created_at        TEXT   "2025-05-21T14:01:00.000Z"
```

The server knows: room names, participant display names, timestamps, which AI providers
are enabled, and which messages came from which AI model.

The server does not know: any API keys, any message content (after E2E), anything about
participants beyond the display name they chose.

---

## URL Structure

**Current:**
```
https://borgmeeting.com/room/a3f9bc12e401
                              └─ 12-char room ID (stored in D1, sent to server)
```

**After E2E encryption:**
```
https://borgmeeting.com/room/a3f9bc12e401#key=base64encodedAES256key
                              └─ room ID  └─ fragment: never sent to server (HTTP spec)
```

The `#key=...` fragment is the AES-256 decryption key for all messages in that room.
Anyone with the full invite URL can read the conversation. Anyone without it — including
the server operator — sees only ciphertext in D1.

Losing the URL means losing access to the conversation. There is no recovery mechanism
by design. This should be communicated clearly to users.

---

## Architecture Diagram

```
Maya's browser                         Jon's browser
(has Maya's API keys in sessionStorage) (has Jon's API keys in sessionStorage)
         │                                       │
         └──────────────┬────────────────────────┘
                        │  (both poll same room)
                        ▼
            Cloudflare Worker (claud-chat-worker)
            ┌─────────────────────────────────┐
            │  index.js  — routing            │
            │  Ai.js     — provider proxy     │
            └────────────┬────────────────────┘
                         │
                 Cloudflare D1 (claudesourcing)
                 ┌───────────────────────────┐
                 │  rooms    — metadata only  │
                 │  messages — ciphertext     │
                 └───────────────────────────┘
                         │
            Worker proxies /api/ai calls to:
            ├── api.anthropic.com              (Claude)
            ├── api.openai.com                 (ChatGPT)
            ├── generativelanguage.googleapis.com (Gemini)
            └── api.x.ai                       (Grok)
            Using the caller's own API key —
            billed to them, never stored.

Separate tracking (fire-and-forget, errors swallowed):
  POST https://gpteopardy-backend-service.onrender.com/visits
  Body: { site_id: "borgmeeting" }
  Called once on Home mount.
```

---

## Planned Improvements

### 1. End-to-End Encryption (highest priority)

**Goal:** D1 should never contain readable message content or API keys.

**Approach — messages:**
- On room creation, generate a random 256-bit key via `crypto.subtle.generateKey`
- Embed it in the invite URL as a fragment: `/room/abc123#key=<base64>`
- URL fragments are never sent to the server — the key never touches D1
- Encrypt every message with AES-GCM before POST, decrypt after GET
- D1 `messages.content` stores ciphertext only

**Approach — api_keys in rooms table:**
- Currently stored as plaintext JSON in `rooms.api_keys`
- These are only used server-side for the `/keys` PATCH endpoint (currently unused by frontend)
- Frontend already stores keys in sessionStorage and sends them per-request to `/api/ai`
- Simplest fix: stop persisting api_keys to D1 entirely, or encrypt with the room key

**Result:** Genuine zero-knowledge hosting. Strong answer to any compliance or legal question.

---

### 2. Abuse Protection & Rate Limiting

Add to the Worker:

| Protection | Limit | Rationale |
|---|---|---|
| Max message size | 2KB | No real message needs more; kills bulk data abuse |
| Max messages per room | 500 | Generous for long working sessions; still bounded |
| Max unique human senders per room | 10 | AI senders don't count — they add no storage pressure |
| Room creation per IP per day | 10 | Covers office/shared WiFi teams on the same IP |
| Message POST rate | 60/min per room | Nobody types this fast; kills scripted flooding |
| Room creation rate | 5/hour per IP | Prevents rapid automated room generation |
| Room TTL | 7 days inactivity | Generous for session use; dead rooms auto-cleaned |

**Free vs paid tier (for later):**

| Limit | Free | Paid |
|---|---|---|
| Human participants per room | 10 | Unlimited |
| Messages per room | 500 | 2,000 |
| Rooms created per day per IP | 10 | Unlimited |
| Room TTL | 7 days | 30 days |
| Custom room URLs | ✗ | ✓ |

---

### 3. Security Hardening

#### Threat model

Security is fundamentally a graph problem: every sensitive value is a node, every storage
location is a node, every actor (legitimate user, XSS attacker, server attacker, physical
device attacker) is a node. The edges are "can reach" relationships. Good design means no
attacker node has a path to a sensitive node, while every legitimate user node does.

For BorgMeeting there are three sensitive node types:

- **Message content** — addressed by E2E encryption (see section 1)
- **Provider API keys** — the main remaining exposure, discussed below
- **Room identity / invite links** — low sensitivity, but worth protecting from leakage

**The hard truth about client-side API keys:**

There is no storage mechanism that is simultaneously convenient, persistent across sessions,
and immune to a compromised browser. The threat matrix is:

```
Attacker with server access (D1 breach)
  → api_keys removed from D1 entirely          ✓  (planned)
  → message ciphertext only in D1              ✓  (E2E encryption)

Attacker with XSS on your page
  → can read sessionStorage                    ✗  (unavoidable if JS runs)
  → can read window.location.hash              ✗  (unavoidable if JS runs)
  → tight CSP blocks all foreign scripts       ✓  (CSP is the real defence)

Attacker with physical device access
  → can read localStorage                      ✗  (if keys persisted there)
  → sessionStorage cleared on tab close        ✓  (smaller window)
  → encrypted localStorage blob w/ fragment   ✓  (useless without URL)

Legitimate user closes tab / loses session
  → sessionStorage gone, must re-enter keys   ✗  (UX cost of short-lived storage)
```

The key insight: **if an attacker can run JavaScript on your page, no client-side storage
is safe.** The correct response is not to find a better storage location — it is to prevent
foreign scripts from running in the first place. That is what CSP does.

**The economic argument:**

The attack surface is also naturally limited by the economics of the target. A stolen
BorgMeeting API key with a $5–$20 spend limit, scoped to a single session, is an extremely
low-value target. Sophisticated attacks (XSS injection, session hijacking) require
meaningful effort and carry legal risk for the attacker. The expected payoff — a
near-exhausted prepaid API token — makes BorgMeeting a poor target compared to banking
credentials, OAuth tokens, or keys with no spend limits.

**This is why spend limits are the single most important security control for users.**
They transform a potential compromise from a catastrophic event into a bounded, recoverable
one. A stolen key with a $10 cap costs the user at most $10 and a few minutes to rotate.
Emphasise this strongly in the UI.

#### Recommended approach for API key storage

**Short term (implement now):**
- Keep keys in `sessionStorage` — scoped to the tab, cleared on close, never touches D1
- Remove `api_keys` column from D1 `rooms` table entirely (frontend never reads it back)
- Remove the `/api/rooms/:roomId/keys` PATCH endpoint (unused, unnecessary attack surface)
- Disable Cloudflare request body logging to prevent keys appearing in logs

**Medium term (implement with E2E work):**
- Move keys to React context (in-memory) during a session — never written to any storage
- On session restore (user returns via invite link), prompt for keys again
- Optionally: encrypt keys with AES-GCM using the URL fragment as the encryption key,
  store the blob in localStorage. This protects against physical device access
  (the blob is useless without the URL) but does not protect against XSS.
  It is one extra layer, not a complete solution.

**The UX tradeoff:**
- Shorter-lived storage = better security, worse UX (re-enter keys more often)
- sessionStorage (current) is the right balance for a session-oriented product
- Make re-entry as frictionless as possible: pre-fill provider hints, remember model
  choice in localStorage (not the key itself), clear guidance on where to get keys

#### Worker / server hardening

- **CORS** — lock `Access-Control-Allow-Origin` from `*` to the production domain only.
  Both `index.js` and `Ai.js` currently define separate `corsHeaders` objects — unify
  into a single shared constant and restrict to your domain.
- **API key not logged** — `apiKey` passes through `/api/ai` in the request body and will
  appear in Cloudflare request logs if body logging is enabled. Disable body logging in
  the Cloudflare dashboard for the worker, or redact the field before any logging.
- **Input sanitisation** — escape HTML in `senderName` and `content` at write time in the
  POST messages handler. Prevents stored XSS in the chat UI.
- **`roomId` not validated** — the worker accepts any string as a roomId path parameter.
  Add a format check (12 hex chars) before any D1 query.
- **Remove dead endpoints** — the `/api/rooms/:roomId/keys` PATCH endpoint is unused by
  the frontend. Remove it to reduce attack surface.

#### Frontend hardening

- **Content Security Policy** — the most important XSS control. A strict CSP that blocks
  inline scripts and whitelists only your own domain + Google Fonts effectively prevents
  the most common XSS attack vectors. Add as HTTP response headers on the static deployment.
  Example starter policy:
  ```
  Content-Security-Policy:
    default-src 'self';
    script-src 'self';
    style-src 'self' https://fonts.googleapis.com;
    font-src https://fonts.gstatic.com;
    connect-src 'self' https://*.workers.dev https://api.anthropic.com
      https://api.openai.com https://generativelanguage.googleapis.com https://api.x.ai;
    img-src 'self' data:;
  ```
- **Referrer policy** — set `Referrer-Policy: strict-origin-when-cross-origin` to prevent
  roomIds leaking in referrer headers when users click external links from inside a room.
- **Subresource integrity** — if any external scripts are ever added, use SRI hashes.

---

### 4. Legal & Compliance

#### Must-haves before launch

- **Privacy policy** — describe: IP addresses (Cloudflare logs), room metadata stored in D1,
  message content E2E encrypted and inaccessible to BorgMeeting (after E2E is implemented),
  7-day TTL auto-deletion. With E2E in place this is a genuinely strong, simple privacy story.
  Use Termly or Iubenda to generate a baseline then customise.
- **Terms of service** — key clauses: prohibited uses (illegal content, harassment, spam, bots),
  right to terminate rooms for abuse, limitation of liability, users own their content.
- **GDPR / CCPA** — with E2E encryption you cannot produce message content even on legal request.
  Handle metadata deletion via a simple contact email for now.

#### Should-haves

- **API key security warning in UI** — make clear keys are stored in sessionStorage, recommend
  users set spending limits on their provider dashboards before sharing a room link.
  Link directly to each provider's billing/limits page from the key input hint text.
- **Spending limit guidance** — one-line note per provider in the UI:
  e.g. *"Set a monthly spend cap at console.anthropic.com before inviting others."*
- **Abuse reporting** — a "Report this room" link that POSTs the roomId to a flagging endpoint.
  You can't read messages, but you can delete the room. Email notification to yourself is fine
  to start.
- **Data retention UI** — let the room creator choose TTL at creation time: 24h / 7d / 30d.
  Stored in `rooms` table. Makes the privacy story tangible and user-controlled.

#### Nice-to-haves

- **Room password option** — optional password on top of the URL key fragment
- **Status page** — even a static page at `status.borgmeeting.com` signals legitimacy
- **Cookie/tracking banner** — if analytics beyond the current visit ping are added

---

### 5. Product / UX Backlog

| Feature | Status | Notes |
|---|---|---|
| Skins (6 themes) | ✅ Done | CSS vars, per-skin copy, SVG avatars |
| Export (JSON / Markdown / PDF) | ✅ Done | ExportPicker + exportUtils.js |
| E2E encryption | 🔲 Planned | See above |
| Abuse rate limiting | 🔲 Planned | See above |
| Privacy policy + ToS | 🔲 Planned | Must-have before launch |
| API key warnings + spend limit links | 🔲 Planned | Should-have |
| Abuse reporting endpoint | 🔲 Planned | Should-have |
| Data retention UI (TTL picker) | 🔲 Planned | Should-have |
| Room password option | 🔲 Planned | Nice-to-have |
| Load-from-JSON transcript viewer | 🔲 Later | `/transcript` route, read-only, no backend changes |
| Status page | 🔲 Later | Nice-to-have |
| Mobile polish | 🔲 Later | Works but not optimised |

---

## Prioritised Next Steps

1. **E2E encryption** — Web Crypto AES-GCM, key in URL fragment, encrypt before POST
2. **Worker hardening** — CORS restriction, message size cap, rate limiting, roomId validation
3. **Privacy policy + ToS** — minimum viable legal coverage
4. **API key warnings + spending limit links** in UI
5. **Abuse reporting endpoint**
6. **Data retention UI** (TTL choice at room creation, stored in rooms table)
7. **Room password option**
8. **Load-from-JSON transcript viewer**
9. **Status page**
10. **Mobile polish**

---

## Business Model (TBD)

Core insight: BYOK means zero AI inference costs. Unit economics are Cloudflare
Workers + D1 (effectively free at small scale) + domain + time.

Working hypothesis: **free tier with generous limits, paid tier for power users**.
Exact pricing TBD once there is real usage data.

Natural upsells given current architecture:
- **Longer rooms / more participants** — paid tier limit increases
- **White-labelling** — custom skins, custom domain; the skin system already makes this easy
- **Team/enterprise** — persistent rooms, admin controls, audit logs, SSO
