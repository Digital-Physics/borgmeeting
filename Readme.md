# BorgMeeting

A multi-participant AI meeting chat. Bring your own API keys. Everything is end-to-end encrypted. Nothing is tracked.

**Live at [borgmeeting.com](https://borgmeeting.com)**

---

## What it is

BorgMeeting lets you create a temporary chat room where human participants and AI models sit at the same table. You can @mention Claude, ChatGPT, Gemini, or Grok mid-conversation and they respond in context, like any other participant.

Rooms are ephemeral. They auto-delete after inactivity. There are no accounts.

---

## How the encryption works

This is the part worth reading if you are deciding whether to trust it.

When you create a room, your browser generates a random 256-bit AES-GCM key. That key never leaves your browser. It is embedded in the invite link as a URL fragment (the `#key=...` part), which browsers intentionally do not send to servers.

Every message is encrypted in your browser before it is sent to the server. The server stores ciphertext. We cannot read your messages. Nobody can read them without the full invite link.

You can verify this yourself:

1. Create a room and send a message
2. Run this against the database:
```
SELECT content FROM messages ORDER BY created_at DESC LIMIT 1;
```
You will see a base64 blob, not your message.

The relevant code is in `src/pages/roomCrypto.js`.

---

## Bring your own API keys

API keys are stored in your browser's `sessionStorage` only. They are never sent to our server. When you @mention an AI, your browser sends the key and message context directly to the AI provider's API (proxied through our Cloudflare Worker to avoid CORS issues, but not logged).

Set a spend limit on your API key before sharing a room link with others.


## Stack

- **Frontend:** React, Vite, deployed on Cloudflare Pages
- **Backend:** Cloudflare Workers
- **Database:** Cloudflare D1 (SQLite)
- **Encryption:** Web Crypto API, AES-GCM 256

---

## Privacy

No accounts. No tracking. No ads. Messages are E2E encrypted and auto-deleted.

Full policy at [borgmeeting.com/privacy](https://borgmeeting.com/privacy).

---

## License

MIT