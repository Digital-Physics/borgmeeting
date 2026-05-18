import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ContextPicker from '../components/ContextPicker.jsx';

const API = import.meta.env.VITE_WORKER_URL || '';
const POLL_INTERVAL = 2500;

const MODEL_LABELS = {
  claude: 'Claude', chatgpt: 'ChatGPT', gemini: 'Gemini', grok: 'Grok',
};

const MODEL_HANDLES = {
  '@claude': 'claude', '@chatgpt': 'chatgpt', '@gpt': 'chatgpt',
  '@gemini': 'gemini', '@grok': 'grok', '@ai': null,
};

const MODEL_PLACEHOLDERS = {
  claude: 'sk-ant-...', chatgpt: 'sk-...', gemini: 'AIza...', grok: 'xai-...',
};

const MODEL_HINTS = {
  claude: 'console.anthropic.com', chatgpt: 'platform.openai.com',
  gemini: 'aistudio.google.com', grok: 'console.x.ai',
};

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function detectMentionedModel(text, enabledModels) {
  const lower = text.toLowerCase();
  for (const [handle, model] of Object.entries(MODEL_HANDLES)) {
    if (lower.includes(handle)) {
      if (model === null) return enabledModels[0] || null;
      return model;
    }
  }
  return null;
}

export default function Room() {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const storedKeys = sessionStorage.getItem(`apiKeys_${roomId}`);
  const isHost = !!storedKeys;

  // Join state — shown when no name is stored for this room
  const [joined, setJoined] = useState(!!sessionStorage.getItem(`name_${roomId}`));
  const [myName, setMyName] = useState(sessionStorage.getItem(`name_${roomId}`) || '');
  const [joinName, setJoinName] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');

  const [room, setRoom] = useState(null);
  const [enabledModels, setEnabledModels] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [aiTyping, setAiTyping] = useState(null);
  const [copied, setCopied] = useState(false);
  const [contextFor, setContextFor] = useState(null);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [missingKeyModel, setMissingKeyModel] = useState(null);
  const [addKeyInput, setAddKeyInput] = useState('');
  const [addKeyLoading, setAddKeyLoading] = useState(false);
  const [addKeyError, setAddKeyError] = useState('');

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const lastTimestampRef = useRef(null);
  const pollTimerRef = useRef(null);

  // Always load room info (needed for join screen too)
  useEffect(() => {
    fetch(`${API}/api/rooms/${roomId}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { navigate('/'); return; }
        setRoom(data);
        setEnabledModels(data.enabledModels || []);
      })
      .catch(() => navigate('/'));
  }, [roomId, navigate]);

  async function handleJoin(e) {
    e.preventDefault();
    if (!joinName.trim()) return;
    setJoinLoading(true);
    setJoinError('');
    try {
      const res = await fetch(`${API}/api/rooms/${roomId}`);
      if (!res.ok) throw new Error('Meeting not found.');
      sessionStorage.setItem(`name_${roomId}`, joinName.trim());
      setMyName(joinName.trim());
      setJoined(true);
    } catch (err) {
      setJoinError(err.message);
    } finally {
      setJoinLoading(false);
    }
  }

  // Fetch messages
  const fetchMessages = useCallback(async (incremental = false) => {
    try {
      const url = incremental && lastTimestampRef.current
        ? `${API}/api/rooms/${roomId}/messages?since=${encodeURIComponent(lastTimestampRef.current)}`
        : `${API}/api/rooms/${roomId}/messages`;

      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();

      if (data.length > 0) {
        lastTimestampRef.current = data[data.length - 1].created_at;
        if (incremental) {
          setMessages(prev => [...prev, ...data]);
        } else {
          setMessages(data);
        }
      }
      setLoading(false);
    } catch (_) {
      setLoading(false);
    }
  }, [roomId]);

  // Only start polling after joined
  useEffect(() => {
    if (!joined) return;
    fetchMessages(false).then(() => {
      pollTimerRef.current = setInterval(() => fetchMessages(true), POLL_INTERVAL);
    });
    return () => clearInterval(pollTimerRef.current);
  }, [joined, fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, aiTyping]);

  async function postMessage(senderName, content, isClaude = false, aiModel = null) {
    await fetch(`${API}/api/rooms/${roomId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderName, content, isClaude, aiModel }),
    });
    await fetchMessages(true);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  function handleSend() {
    const val = input.trim();
    if (!val) return;
    const mentionedModel = detectMentionedModel(val, enabledModels);
    if (mentionedModel) {
      if (!enabledModels.includes(mentionedModel)) { setMissingKeyModel(mentionedModel); return; }
      setContextFor(mentionedModel);
    } else {
      postMessage(myName, val);
      setInput('');
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
        inputRef.current.blur();
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    }
  }

  async function askAI(selectedMessages) {
    const model = contextFor;
    setContextFor(null);
    setAiTyping(model);

    const aiMessages = selectedMessages.map(m => ({
      role: m.is_claude ? 'assistant' : 'user',
      content: m.is_claude ? m.content : `${m.sender_name}: ${m.content}`,
    }));
    aiMessages.push({ role: 'user', content: `${myName}: ${input.trim()}` });

    await postMessage(myName, input.trim());
    setInput('');
    if (inputRef.current) inputRef.current.style.height = 'auto';

    try {
      const res = await fetch(`${API}/api/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, model, messages: aiMessages }),
      });
      const data = await res.json();
      if (data.error === 'no_key') { setAiTyping(null); setMissingKeyModel(model); return; }
      if (data.error) throw new Error(data.error);
      await postMessage(model, data.text, true, model);
    } catch (err) {
      alert(`AI error: ${err.message}`);
    } finally {
      setAiTyping(null);
    }
  }

  async function handleAddKey() {
    if (!addKeyInput.trim()) return;
    setAddKeyLoading(true);
    setAddKeyError('');
    try {
      const res = await fetch(`${API}/api/rooms/${roomId}/keys`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: missingKeyModel, apiKey: addKeyInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add key');
      const existing = JSON.parse(storedKeys || '{}');
      existing[missingKeyModel] = addKeyInput.trim();
      sessionStorage.setItem(`apiKeys_${roomId}`, JSON.stringify(existing));
      setEnabledModels(data.enabledModels);
      setMissingKeyModel(null);
      setAddKeyInput('');
    } catch (err) {
      setAddKeyError(err.message);
    } finally {
      setAddKeyLoading(false);
    }
  }

  async function handleEndMeeting() {
    setShowEndConfirm(false);
    await fetch(`${API}/api/rooms/${roomId}`, { method: 'DELETE' });
    navigate('/');
  }

  function copyInviteLink() {
    navigator.clipboard.writeText(`${window.location.origin}/room/${roomId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ── Join screen ──────────────────────────────────────────────────────────
  if (!joined) {
    return (
      <div className="home">
        <div className="home-card">
          <div className="home-logo">Borg<span>Meeting</span></div>
          {room && (
            <div className="join-room-info">
              <div className="join-room-label">You're joining</div>
              <div className="join-room-name">{room.name}</div>
              {enabledModels.length > 0 && (
                <div className="join-room-models">
                  {enabledModels.map(m => (
                    <span key={m} className="model-badge">{MODEL_LABELS[m]}</span>
                  ))}
                </div>
              )}
            </div>
          )}
          <form onSubmit={handleJoin}>
            <div className="form-group">
              <label className="form-label">Your name</label>
              <input className="form-input" placeholder="How others will see you"
                value={joinName} onChange={e => setJoinName(e.target.value)} autoFocus />
            </div>
            <button className="btn-primary" type="submit"
              disabled={joinLoading || !joinName.trim()}>
              {joinLoading ? 'Joining…' : 'Join meeting →'}
            </button>
            {joinError && <div className="error-msg">{joinError}</div>}
          </form>
        </div>
      </div>
    );
  }

  // ── Chat screen ──────────────────────────────────────────────────────────
  const modelHandleHint = enabledModels.map(m => `@${m === 'chatgpt' ? 'gpt' : m}`).join(', ');

  if (loading) return <div className="loading-screen"><div className="spinner" />Loading…</div>;

  return (
    <div className="room">
      <div className="room-header">
        <div className="room-header-left">
          <div className="room-name">{room?.name || roomId}</div>
          <div className="room-users">
            {enabledModels.map(m => <span key={m} className="model-badge">{MODEL_LABELS[m]}</span>)}
          </div>
        </div>
        <div className="room-header-right">
          <button className={`btn-invite ${copied ? 'copied' : ''}`} onClick={copyInviteLink}>
            {copied
              ? <><svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"/></svg>Copied!</>
              : <><svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z"/></svg>Invite</>
            }
          </button>
          {isHost && <button className="btn-end" onClick={() => setShowEndConfirm(true)}>End</button>}
        </div>
      </div>

      <div className="messages">
        {messages.map(msg => {
          const isMe = msg.sender_name === myName;
          const isAI = msg.is_claude;
          const aiModel = msg.ai_model || 'claude';

          if (isAI) return (
            <div key={msg.id} className="msg-group">
              <div className="msg-row claude-row">
                <div className="bubble claude">
                  <div className="claude-label">{MODEL_LABELS[aiModel] || aiModel}</div>
                  {msg.content}
                </div>
                <div className="msg-time">{formatTime(msg.created_at)}</div>
              </div>
            </div>
          );

          return (
            <div key={msg.id} className="msg-group">
              {!isMe && <div className="msg-sender-label">{msg.sender_name}</div>}
              <div className={`msg-row ${isMe ? 'me' : 'them'}`}>
                {isMe && <div className="msg-time">{formatTime(msg.created_at)}</div>}
                <div className={`bubble ${isMe ? 'me' : 'them'}`}>{msg.content}</div>
                {!isMe && <div className="msg-time">{formatTime(msg.created_at)}</div>}
              </div>
            </div>
          );
        })}

        {aiTyping && (
          <div className="msg-group">
            <div className="msg-row claude-row">
              <div className="typing-indicator">
                <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
              </div>
              <div className="msg-time">{MODEL_LABELS[aiTyping]} is thinking…</div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="input-area">
        <div className="input-row">
          <textarea ref={inputRef} className="msg-input"
            placeholder={enabledModels.length > 0 ? `Message… (${modelHandleHint} to ask AI)` : 'Message…'}
            rows={1} value={input}
            onChange={e => {
              setInput(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
            onKeyDown={handleKeyDown}
          />
          <button className="send-btn" onClick={handleSend} disabled={!input.trim()}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1.5a.5.5 0 01.5.5v10.793l3.146-3.147a.5.5 0 01.708.708l-4 4a.5.5 0 01-.708 0l-4-4a.5.5 0 01.708-.708L7.5 12.793V2a.5.5 0 01.5-.5z" transform="rotate(180 8 8)"/>
            </svg>
          </button>
        </div>
      </div>

      {contextFor && (
        <ContextPicker messages={messages}
          modelLabel={MODEL_LABELS[contextFor]}
          onConfirm={askAI} onCancel={() => setContextFor(null)} />
      )}

      {showEndConfirm && (
        <div className="context-picker-overlay" onClick={() => setShowEndConfirm(false)}>
          <div className="end-confirm" onClick={e => e.stopPropagation()}>
            <div className="end-confirm-title">End this meeting?</div>
            <div className="end-confirm-body">Permanently deletes the meeting and all messages for everyone.</div>
            <div className="end-confirm-actions">
              <button className="btn-cancel" onClick={() => setShowEndConfirm(false)}>Cancel</button>
              <button className="btn-end-confirm" onClick={handleEndMeeting}>End meeting</button>
            </div>
          </div>
        </div>
      )}

      {missingKeyModel && (
        <div className="context-picker-overlay" onClick={() => { setMissingKeyModel(null); setAddKeyInput(''); setAddKeyError(''); }}>
          <div className="end-confirm" onClick={e => e.stopPropagation()}>
            <div className="end-confirm-title">{MODEL_LABELS[missingKeyModel]} isn't enabled</div>
            {isHost ? (
              <>
                <div className="end-confirm-body">
                  Add a {MODEL_LABELS[missingKeyModel]} API key to use it in this meeting.
                  Get one at <strong>{MODEL_HINTS[missingKeyModel]}</strong>
                </div>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <input className="form-input" placeholder={MODEL_PLACEHOLDERS[missingKeyModel]}
                    type="password" value={addKeyInput}
                    onChange={e => setAddKeyInput(e.target.value)} autoFocus />
                  {addKeyError && <div className="error-msg" style={{ marginTop: 6 }}>{addKeyError}</div>}
                </div>
                <div className="end-confirm-actions">
                  <button className="btn-cancel" onClick={() => { setMissingKeyModel(null); setAddKeyInput(''); setAddKeyError(''); }}>Cancel</button>
                  <button className="btn-ask-claude"
                    style={{ flex: 2, padding: 11, borderRadius: 'var(--radius-sm)', fontSize: 14, fontWeight: 500, cursor: 'pointer', border: 'none' }}
                    onClick={handleAddKey} disabled={!addKeyInput.trim() || addKeyLoading}>
                    {addKeyLoading ? 'Adding…' : `Enable ${MODEL_LABELS[missingKeyModel]}`}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="end-confirm-body">
                  {MODEL_LABELS[missingKeyModel]} hasn't been set up for this meeting. Ask the host to add a {MODEL_LABELS[missingKeyModel]} API key.
                </div>
                <div className="end-confirm-actions">
                  <button className="btn-cancel" style={{ flex: 1 }} onClick={() => setMissingKeyModel(null)}>Got it</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}