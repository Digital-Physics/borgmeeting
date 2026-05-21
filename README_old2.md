# claud.chat

A minimal shared AI chat app. One person creates a room with their Anthropic API key, shares a link, and everyone can chat — with Claude available via `@claude`.

## Architecture

```
frontend/   React + Vite → Cloudflare Pages
worker/     Cloudflare Worker + Durable Objects + D1 (SQLite)
```

---

## Prerequisites

- [Node.js](https://nodejs.org) 18+
- [Cloudflare account](https://cloudflare.com) (free)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/): `npm install -g wrangler`
- An [Anthropic API key](https://console.anthropic.com) (for the room creator at runtime)

---

## 1. Set up the Worker

### Install dependencies
```bash
cd worker
npm install
```

### Authenticate with Cloudflare
```bash
wrangler login
```

### Create a D1 database
```bash
wrangler d1 create claud-chat
```

Copy the `database_id` from the output and paste it into `wrangler.toml`:
```toml
[[d1_databases]]
binding = "DB"
database_name = "claud-chat"
database_id = "PASTE_YOUR_ID_HERE"   # ← replace this
```

### Run the database migrations
```bash
npm run db:init
```

### Deploy the worker
```bash
npm run deploy
```

Note the deployed URL — it will look like:
`https://claud-chat-worker.YOUR-SUBDOMAIN.workers.dev`

---

## 2. Set up the Frontend

### Install dependencies
```bash
cd frontend
npm install
```

### Configure environment
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
VITE_WORKER_URL=https://claud-chat-worker.YOUR-SUBDOMAIN.workers.dev
VITE_WS_URL=wss://claud-chat-worker.YOUR-SUBDOMAIN.workers.dev
```

### Run locally
```bash
npm run dev
```

### Build for production
```bash
npm run build
```

---

## 3. Deploy Frontend to Cloudflare Pages

### Option A — Wrangler CLI
```bash
cd frontend
npm run build
wrangler pages deploy dist --project-name claud-chat
```

### Option B — Cloudflare Dashboard
1. Go to [Cloudflare Pages](https://pages.cloudflare.com)
2. Connect your GitHub repo
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Add environment variables:
   - `VITE_WORKER_URL` → your worker URL
   - `VITE_WS_URL` → same URL but with `wss://`

---

## How It Works

### Creating a Room
1. Go to the app, click **Create room**
2. Enter your name, a room name, and your Anthropic API key
3. You're dropped into the chat — copy the URL to invite others

### Joining a Room
1. Open the invite link
2. Enter your display name
3. Start chatting

### Using @claude
1. Type a message containing `@claude`
2. A **context picker** appears — all recent messages are selected by default
3. Uncheck any messages you don't want Claude to see
4. Hit **Ask Claude** — Claude's response appears for everyone in the room

### Who can invoke Claude?
Only the room creator (who has the API key stored in their session) can trigger Claude responses. Other participants will see a notice in the input area.

---

## Local Development

Run both the worker and frontend simultaneously:

**Terminal 1 — Worker:**
```bash
cd worker
npm run dev
# Runs on http://localhost:8787
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# Runs on http://localhost:5173
```

The frontend's Vite config proxies `/api` and WebSocket connections to `localhost:8787` automatically.

---

## Security Notes

- The API key is stored in `sessionStorage` — it lives only in the room creator's browser tab and is never sent to other users
- The Worker proxies Claude API calls, so the key is never exposed in network traffic visible to guests
- Room IDs are random 12-character strings — hard to guess but not cryptographically access-controlled (anyone with the link can join, like Zoom)

---

## Free Tier Limits

| Service | Free limit |
|---|---|
| Cloudflare Workers | 100,000 req/day |
| Cloudflare Durable Objects | 1M requests/month |
| Cloudflare D1 | 5M reads/day, 100k writes/day |
| Cloudflare Pages | Unlimited sites |

For a small group of friends, you will not hit these limits.
