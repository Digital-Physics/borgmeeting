import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_WORKER_URL || '';

const PROVIDERS = [
  { id: 'claude',  label: 'Claude',  hint: 'console.anthropic.com', placeholder: 'sk-ant-...' },
  { id: 'chatgpt', label: 'ChatGPT', hint: 'platform.openai.com',   placeholder: 'sk-...' },
  { id: 'gemini',  label: 'Gemini',  hint: 'aistudio.google.com',   placeholder: 'AIza...' },
  { id: 'grok',    label: 'Grok',    hint: 'console.x.ai',          placeholder: 'xai-...' },
];

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

const DEFAULT_MODEL = {
  claude: 'claude-haiku-4-5-20251001',
  chatgpt: 'gpt-4o-mini',
  gemini: 'gemini-2.5-flash',
  grok: 'grok-3',
};

export default function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [roomName, setRoomName] = useState('');
  const [creatorName, setCreatorName] = useState('');

  // Per provider: { key, model, expanded }
  const [providers, setProviders] = useState(
    Object.fromEntries(PROVIDERS.map(p => [p.id, { key: '', model: DEFAULT_MODEL[p.id], expanded: false }]))
  );

  function setProviderField(id, field, value) {
    setProviders(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  }

  function toggleExpanded(id) {
    setProviders(prev => ({ ...prev, [id]: { ...prev[id], expanded: !prev[id].expanded } }));
  }

  const hasAtLeastOneKey = Object.values(providers).some(p => p.key.trim());

  // -- Tracking 
  async function addInfoToBackend() {
    const use_localhost = false;
    const backend_address = use_localhost ? 'http://127.0.0.1:8001/visits' : 'https://gpteopardy-backend-service.onrender.com/visits';
    try {
      const response = await fetch(backend_address, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          site_id: 'borgmeeting',
        })
      });

      if (response.ok) {
        const result = await response.json();
        return result;
      } else {
        console.error('Failed to track site visit:', response.statusText);
      }
    } catch (e) {
      // console.error(e);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!roomName.trim() || !creatorName.trim() || !hasAtLeastOneKey) return;
    setLoading(true);
    setError('');
    try {
      // apiKeys for D1 — just the keys (workers don't need model choice)
      const apiKeys = Object.fromEntries(
        Object.entries(providers)
          .filter(([_, p]) => p.key.trim())
          .map(([id, p]) => [id, p.key.trim()])
      );

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

      // Store full key + model choice per provider in session
      const keyStore = Object.fromEntries(
        Object.entries(providers)
          .filter(([_, p]) => p.key.trim())
          .map(([id, p]) => [id, { key: p.key.trim(), model: p.model }])
      );
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
              Add an API key for each AI you want. At least one required.
            </div>
            <div className="multi-model-list">
              {PROVIDERS.map(p => {
                const state = providers[p.id];
                const isEnabled = !!state.key.trim();
                return (
                  <div key={p.id} className={`model-key-row ${isEnabled ? 'enabled' : ''}`}>
                    <div className="model-key-label">
                      <span className="model-key-name">{p.label}</span>
                      {isEnabled && <span className="model-key-badge">enabled</span>}
                    </div>

                    <input
                      className="form-input model-key-input"
                      placeholder={p.placeholder}
                      type="password"
                      value={state.key}
                      onChange={e => setProviderField(p.id, 'key', e.target.value)}
                    />
                    <div className="form-hint" style={{ marginBottom: isEnabled ? 10 : 0 }}>{p.hint}</div>

                    {/* Model selector — only shown when a key is entered */}
                    {isEnabled && (
                      <div className="model-select-list" style={{ marginTop: 4 }}>
                        {PROVIDER_MODELS[p.id].map(m => (
                          <button key={m.id} type="button"
                            className={`model-select-row ${state.model === m.id ? 'active' : ''}`}
                            onClick={() => setProviderField(p.id, 'model', m.id)}>
                            <div className={`model-select-check ${state.model === m.id ? 'checked' : ''}`}>
                              {state.model === m.id && (
                                <svg width="10" height="10" viewBox="0 0 12 12" fill="white">
                                  <path d="M10 3L5 8.5 2 5.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                                </svg>
                              )}
                            </div>
                            <span>{m.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
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