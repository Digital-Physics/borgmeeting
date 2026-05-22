import { useState, useEffect } from 'react';

const MAX_CONTEXT = 50;

export default function ContextPicker({ messages, modelLabel = 'AI', onConfirm, onCancel }) {
  const recentMessages = messages.slice(-MAX_CONTEXT);
  const [excluded, setExcluded] = useState(new Set());

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCancel]);

  function toggleMessage(id) {
    setExcluded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleConfirm() {
    const selected = recentMessages.filter(m => !excluded.has(m.id));
    onConfirm(selected);
  }

  const selectedCount = recentMessages.length - excluded.size;

  function truncate(text, max = 80) {
    return text.length > max ? text.slice(0, max) + '…' : text;
  }

  return (
    <div className="context-picker-overlay" onClick={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="context-picker">
        <div className="context-picker-header">
          <div className="context-picker-title">Choose {modelLabel}'s context</div>
          <div className="context-picker-subtitle">
            Uncheck messages you don't want {modelLabel} to see.{' '}
            {selectedCount} of {recentMessages.length} selected.
          </div>
          <div className="context-picker-actions">
            <button className="btn-sm" onClick={() => setExcluded(new Set())}>Select all</button>
            <button className="btn-sm" onClick={() => setExcluded(new Set(recentMessages.map(m => m.id)))}>Deselect all</button>
          </div>
        </div>

        <div className="context-messages">
          {recentMessages.length === 0 ? (
            <div style={{ padding: '20px', color: 'var(--text-tertiary)', fontSize: 13, textAlign: 'center' }}>
              No messages yet — {modelLabel} will only see your current message.
            </div>
          ) : (
            recentMessages.map(msg => {
              const isIncluded = !excluded.has(msg.id);
              return (
                <div
                  key={msg.id}
                  className={`context-msg-row ${isIncluded ? '' : 'excluded'}`}
                  onClick={() => toggleMessage(msg.id)}
                >
                  <div className={`context-checkbox ${isIncluded ? 'checked' : ''}`}>
                    {isIncluded && (
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="white">
                        <path d="M10 3L5 8.5 2 5.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                      </svg>
                    )}
                  </div>
                  <div className="context-msg-content">
                    <div className="context-msg-sender">
                      {msg.sender_name}
                    </div>
                    <div className="context-msg-text">
                      {truncate(msg.content)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="context-picker-footer">
          <button className="btn-cancel" onClick={onCancel}>Cancel</button>
          <button className="btn-ask-claude" onClick={handleConfirm}>
            Ask {modelLabel} →
          </button>
        </div>
      </div>
    </div>
  );
}