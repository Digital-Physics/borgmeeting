import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ContextPicker from '../components/ContextPicker.jsx';

const API = import.meta.env.VITE_WORKER_URL || '';
const WS_URL = import.meta.env.VITE_WS_URL || API.replace('https://', 'wss://').replace('http://', 'ws://');

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Group consecutive messages from the same sender
function groupMessages(messages) {
  const groups = [];
  for (const msg of messages) {
    const last = groups[groups.length - 1];
    if (last && last.sender_name === msg.sender_name && !msg.is_claude) {
      last.messages.push(msg);
    } else {
      groups.push({ sender_name: msg.sender_name, is_claude: msg.is_claude, messages: [msg] });
    }
  }
  return groups;
}

export default function Room() {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const myName = sessionStorage.getItem(`name_${roomId}`);
  const apiKey = sessionStorage.getItem(`apiKey_${roomId}`);

  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [claudeTyping, setClaudeTyping] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showContextPicker, setShowContextPicker] = useState(false);

  const wsRef = useRef(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const reconnectTimer = useRef(null);

  // Redirect if no name stored
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

  // WebSocket connection
  const connect = useCallback(() => {
    if (!myName) return;
    const ws = new WebSocket(`${WS_URL}/room/${roomId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'join', name: myName }));
      setLoading(false);
    };

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      switch (msg.type) {
        case 'history':
          setMessages(msg.messages);
          setUsers(msg.users);
          break;
        case 'message':
          setMessages(prev => [...prev, msg]);
          setClaudeTyping(false);
          break;
        case 'user_joined':
          setUsers(msg.users);
          setMessages(prev => [...prev, {
            id: Date.now(),
            system: true,
            content: `${msg.name} joined`,
            created_at: new Date().toISOString(),
          }]);
          break;
        case 'user_left':
          setUsers(msg.users);
          setMessages(prev => [...prev, {
            id: Date.now(),
            system: true,
            content: `${msg.name} left`,
            created_at: new Date().toISOString(),
          }]);
          break;
      }
    };

    ws.onclose = () => {
      reconnectTimer.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => ws.close();
  }, [roomId, myName]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, claudeTyping]);

  function sendMessage(content) {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: 'message', content }));
  }

  async function askClaude(selectedMessages) {
    setShowContextPicker(false);
    setClaudeTyping(true);

    // Build messages array for Claude
    const claudeMessages = selectedMessages.map(m => ({
      role: m.is_claude ? 'assistant' : 'user',
      content: m.is_claude ? m.content : `${m.sender_name}: ${m.content}`,
    }));

    // Add the @claude trigger message
    claudeMessages.push({
      role: 'user',
      content: `${myName}: ${input.trim()}`,
    });

    try {
      const res = await fetch(`${API}/api/claude`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, messages: claudeMessages }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // First send the user's @claude message
      sendMessage(input.trim());
      setInput('');

      // Then broadcast Claude's response via WebSocket
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'claude_response', content: data.text }));
      }
    } catch (err) {
      setClaudeTyping(false);
      alert(`Claude error: ${err.message}`);
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
      // Show context picker
      setShowContextPicker(true);
    } else {
      sendMessage(val);
      setInput('');
    }
  }

  function copyInviteLink() {
    const url = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const userList = users.filter(Boolean).join(', ');
  const groups = groupMessages(messages.filter(m => !m.system));
  const systemMessages = messages.filter(m => m.system);

  // Interleave system messages with groups for rendering
  const allRendered = messages.map((msg, i) => ({ msg, i }));

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
          <div className="room-users">
            {users.length === 0 ? 'No one here yet' :
             users.length === 1 ? `Just you` :
             `${users.length} people — ${userList}`}
          </div>
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
        {allRendered.map(({ msg }) => {
          if (msg.system) {
            return (
              <div key={msg.id} className="system-msg">
                {msg.content}
              </div>
            );
          }

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
            <div key={msg.id} className={`msg-group`}>
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
              // Auto-resize
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
        {!apiKey && (
          <div className="at-hint">
            @claude is disabled — only the room creator can invoke AI
          </div>
        )}
      </div>

      {showContextPicker && (
        <ContextPicker
          messages={messages.filter(m => !m.system)}
          onConfirm={askClaude}
          onCancel={() => setShowContextPicker(false)}
        />
      )}
    </div>
  );
}
