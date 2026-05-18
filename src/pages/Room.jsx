import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ContextPicker from '../components/ContextPicker.jsx';

const API = import.meta.env.VITE_WORKER_URL || '';
const POLL_INTERVAL = 2500; // ms

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function Room() {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const myName = sessionStorage.getItem(`name_${roomId}`);
  const apiKey = sessionStorage.getItem(`apiKey_${roomId}`);

  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [claudeTyping, setClaudeTyping] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showContextPicker, setShowContextPicker] = useState(false);
  const [error, setError] = useState('');

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const lastTimestampRef = useRef(null);
  const pollRef = useRef(null);

  // Redirect if no name
  useEffect(() => {
    if (!myName) navigate('/');
  }, [myName, navigate]);

  // Load room info
  useEffect(() => {
    fetch(`${API}/api/rooms/${roomId}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { navigate('/'); return; }
        setRoom(data);
      })
      .catch(() => navigate('/'));
  }, [roomId, navigate]);

  // Initial message load
  useEffect(() => {
    fetch(`${API}/api/rooms/${roomId}/messages`)
      .then(r => r.json())
      .then(data => {
        setMessages(data);
        if (data.length > 0) {
          lastTimestampRef.current = data[data.length - 1].created_at;
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [roomId]);

  // Polling for new messages
  useEffect(() => {
    pollRef.current = setInterval(async () => {
      try {
        const since = lastTimestampRef.current;
        const url = since
          ? `${API}/api/rooms/${roomId}/messages?since=${encodeURIComponent(since)}`
          : `${API}/api/rooms/${roomId}/messages`;

        const res = await fetch(url);
        const newMsgs = await res.json();

        if (newMsgs.length > 0) {
          setMessages(prev => [...prev, ...newMsgs]);
          lastTimestampRef.current = newMsgs[newMsgs.length - 1].created_at;
          setClaudeTyping(false);
        }
      } catch (err) {
        // silent fail on poll errors
      }
    }, POLL_INTERVAL);

    return () => clearInterval(pollRef.current);
  }, [roomId]);

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, claudeTyping]);

  async function sendMessage(content) {
    setError('');
    try {
      const res = await fetch(`${API}/api/rooms/${roomId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderName: myName, content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send');

      // If Claude responded, it'll come in on next poll
      if (data.claudeResponse) {
        setClaudeTyping(false);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleSend() {
    const val = input.trim();
    if (!val) return;

    if (val.toLowerCase().includes('@claude')) {
      setShowContextPicker(true);
    } else {
      sendMessage(val);
      setInput('');
    }
  }

  async function askClaude(selectedMessages) {
    setShowContextPicker(false);
    setClaudeTyping(true);
    const val = input.trim();
    setInput('');
    await sendMessage(val);
  }

  function copyInviteLink() {
    const url = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        Connecting…
      </div>
    );
  }

  return (
    <div className="room">
      <div className="room-header">
        <div className="room-header-left">
          <div className="room-name">{room?.name || roomId}</div>
          <div className="room-users">Room ID: {roomId}</div>
        </div>
        <div className="room-header-right">
          <button
            className={`btn-invite ${copied ? 'copied' : ''}`}
            onClick={copyInviteLink}
          >
            {copied ? (
              <>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"/>
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z"/>
                </svg>
                Invite
              </>
            )}
          </button>
        </div>
      </div>

      <div className="messages">
        {messages.map((msg) => {
          const isMe = msg.sender_name === myName;
          const isClaude = msg.is_claude;

          if (isClaude) {
            return (
              <div key={msg.id} className="msg-group">
                <div className="msg-row claude-row">
                  <div className="bubble claude">
                    <div className="claude-label">Claude</div>
                    {msg.content}
                  </div>
                  <div className="msg-time">{formatTime(msg.created_at)}</div>
                </div>
              </div>
            );
          }

          return (
            <div key={msg.id} className="msg-group">
              {!isMe && (
                <div className="msg-sender-label">{msg.sender_name}</div>
              )}
              <div className={`msg-row ${isMe ? 'me' : 'them'}`}>
                {isMe && <div className="msg-time">{formatTime(msg.created_at)}</div>}
                <div className={`bubble ${isMe ? 'me' : 'them'}`}>
                  {msg.content}
                </div>
                {!isMe && <div className="msg-time">{formatTime(msg.created_at)}</div>}
              </div>
            </div>
          );
        })}

        {claudeTyping && (
          <div className="msg-group">
            <div className="msg-row claude-row">
              <div className="typing-indicator">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="input-area">
        <div className="input-row">
          <textarea
            ref={inputRef}
            className="msg-input"
            placeholder="Message… (type @claude to ask AI)"
            rows={1}
            value={input}
            onChange={e => {
              setInput(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
            onKeyDown={handleKeyDown}
          />
          <button
            className="send-btn"
            onClick={handleSend}
            disabled={!input.trim()}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1.5a.5.5 0 01.5.5v10.793l3.146-3.147a.5.5 0 01.708.708l-4 4a.5.5 0 01-.708 0l-4-4a.5.5 0 01.708-.708L7.5 12.793V2a.5.5 0 01.5-.5z" transform="rotate(180 8 8)"/>
            </svg>
          </button>
        </div>
        {error && <div className="error-msg">{error}</div>}
        {!apiKey && (
          <div className="at-hint">
            @claude is disabled — only the room creator can invoke AI
          </div>
        )}
      </div>

      {showContextPicker && (
        <ContextPicker
          messages={messages}
          onConfirm={askClaude}
          onCancel={() => setShowContextPicker(false)}
        />
      )}
    </div>
  );
}