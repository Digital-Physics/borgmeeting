import { useState } from 'react';
import { useSkin } from './SkinContext.jsx';

export default function SkinPicker() {
  const { skin, skinId, changeSkin, skins } = useSkin();
  const [open, setOpen] = useState(false);

  return (
    <div className="skin-picker-wrap">
      <button
        className="skin-picker-toggle"
        onClick={() => setOpen(o => !o)}
        title="Change theme"
        aria-label="Change theme"
      >
        <span className="skin-picker-emoji">{skin.emoji}</span>
        <svg
          width="10" height="10" viewBox="0 0 10 10" fill="currentColor"
          style={{ opacity: 0.5, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
        >
          <path d="M1 3 L5 7 L9 3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <>
          <div className="skin-picker-backdrop" onClick={() => setOpen(false)} />
          <div className="skin-picker-menu">
            <div className="skin-picker-title">Theme</div>
            {skins.map(s => (
              <button
                key={s.id}
                className={`skin-picker-item ${s.id === skinId ? 'active' : ''}`}
                onClick={() => { changeSkin(s.id); setOpen(false); }}
              >
                <span className="skin-item-emoji">{s.emoji}</span>
                <span className="skin-item-label">{s.label}</span>
                {s.id === skinId && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" style={{ marginLeft: 'auto', flexShrink: 0 }}>
                    <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
