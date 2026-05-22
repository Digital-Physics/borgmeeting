# Cloudflare Rate Limiting — BorgMeeting

These rules live in the Cloudflare dashboard, not in code. They run at the
edge before the Worker, so they're free to enforce and add zero Worker CPU time.

Set them up at: **Cloudflare Dashboard → your domain → Security → WAF → Rate limiting rules**

---

## Rules to create

### 1. Message posting — 60/min per IP per room

Prevents scripted flooding of a single room.

| Field       | Value |
|-------------|-------|
| Rule name   | `borgmeeting-message-post-rate` |
| Field       | URI Path |
| Operator    | matches regex |
| Value       | `^/api/rooms/[0-9a-f]{12}/messages$` |
| Method      | POST |
| Characteristic | IP Address |
| Threshold   | 60 requests |
| Period      | 1 minute |
| Action      | Block |
| Response    | 429 (default) |

---

### 2. Room creation — 10/hour per IP

Prevents automated room generation.

| Field       | Value |
|-------------|-------|
| Rule name   | `borgmeeting-room-create-rate` |
| Field       | URI Path |
| Operator    | equals |
| Value       | `/api/rooms` |
| Method      | POST |
| Characteristic | IP Address |
| Threshold   | 10 requests |
| Period      | 1 hour |
| Action      | Block |

---

### 3. AI proxy — 30/min per IP

The AI endpoint is the most expensive to abuse (it proxies to paid APIs).
Tighter than the message rate since each call triggers an external API request.

| Field       | Value |
|-------------|-------|
| Rule name   | `borgmeeting-ai-proxy-rate` |
| Field       | URI Path |
| Operator    | equals |
| Value       | `/api/ai` |
| Method      | POST |
| Characteristic | IP Address |
| Threshold   | 30 requests |
| Period      | 1 minute |
| Action      | Block |

---

## Also set in the dashboard

### Request body logging — disable for the Worker

The `apiKey` field passes through `/api/ai` in the request body. Cloudflare
logs request bodies by default for paid plans. Disable it to prevent keys
appearing in logs.

**Workers & Pages → claud-chat-worker → Settings → Observability**
→ Disable "Log request body"

### CORS origin — set the env var

**Workers & Pages → claud-chat-worker → Settings → Variables and Secrets**
→ Add variable: `ALLOWED_ORIGIN` = `https://borgmeeting.com`

This locks CORS in both `index.js` and `Ai.js` to your production domain.

---

## What's handled in code (not here)

For reference, limits enforced by the Worker itself (no dashboard config needed):

| Limit | Where |
|---|---|
| Max message content: 4 KB | `index.js` POST /messages |
| Max senderName: 64 chars | `index.js` POST /messages |
| Max messages per room: 500 | `index.js` POST /messages |
| Max human senders per room: 10 | `index.js` POST /messages |
| Max AI context messages: 50 | `Ai.js` handleAI |
| Provider allowlist | `Ai.js` handleAI |
| Model allowlist per provider | `Ai.js` handleAI |
| API key prefix validation | `Ai.js` handleAI |
| roomId format (12 hex chars) | `index.js` all room routes |
