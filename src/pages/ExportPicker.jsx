import { useState, useEffect } from 'react';

const MAX_CONTEXT = 200; // export can include more than AI context

export default function ExportPicker({ messages, roomName, skin, onExport, onCancel }) {
  const exportableMessages = messages.slice(-MAX_CONTEXT);
  const [excluded, setExcluded] = useState(new Set());
  const [exporting, setExporting] = useState(null); // 'json' | 'markdown' | 'pdf'

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

  async function handleExport(format) {
    setExporting(format);
    const selected = exportableMessages.filter(m => !excluded.has(m.id));
    await onExport(format, selected);
    setExporting(null);
    onCancel();
  }

  const selectedCount = exportableMessages.length - excluded.size;

  function truncate(text, max = 80) {
    return text.length > max ? text.slice(0, max) + '…' : text;
  }

  return (
    <div className="context-picker-overlay" onClick={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="context-picker">

        <div className="context-picker-header">
          <div className="export-picker-title-row">
            {/* Download icon */}
            <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" style={{ flexShrink: 0, opacity: 0.7 }}>
              <path d="M8 1a.5.5 0 01.5.5v7.793l2.146-2.147a.5.5 0 01.708.708l-3 3a.5.5 0 01-.708 0l-3-3a.5.5 0 01.708-.708L7.5 9.293V1.5A.5.5 0 018 1zM2 13.5a.5.5 0 01.5-.5h11a.5.5 0 010 1h-11a.5.5 0 01-.5-.5z"/>
            </svg>
            <div className="context-picker-title">Export transcript</div>
          </div>
          <div className="context-picker-subtitle">
            Choose which messages to include, then pick a format.{' '}
            <strong>{selectedCount}</strong> of {exportableMessages.length} selected.
          </div>
          <div className="context-picker-actions">
            <button className="btn-sm" onClick={() => setExcluded(new Set())}>Select all</button>
            <button className="btn-sm" onClick={() => setExcluded(new Set(exportableMessages.map(m => m.id)))}>Deselect all</button>
          </div>
        </div>

        <div className="context-messages">
          {exportableMessages.length === 0 ? (
            <div style={{ padding: '20px', color: 'var(--text-tertiary)', fontSize: 13, textAlign: 'center' }}>
              No messages to export yet.
            </div>
          ) : (
            exportableMessages.map(msg => {
              const isIncluded = !excluded.has(msg.id);
              const time = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
                    <div className="context-msg-sender" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {msg.is_claude
                        ? <><span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', background: 'var(--accent)', color: 'var(--accent-fg)', padding: '1px 5px', borderRadius: 3, letterSpacing: '0.05em' }}>AI</span> {msg.sender_name}</>
                        : msg.sender_name
                      }
                      <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 400 }}>{time}</span>
                    </div>
                    <div className="context-msg-text">{truncate(msg.content)}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Format buttons footer */}
        <div className="context-picker-footer export-footer">
          <button className="btn-cancel" onClick={onCancel}>Cancel</button>

          <div className="export-format-btns">
            <button
              className="btn-export-format"
              onClick={() => handleExport('markdown')}
              disabled={selectedCount === 0 || !!exporting}
              title="Markdown — great for Notion, Obsidian, or any text editor"
            >
              {exporting === 'markdown'
                ? <span className="export-spinner" />
                : <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M14 3a1 1 0 011 1v8a1 1 0 01-1 1H2a1 1 0 01-1-1V4a1 1 0 011-1h12zM2 2a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H2zm.5 5.5a.5.5 0 000 1h4a.5.5 0 000-1h-4zm0-2a.5.5 0 000 1h11a.5.5 0 000-1h-11zm0 4a.5.5 0 000 1h6a.5.5 0 000-1h-6z"/></svg>
              }
              Markdown
            </button>

            <button
              className="btn-export-format"
              onClick={() => handleExport('json')}
              disabled={selectedCount === 0 || !!exporting}
              title="JSON — structured data, good for developers or re-importing later"
            >
              {exporting === 'json'
                ? <span className="export-spinner" />
                : <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M2 2a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H2zm3.5 4a.5.5 0 000 1H9a.5.5 0 000-1H5.5zm-1 2.5a.5.5 0 01.5-.5h5a.5.5 0 010 1h-5a.5.5 0 01-.5-.5zm1 2.5a.5.5 0 000 1h3a.5.5 0 000-1h-3z"/></svg>
              }
              JSON
            </button>

            <button
              className="btn-export-format btn-export-pdf"
              onClick={() => handleExport('pdf')}
              disabled={selectedCount === 0 || !!exporting}
              title="PDF — ready to print or share"
            >
              {exporting === 'pdf'
                ? <span className="export-spinner" />
                : <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M14 14V4.5L9.5 0H4a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2zM9.5 3A1.5 1.5 0 0011 4.5h2V14a1 1 0 01-1 1H4a1 1 0 01-1-1V2a1 1 0 011-1h5.5v2z"/><path d="M4.603 14.087a.81.81 0 01-.438-.42c-.195-.388-.13-.776.08-1.102.198-.307.526-.568.897-.787a7.68 7.68 0 011.482-.645 19.697 19.697 0 001.062-2.227 7.269 7.269 0 01-.43-1.295c-.086-.4-.119-.796-.046-1.136.075-.354.274-.672.65-.823.192-.077.4-.12.602-.077a.7.7 0 01.477.365c.088.164.12.356.127.538.007.188-.012.396-.047.614-.084.51-.27 1.134-.52 1.794a10.954 10.954 0 00.98 1.686 5.753 5.753 0 011.334.05c.364.066.734.195.96.465.12.144.193.32.2.518.007.192-.047.382-.138.563a1.04 1.04 0 01-.354.416.856.856 0 01-.51.138c-.331-.014-.654-.196-.933-.417a5.712 5.712 0 01-.911-1.01 12.773 12.773 0 01-1.269.485 11.33 11.33 0 01-1.197.332A5.048 5.048 0 014.603 14.087z"/></svg>
              }
              PDF
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
