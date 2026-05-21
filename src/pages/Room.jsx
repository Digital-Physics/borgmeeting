import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ContextPicker from '../components/ContextPicker.jsx';
import { useSkin } from './SkinContext.jsx';
import { AVATARS } from './skins.js';
import SkinPicker from './SkinPicker.jsx';
import ExportPicker from './ExportPicker.jsx';
import { exportJSON, exportMarkdown, exportPDF } from './exportUtils.js';

const API = import.meta.env.VITE_WORKER_URL || '';
const POLL_INTERVAL = 2500;

const PROVIDER_LABELS = {
  claude: 'Claude', chatgpt: 'ChatGPT', gemini: 'Gemini', grok: 'Grok',
};

const PROVIDER_MODELS = {
  claude: [
    { id: 'claude-haiku-4-5-20251001', label: 'Haiku 4.5 — fastest, cheapest' },
    { id: 'claude-sonnet-4-6',         label: 'Sonnet 4.6 — balanced' },
    { id: 'claude-opus-4-6',           label: 'Opus 4.6 — most capable' },
  ],
  chatgpt: [
    { id: 'gpt-4o-mini', label: 'GPT-4o mini — fastest, cheapest' },
    { id: 'gpt-4o',      label: 'GPT-4o — balanced' },
    { id: 'gpt-4.1',     label: 'GPT-4.1 — strong coding' },
  ],
  gemini: [
    { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash — fastest, cheapest' },
    { id: 'gemini-2.5-pro',   label: 'Gemini 2.5 Pro — most capable' },
  ],
  grok: [
    { id: 'grok-3',    label: 'Grok 3 — standard' },
    { id: 'grok-4.20', label: 'Grok 4.20 — newest flagship' },
  ],
};

const PROVIDER_PLACEHOLDERS = {
  claude: 'sk-ant-...', chatgpt: 'sk-...', gemini: 'AIza...', grok: 'xai-...',
};

const PROVIDER_HINTS = {
  claude: 'console.anthropic.com', chatgpt: 'platform.openai.com',
  gemini: 'aistudio.google.com', grok: 'console.x.ai',
};

// Detect which provider is @mentioned
const HANDLE_MAP = {
  '@claude': 'claude', '@chatgpt': 'chatgpt', '@gpt': 'chatgpt',
  '@gemini': 'gemini', '@grok': 'grok', '@ai': null,
};

function detectProvider(text, enabledProviders) {
  const lower = text.toLowerCase();
  for (const [handle, provider] of Object.entries(HANDLE_MAP)) {
    if (lower.includes(handle)) {
      return provider === null ? (enabledProviders[0] || null) : provider;
    }
  }
  return null;
}

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Guess which provider sent an AI message based on sender name
function guessProvider(senderName) {
  const lower = (senderName || '').toLowerCase();
  if (lower.includes('claude')) return 'claude';
  if (lower.includes('chatgpt') || lower.includes('gpt')) return 'chatgpt';
  if (lower.includes('gemini')) return 'gemini';
  if (lower.includes('grok')) return 'grok';
  return 'claude'; // fallback
}

export default function Room() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { skin } = useSkin();
  const avatars = AVATARS[skin.id] || AVATARS['light'];

  const getMyKeys = () => JSON.parse(sessionStorage.getItem(`keys_${roomId}`) || '{}');
  const saveMyKeys = (keys) => sessionStorage.setItem(`keys_${roomId}`, JSON.stringify(keys));

  const [joined, setJoined] = useState(!!sessionStorage.getItem(`name_${roomId}`));
  const [myName, setMyName] = useState(sessionStorage.getItem(`name_${roomId}`) || '');
  const [joinName, setJoinName] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');

  const [room, setRoom] = useState(null);
  const [enabledProviders, setEnabledProviders] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [aiTyping, setAiTyping] = useState(null);
  const [copied, setCopied] = useState(false);
  const [contextFor, setContextFor] = useState(null);

  const [addKeyFor, setAddKeyFor] = useState(null);
  const [addKeyInput, setAddKeyInput] = useState('');
  const [addKeyModel, setAddKeyModel] = useState('');
  const [addKeyLoading, setAddKeyLoading] = useState(false);
  const [addKeyError, setAddKeyError] = useState('');

  const [showExport, setShowExport] = useState(false);

  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const isHost = !!sessionStorage.getItem(`keys_${roomId}`) &&
    Object.keys(getMyKeys()).length > 0 &&
    sessionStorage.getItem(`name_${roomId}`) !== null;

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const lastTimestampRef = useRef(null);
  const pollTimerRef = useRef(null);

  useEffect(() => {
    fetch(`${API}/api/rooms/${roomId}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { navigate('/'); return; }
        setRoom(data);
        setEnabledProviders(data.enabledModels || []);
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
        setMessages(prev => incremental ? [...prev, ...data] : data);
      }
      setLoading(false);
    } catch (_) { setLoading(false); }
  }, [roomId]);

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
    const provider = detectProvider(val, enabledProviders);
    if (provider) {
      const myKeys = getMyKeys();
      if (!myKeys[provider]) {
        openAddKey(provider);
        return;
      }
      setContextFor({ provider, label: PROVIDER_LABELS[provider] });
    } else {
      postMessage(myName, val);
      setInput('');
      if (inputRef.current) inputRef.current.style.height = 'auto';
    }
  }

  async function handleExport(format, selectedMessages) {
    const roomName = room?.name || roomId;
    if (format === 'json')     exportJSON(selectedMessages, roomName);
    if (format === 'markdown') exportMarkdown(selectedMessages, roomName);
    if (format === 'pdf')      exportPDF(selectedMessages, roomName, skin);
  }

  async function askAI(provider, contextMessages) {
    const myKeys = getMyKeys();
    const { key, model } = myKeys[provider];

    setContextFor(null);
    setAiTyping(provider);

    const aiMessages = contextMessages.map(m => ({
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
        body: JSON.stringify({ roomId, provider, model, apiKey: key, messages: aiMessages }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      await postMessage(`${PROVIDER_LABELS[provider]} (${model})`, data.text, true, provider);
    } catch (err) {
      alert(`AI error: ${err.message}`);
    } finally {
      setAiTyping(null);
    }
  }

  // async function askAI(provider, contextMessages) {
  //   const val = input.trim();
  //   setInput('');
  //   if (inputRef.current) inputRef.current.style.height = 'auto';
  //   setContextFor(null);

  //   await postMessage(myName, val);
  //   setAiTyping(provider);

  //   console.log('askAI called:', { provider, contextMessages, contextFor });

  //   try {
  //     const myKeys = getMyKeys();
  //     const { key, model } = myKeys[provider] || {};

  //     console.log('myKeys:', myKeys);
  //     console.log('key:', key, 'model:', model, 'provider:', provider);

  //     const res = await fetch(`${API}/api/ai`, {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ provider, key, model, messages: contextMessages, prompt: val }),
  //     });
  //     const data = await res.json();
  //     if (!res.ok) throw new Error(data.error || 'AI error');
  //     await postMessage(PROVIDER_LABELS[provider], data.content, true, model);
  //   } catch (err) {
  //     await postMessage('System', `Error from ${PROVIDER_LABELS[provider]}: ${err.message}`, false);
  //   } finally {
  //     setAiTyping(null);
  //   }
  // }
  

  function copyInviteLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function openAddKey(provider) {
    setAddKeyFor(provider);
    setAddKeyInput('');
    setAddKeyModel(PROVIDER_MODELS[provider][0]?.id || '');
    setAddKeyError('');
  }

  async function saveKey() {
    if (!addKeyInput.trim() || !addKeyFor) return;
    setAddKeyLoading(true);
    setAddKeyError('');
    try {
      const myKeys = getMyKeys();
      myKeys[addKeyFor] = { key: addKeyInput.trim(), model: addKeyModel };
      saveMyKeys(myKeys);
      setAddKeyFor(null);
    } catch (err) {
      setAddKeyError(err.message);
    } finally {
      setAddKeyLoading(false);
    }
  }

  async function handleEndMeeting() {
    try {
      await fetch(`${API}/api/rooms/${roomId}`, { method: 'DELETE' });
    } catch (_) {}
    navigate('/');
  }

  const myProviders = Object.keys(getMyKeys());
  const allProviders = [...new Set([...enabledProviders, ...myProviders])];
  const handleHint = allProviders.map(p => `@${p === 'chatgpt' ? 'gpt' : p}`).join(', ');

  // ── Join screen ──────────────────────────────────────────────────────────
  if (!joined) {
    return (
      <div className="home">
        <div className="home-skin-picker"><SkinPicker /></div>
        <div className="home-card">
          {/* Avatars */}
          <div className="home-avatars">
            {['claude','chatgpt','gemini','grok'].map(p => (
              <div key={p} className="home-avatar"
                dangerouslySetInnerHTML={{ __html: avatars[p] }} title={PROVIDER_LABELS[p]} />
            ))}
          </div>
          <div className="home-logo">
            {skin.appName}{skin.appNameSpan && <span>{skin.appNameSpan}</span>}
          </div>
          {room && (
            <div className="join-room-info">
              <div className="join-room-label">{skin.joiningLabel}</div>
              <div className="join-room-name">{room.name}</div>
              {enabledProviders.length > 0 && (
                <div className="join-room-models">
                  {enabledProviders.map(p => (
                    <span key={p} className="model-badge">{PROVIDER_LABELS[p]}</span>
                  ))}
                </div>
              )}
            </div>
          )}
          <form onSubmit={handleJoin}>
            <div className="form-group">
              <label className="form-label">{skin.yourNameLabel}</label>
              <input className="form-input" placeholder={skin.yourNamePlaceholder}
                value={joinName} onChange={e => setJoinName(e.target.value)} autoFocus />
            </div>
            <button className="btn-primary" type="submit" disabled={joinLoading || !joinName.trim()}>
              {joinLoading ? 'Joining…' : skin.joinBtn}
            </button>
            {joinError && <div className="error-msg">{joinError}</div>}
          </form>
        </div>
      </div>
    );
  }

  if (loading) return <div className="loading-screen"><div className="spinner" />Loading…</div>;

  return (
    <div className="room">
      {/* Header */}
      <div className="room-header">
        <div className="room-header-left">
          <div className="room-name">{room?.name || roomId}</div>
          <div className="room-users">
            {allProviders.map(p => (
              <span key={p} className="model-badge">
                <span
                  style={{ display:'inline-block', width:12, height:12, borderRadius:'50%', overflow:'hidden', verticalAlign:'middle', marginRight:3 }}
                  dangerouslySetInnerHTML={{ __html: avatars[p] }}
                />
                {PROVIDER_LABELS[p]}
              </span>
            ))}
          </div>
        </div>
        <div className="room-header-right">
          <SkinPicker />
          <button className="btn-export" onClick={() => setShowExport(true)} title="Export transcript">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1a.5.5 0 01.5.5v7.793l2.146-2.147a.5.5 0 01.708.708l-3 3a.5.5 0 01-.708 0l-3-3a.5.5 0 01.708-.708L7.5 9.293V1.5A.5.5 0 018 1zM2 13.5a.5.5 0 01.5-.5h11a.5.5 0 010 1h-11a.5.5 0 01-.5-.5z"/>
            </svg>
            Export
          </button>
          <button className={`btn-invite ${copied ? 'copied' : ''}`} onClick={copyInviteLink}>
            {copied
              ? <><svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"/></svg>Copied!</>
              : <><svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z"/></svg>Invite</>
            }
          </button>
          {isHost && <button className="btn-end" onClick={() => setShowEndConfirm(true)}>End</button>}
        </div>
      </div>

      {/* Messages */}
      <div className="messages">
        {messages.map(msg => {
          const isMe = msg.sender_name === myName;
          const isAI = msg.is_claude;
          if (isAI) {
            const provider = guessProvider(msg.sender_name);
            return (
              <div key={msg.id} className="msg-group">
                <div className="msg-row claude-row">
                  <div className="bubble claude">
                    <div className="claude-label-row">
                      <div className="claude-label-avatar"
                        dangerouslySetInnerHTML={{ __html: avatars[provider] }} />
                      <span className="claude-label">{msg.sender_name}</span>
                    </div>
                    {msg.content}
                  </div>
                  <div className="msg-time">{formatTime(msg.created_at)}</div>
                </div>
              </div>
            );
          }
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
              <div className="msg-time">{PROVIDER_LABELS[aiTyping]} is thinking…</div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="input-area">
        <div className="input-row">
          <textarea ref={inputRef} className="msg-input"
            placeholder={allProviders.length > 0 ? `Message… (${handleHint} to ask AI)` : 'Message…'}
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

      {/* Context picker */}
      {/* {contextFor && (
        <ContextPicker messages={messages}
          modelLabel={contextFor.label}
          onConfirm={askAI} onCancel={() => setContextFor(null)} />
      )} */}
      {contextFor && (
        <ContextPicker
          messages={messages}
          modelLabel={contextFor.label}
          onConfirm={(msgs) => askAI(contextFor.provider, msgs)}
          onCancel={() => setContextFor(null)}
        />
      )}

      {showExport && (
        <ExportPicker
          messages={messages}
          roomName={room?.name || roomId}
          skin={skin}
          onExport={handleExport}
          onCancel={() => setShowExport(false)}
        />
      )}

      {/* Add key modal */}
      {addKeyFor && (
        <div className="context-picker-overlay" onClick={() => setAddKeyFor(null)}>
          <div className="end-confirm" onClick={e => e.stopPropagation()}>
            <div className="end-confirm-title">Add your {PROVIDER_LABELS[addKeyFor]} key</div>
            <div className="end-confirm-body">
              Your key is used only in your browser — never shared with other participants.
              Get one at <strong>{PROVIDER_HINTS[addKeyFor]}</strong>
            </div>
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">API Key</label>
              <input className="form-input" placeholder={PROVIDER_PLACEHOLDERS[addKeyFor]}
                type="password" value={addKeyInput}
                onChange={e => setAddKeyInput(e.target.value)} autoFocus />
            </div>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Model</label>
              <div className="model-select-list">
                {PROVIDER_MODELS[addKeyFor].map(m => (
                  <button key={m.id}
                    className={`model-select-row ${addKeyModel === m.id ? 'active' : ''}`}
                    onClick={() => setAddKeyModel(m.id)}
                    type="button">
                    <div className={`model-select-check ${addKeyModel === m.id ? 'checked' : ''}`}>
                      {addKeyModel === m.id && <svg width="10" height="10" viewBox="0 0 12 12" fill="white"><path d="M10 3L5 8.5 2 5.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>}
                    </div>
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
              {addKeyError && <div className="error-msg" style={{ marginTop: 6 }}>{addKeyError}</div>}
            </div>
            <div className="end-confirm-actions">
              <button className="btn-cancel" onClick={() => setAddKeyFor(null)}>Cancel</button>
              <button className="btn-ask-claude"
                style={{ flex: 2, padding: 11, borderRadius: 'var(--radius-sm)', fontSize: 14, fontWeight: 500, cursor: 'pointer', border: 'none' }}
                onClick={saveKey} disabled={!addKeyInput.trim() || addKeyLoading}>
                {addKeyLoading ? 'Saving…' : `Use ${PROVIDER_LABELS[addKeyFor]}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End meeting */}
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
    </div>
  );
}