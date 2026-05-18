import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_WORKER_URL || '';

const MODELS = [
  { id: 'claude',  label: 'Claude',  hint: 'console.anthropic.com', placeholder: 'sk-ant-...' },
  { id: 'chatgpt', label: 'ChatGPT', hint: 'platform.openai.com',   placeholder: 'sk-...' },
  { id: 'gemini',  label: 'Gemini',  hint: 'aistudio.google.com',   placeholder: 'AIza...' },
  { id: 'grok',    label: 'Grok',    hint: 'console.x.ai',          placeholder: 'xai-...' },
];

const MODEL_LABEL = { claude: 'Claude', chatgpt: 'ChatGPT', gemini: 'Gemini', grok: 'Grok' };

export default function Home() {
  const navigate = useNavigate();

  const pathMatch = window.location.pathname.match(/\/room\/([a-z0-9]+)/i);
  const prefilledRoomId = pathMatch ? pathMatch[1] : '';

  const [tab, setTab] = useState(prefilledRoomId ? 'join' : 'create');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Create form
  const [roomName, setRoomName] = useState('');
  const [creatorName, setCreatorName] = useState('');
  const [apiKeys, setApiKeys] = useState({ claude: '', chatgpt: '', gemini: '', grok: '' });

  // Join form
  const [joinName, setJoinName] = useState('');
  const [roomInfo, setRoomInfo] = useState(null);

  useEffect(() => {
    if (prefilledRoomId) {
      fetch(`${API}/api/rooms/${prefilledRoomId}`)
        .then(r => r.json())
        .then(d => { if (!d.error) setRoomInfo(d); })
        .catch(() => {});
    }
  }, [prefilledRoomId]);

  const hasAtLeastOneKey = Object.values(apiKeys).some(v => v.trim());

  function setKey(model, value) {
    setApiKeys(prev => ({ ...prev, [model]: value }));
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!roomName.trim() || !creatorName.trim() || !hasAtLeastOneKey) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName: roomName.trim(),
          creatorName: creatorName.trim(),
          apiKeys,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create meeting');
      sessionStorage.setItem(`name_${data.roomId}`, creatorName.trim());
      sessionStorage.setItem(`apiKeys_${data.roomId}`, JSON.stringify(apiKeys));
      navigate(`/room/${data.roomId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin(e) {
    e.preventDefault();
    if (!joinName.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/rooms/${prefilledRoomId}`);
      if (!res.ok) throw new Error('Meeting not found. Check the link and try again.');
      sessionStorage.setItem(`name_${prefilledRoomId}`, joinName.trim());
      navigate(`/room/${prefilledRoomId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="home">
      <div className="home-card">
        <div className="home-logo">Borg<span>Meeting</span></div>
        <div className="home-tagline">shared AI-powered meetings</div>

        {!prefilledRoomId && (
          <div className="home-tabs">
            <button className={`home-tab ${tab === 'create' ? 'active' : ''}`}
              onClick={() => { setTab('create'); setError(''); }}>
              Create meeting
            </button>
            <button className={`home-tab ${tab === 'join' ? 'active' : ''}`}
              onClick={() => { setTab('join'); setError(''); }}>
              Join meeting
            </button>
          </div>
        )}

        {tab === 'create' ? (
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="form-label">Your name</label>
              <input className="form-input" placeholder="How others will see you"
                value={creatorName} onChange={e => setCreatorName(e.target.value)} autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Meeting name</label>
              <input className="form-input" placeholder="e.g. Strategy brainstorm"
                value={roomName} onChange={e => setRoomName(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">AI participants</label>
              <div className="form-hint" style={{ marginBottom: 10 }}>
                Add an API key for each AI you want in this meeting. At least one required.
              </div>
              <div className="multi-model-list">
                {MODELS.map(m => (
                  <div key={m.id} className={`model-key-row ${apiKeys[m.id].trim() ? 'enabled' : ''}`}>
                    <div className="model-key-label">
                      <span className="model-key-name">{m.label}</span>
                      {apiKeys[m.id].trim() && (
                        <span className="model-key-badge">enabled</span>
                      )}
                    </div>
                    <input
                      className="form-input model-key-input"
                      placeholder={m.placeholder}
                      type="password"
                      value={apiKeys[m.id]}
                      onChange={e => setKey(m.id, e.target.value)}
                    />
                    <div className="form-hint">{m.hint}</div>
                  </div>
                ))}
              </div>
            </div>
            <button className="btn-primary" type="submit"
              disabled={loading || !roomName.trim() || !creatorName.trim() || !hasAtLeastOneKey}>
              {loading ? 'Creating…' : 'Start meeting →'}
            </button>
            {error && <div className="error-msg">{error}</div>}
          </form>
        ) : (
          <form onSubmit={handleJoin}>
            {roomInfo && (
              <div className="join-room-info">
                <div className="join-room-label">You're joining</div>
                <div className="join-room-name">{roomInfo.name}</div>
                {roomInfo.enabledModels?.length > 0 && (
                  <div className="join-room-models">
                    {roomInfo.enabledModels.map(m => (
                      <span key={m} className="model-badge">{MODEL_LABEL[m] || m}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Your name</label>
              <input className="form-input" placeholder="How others will see you"
                value={joinName} onChange={e => setJoinName(e.target.value)} autoFocus />
            </div>
            <button className="btn-primary" type="submit"
              disabled={loading || !joinName.trim()}>
              {loading ? 'Joining…' : 'Join meeting →'}
            </button>
            {error && <div className="error-msg">{error}</div>}
          </form>
        )}
      </div>
    </div>
  );
}