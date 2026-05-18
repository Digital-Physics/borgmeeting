import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_WORKER_URL || '';

const MODELS = [
  { id: 'claude',  label: 'Claude',  hint: 'console.anthropic.com', placeholder: 'sk-ant-...' },
  { id: 'chatgpt', label: 'ChatGPT', hint: 'platform.openai.com',   placeholder: 'sk-...' },
  { id: 'gemini',  label: 'Gemini',  hint: 'aistudio.google.com',   placeholder: 'AIza...' },
  { id: 'grok',    label: 'Grok',    hint: 'console.x.ai',          placeholder: 'xai-...' },
];

export default function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [roomName, setRoomName] = useState('');
  const [creatorName, setCreatorName] = useState('');
  const [apiKeys, setApiKeys] = useState({ claude: '', chatgpt: '', gemini: '', grok: '' });

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
      // Store each key + a default model choice per provider
      const keyStore = {};
      Object.entries(apiKeys).forEach(([provider, key]) => {
        if (key.trim()) keyStore[provider] = { key: key.trim(), model: DEFAULT_MODELS[provider] };
      });
      sessionStorage.setItem(`keys_${data.roomId}`, JSON.stringify(keyStore));
      navigate(`/room/${data.roomId}`);
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
        <div className="home-tagline">Where humans and AI meet</div>

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
                    {apiKeys[m.id].trim() && <span className="model-key-badge">enabled</span>}
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
      </div>
    </div>
  );
}

const DEFAULT_MODELS = {
  claude: 'claude-haiku-4-5-20251001',
  chatgpt: 'gpt-4o-mini',
  gemini: 'gemini-2.5-flash',
  grok: 'grok-3',
};