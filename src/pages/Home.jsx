import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSkin } from './SkinContext.jsx';
import { AVATARS } from './skins.js';
import SkinPicker from './SkinPicker.jsx';
import { generateRoomKey, exportKeyToBase64 } from './roomCrypto.js';

const API = import.meta.env.VITE_WORKER_URL || '';

const PROVIDERS = [
  { id: 'claude',  label: 'Claude',  hint: 'console.anthropic.com', placeholder: 'sk-ant-...', spendUrl: 'https://console.anthropic.com/settings/limits' },
  { id: 'chatgpt', label: 'ChatGPT', hint: 'platform.openai.com',   placeholder: 'sk-...',     spendUrl: 'https://platform.openai.com/settings/organization/limits' },
  { id: 'gemini',  label: 'Gemini',  hint: 'aistudio.google.com',   placeholder: 'AIza...',    spendUrl: 'https://console.cloud.google.com/apis/credentials' },
  { id: 'grok',    label: 'Grok',    hint: 'console.x.ai',          placeholder: 'xai-...',    spendUrl: 'https://console.x.ai' },
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
  const { skin } = useSkin();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [roomName, setRoomName] = useState('');
  const [creatorName, setCreatorName] = useState('');
  const [ttlDays, setTtlDays] = useState(7);

  const [providers, setProviders] = useState(
    Object.fromEntries(PROVIDERS.map(p => [p.id, { key: '', model: DEFAULT_MODEL[p.id], expanded: false }]))
  );

  function setProviderField(id, field, value) {
    setProviders(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  }

  const hasAtLeastOneKey = Object.values(providers).some(p => p.key.trim());
  const avatars = AVATARS[skin.id] || AVATARS['light'];

  async function addInfoToBackend() {
    const use_localhost = false;
    const backend_address = use_localhost ? 'http://127.0.0.1:8001/visits' : 'https://gpteopardy-backend-service.onrender.com/visits';
    try {
      const response = await fetch(backend_address, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ site_id: 'borgmeeting' })
      });
      if (response.ok) return await response.json();
    } catch (e) { /* silent */ }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!roomName.trim() || !creatorName.trim() || !hasAtLeastOneKey) return;
    setLoading(true);
    setError('');
    try {
      // Derive which providers are enabled from which keys were entered.
      // Keys are stored client-side only — never sent to the server.
      const enabledProviders = Object.entries(providers)
        .filter(([_, p]) => p.key.trim())
        .map(([id]) => id);

      const res = await fetch(`${API}/api/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName: roomName.trim(),
          creatorName: creatorName.trim(),
          enabledProviders,
          ttlDays,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create meeting');

      // Generate the room encryption key client-side.
      // It never leaves the browser — it lives only in the URL fragment.
      const cryptoKey = await generateRoomKey();
      const keyB64 = await exportKeyToBase64(cryptoKey);

      // Store display name and keys in sessionStorage — API keys never leave the browser.
      sessionStorage.setItem(`name_${data.roomId}`, creatorName.trim());

      const keyStore = Object.fromEntries(
        Object.entries(providers)
          .filter(([_, p]) => p.key.trim())
          .map(([id, p]) => [id, { key: p.key.trim(), model: p.model }])
      );
      sessionStorage.setItem(`keys_${data.roomId}`, JSON.stringify(keyStore));

      // Navigate with the encryption key in the URL fragment.
      // Fragments are never sent to the server — the key stays client-side only.
      navigate(`/room/${data.roomId}#key=${keyB64}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { addInfoToBackend(); }, []);

  return (
    <div className="home">
      {/* Floating skin picker in top-right */}
      <div className="home-skin-picker">
        <SkinPicker />
      </div>

      <div className="home-card">
        {/* AI Avatar row */}
        <div className="home-avatars">
          {PROVIDERS.map(p => (
            <div
              key={p.id}
              className="home-avatar"
              dangerouslySetInnerHTML={{ __html: avatars[p.id] }}
              title={p.label}
            />
          ))}
        </div>

        <div className="home-logo">
          {skin.appName}
          {skin.appNameSpan && <span>{skin.appNameSpan}</span>}
        </div>
        <div className="home-tagline">{skin.tagline}</div>

        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label className="form-label">{skin.yourNameLabel}</label>
            <input className="form-input" placeholder={skin.yourNamePlaceholder}
              value={creatorName} onChange={e => setCreatorName(e.target.value)} autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">{skin.meetingNameLabel}</label>
            <input className="form-input" placeholder={skin.meetingNamePlaceholder}
              value={roomName} onChange={e => setRoomName(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Auto-delete after inactivity</label>
            <div className="form-hint" style={{ marginBottom: 8 }}>
              Room and all messages are permanently deleted after this period of inactivity.
            </div>
            <div className="model-select-list">
              {[
                { value: 1,  label: '24 hours',  sub: 'Quick sessions' },
                { value: 7,  label: '7 days',    sub: 'Default' },
                { value: 30, label: '30 days',   sub: 'Extended projects' },
              ].map(opt => (
                <button key={opt.value} type="button"
                  className={`model-select-row ${ttlDays === opt.value ? 'active' : ''}`}
                  onClick={() => setTtlDays(opt.value)}>
                  <div className={`model-select-check ${ttlDays === opt.value ? 'checked' : ''}`}>
                    {ttlDays === opt.value && (
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="white">
                        <path d="M10 3L5 8.5 2 5.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                      </svg>
                    )}
                  </div>
                  <span>{opt.label} <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>— {opt.sub}</span></span>
                </button>
              ))}
            </div>
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
                      {/* Mini avatar */}
                      <div
                        className="model-key-avatar"
                        dangerouslySetInnerHTML={{ __html: avatars[p.id] }}
                      />
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
                    <div className="form-hint" style={{ marginBottom: isEnabled ? 6 : 0 }}>{p.hint}</div>

                    {isEnabled && (
                      <div className="form-hint" style={{ marginBottom: 10, color: 'var(--text-secondary)' }}>
                        ⚠ Set a spend limit before sharing this room —{' '}
                        <a href={p.spendUrl} target="_blank" rel="noopener noreferrer"
                          style={{ color: 'var(--accent)' }}>
                          {p.hint} → billing
                        </a>
                        . Your key is stored in your browser only and never sent to our server.
                      </div>
                    )}

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
            {loading ? 'Creating…' : skin.startBtn}
          </button>
          {error && <div className="error-msg">{error}</div>}
        </form>
      </div>

      <div style={{
        marginTop: 24,
        display: 'flex',
        gap: 20,
        justifyContent: 'center',
        fontSize: 12,
        color: 'var(--text-tertiary)',
      }}>
        <Link to="/privacy" style={{ color: 'var(--text-tertiary)', textDecoration: 'none' }}>
          Privacy policy
        </Link>
        <a
          href="https://github.com/Digital-Physics/borgmeeting"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--text-tertiary)', textDecoration: 'none' }}
        >
          Open source
        </a>
      </div>
    </div>
  );
}