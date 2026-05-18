import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_WORKER_URL || '';

export default function Home() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('create');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Create form
  const [roomName, setRoomName] = useState('');
  const [creatorName, setCreatorName] = useState('');
  const [apiKey, setApiKey] = useState('');

  // Join form
  const [joinName, setJoinName] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');

  async function handleCreate(e) {
    e.preventDefault();
    if (!roomName.trim() || !creatorName.trim() || !apiKey.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName: roomName.trim(),
          creatorName: creatorName.trim(),
          apiKey: apiKey.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create room');
      // Store identity for this room
      sessionStorage.setItem(`name_${data.roomId}`, creatorName.trim());
      sessionStorage.setItem(`apiKey_${data.roomId}`, apiKey.trim());
      navigate(`/room/${data.roomId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin(e) {
    e.preventDefault();
    if (!joinName.trim() || !joinRoomId.trim()) return;
    setLoading(true);
    setError('');
    try {
      // Extract room ID from URL if someone pastes a full link
      let roomId = joinRoomId.trim();
      const match = roomId.match(/\/room\/([a-z0-9]+)/i);
      if (match) roomId = match[1];

      const res = await fetch(`${API}/api/rooms/${roomId}`);
      if (!res.ok) throw new Error('Room not found. Check the link and try again.');
      sessionStorage.setItem(`name_${roomId}`, joinName.trim());
      navigate(`/room/${roomId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="home">
      <div className="home-card">
        <div className="home-logo">claud<span>.chat</span></div>
        <div className="home-tagline">shared conversations with AI</div>

        <div className="home-tabs">
          <button
            className={`home-tab ${tab === 'create' ? 'active' : ''}`}
            onClick={() => { setTab('create'); setError(''); }}
          >
            Create room
          </button>
          <button
            className={`home-tab ${tab === 'join' ? 'active' : ''}`}
            onClick={() => { setTab('join'); setError(''); }}
          >
            Join room
          </button>
        </div>

        {tab === 'create' ? (
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="form-label">Your name</label>
              <input
                className="form-input"
                placeholder="How others will see you"
                value={creatorName}
                onChange={e => setCreatorName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Room name</label>
              <input
                className="form-input"
                placeholder="e.g. Strategy brainstorm"
                value={roomName}
                onChange={e => setRoomName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Anthropic API key</label>
              <input
                className="form-input"
                placeholder="sk-ant-..."
                type="password"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
              />
              <div className="form-hint">
                Used to call Claude. Never shared with guests.
                Get one at console.anthropic.com
              </div>
            </div>
            <button
              className="btn-primary"
              type="submit"
              disabled={loading || !roomName.trim() || !creatorName.trim() || !apiKey.trim()}
            >
              {loading ? 'Creating…' : 'Create room →'}
            </button>
            {error && <div className="error-msg">{error}</div>}
          </form>
        ) : (
          <form onSubmit={handleJoin}>
            <div className="form-group">
              <label className="form-label">Your name</label>
              <input
                className="form-input"
                placeholder="How others will see you"
                value={joinName}
                onChange={e => setJoinName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Room link or ID</label>
              <input
                className="form-input"
                placeholder="Paste the invite link"
                value={joinRoomId}
                onChange={e => setJoinRoomId(e.target.value)}
              />
            </div>
            <button
              className="btn-primary"
              type="submit"
              disabled={loading || !joinName.trim() || !joinRoomId.trim()}
            >
              {loading ? 'Joining…' : 'Join room →'}
            </button>
            {error && <div className="error-msg">{error}</div>}
          </form>
        )}
      </div>
    </div>
  );
}
