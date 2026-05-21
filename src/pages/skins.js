// ─────────────────────────────────────────────────────────────────────────────
// skins.js — All skin definitions for BorgMeeting
// Each skin: id, label, emoji, tagline, appName, copy overrides, CSS vars,
//            font imports, and per-AI SVG avatar strings.
// ─────────────────────────────────────────────────────────────────────────────

export const SKINS = [
  // ── 1. BORG MEETING (default dark tech) ──────────────────────────────────
  {
    id: 'borg',
    label: 'Borg Meeting',
    emoji: '🖖',
    appName: 'BorgMeeting',
    appNameSpan: '',
    tagline: 'Resistance is futile. Collaboration is inevitable.',
    yourNameLabel: 'Your designation',
    yourNamePlaceholder: 'How the collective sees you',
    meetingNameLabel: 'Collective session',
    meetingNamePlaceholder: 'e.g. Assimilation strategy',
    startBtn: 'Initialize session →',
    joinBtn: 'Join collective →',
    joiningLabel: "You're being assimilated into",
    fonts: `@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Inter:wght@300;400;500&display=swap');`,
    vars: {
      '--bg': '#0a0e0a',
      '--surface': '#0f150f',
      '--surface-2': '#141c14',
      '--border': '#1e2e1e',
      '--text-primary': '#7fff7f',
      '--text-secondary': '#4aaa4a',
      '--text-tertiary': '#2a6a2a',
      '--accent': '#00ff41',
      '--accent-fg': '#000',
      '--bubble-me': '#00ff41',
      '--bubble-me-text': '#000',
      '--bubble-them': '#0f1f0f',
      '--bubble-them-text': '#7fff7f',
      '--bubble-claude': '#0a1a0a',
      '--bubble-claude-text': '#00cc33',
      '--bubble-claude-border': '#1a3a1a',
      '--font': '"Inter", sans-serif',
      '--font-mono': '"Share Tech Mono", monospace',
      '--radius-sm': '2px',
      '--radius-md': '4px',
      '--radius-lg': '6px',
      '--radius-full': '2px',
    },
  },

  // ── 2. COUPLES THERAPY ────────────────────────────────────────────────────
  {
    id: 'therapy',
    label: 'Couples Therapy',
    emoji: '💑',
    appName: 'Safe',
    appNameSpan: 'Space',
    tagline: 'A gentle place to work things through.',
    yourNameLabel: 'Your name',
    yourNamePlaceholder: 'How your partner sees you',
    meetingNameLabel: 'Session topic',
    meetingNamePlaceholder: 'e.g. Communication & trust',
    startBtn: 'Begin session →',
    joinBtn: 'Enter session →',
    joiningLabel: "You're joining the session",
    fonts: `@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;1,400&family=Nunito:wght@300;400;500;600&display=swap');`,
    vars: {
      '--bg': '#fdf8f4',
      '--surface': '#fffcfa',
      '--surface-2': '#f9f3ee',
      '--border': '#ecddd4',
      '--text-primary': '#3d2b1f',
      '--text-secondary': '#8b6a5a',
      '--text-tertiary': '#c4a090',
      '--accent': '#c27b5a',
      '--accent-fg': '#fff',
      '--bubble-me': '#c27b5a',
      '--bubble-me-text': '#fff',
      '--bubble-them': '#fffcfa',
      '--bubble-them-text': '#3d2b1f',
      '--bubble-claude': '#f3ede8',
      '--bubble-claude-text': '#5a3d2b',
      '--bubble-claude-border': '#ddd0c5',
      '--font': '"Nunito", sans-serif',
      '--font-mono': '"Nunito", sans-serif',
      '--radius-sm': '12px',
      '--radius-md': '18px',
      '--radius-lg': '24px',
      '--radius-full': '999px',
    },
  },

  // ── 3. PROJECT LAUNCH ─────────────────────────────────────────────────────
  {
    id: 'launch',
    label: 'Project Launch',
    emoji: '🚀',
    appName: 'Launch',
    appNameSpan: 'Pad',
    tagline: 'Ship it. Track it. Celebrate it.',
    yourNameLabel: 'Your handle',
    yourNamePlaceholder: 'e.g. @maya or Product Lead',
    meetingNameLabel: 'Project name',
    meetingNamePlaceholder: 'e.g. v2.0 Launch Blitz',
    startBtn: 'Start launch sequence →',
    joinBtn: 'Join mission →',
    joiningLabel: "You're joining project",
    fonts: `@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap');`,
    vars: {
      '--bg': '#f0f2ff',
      '--surface': '#ffffff',
      '--surface-2': '#eceeff',
      '--border': '#d6d9ff',
      '--text-primary': '#1a1b3a',
      '--text-secondary': '#5a5c8a',
      '--text-tertiary': '#9a9cb8',
      '--accent': '#4f46e5',
      '--accent-fg': '#ffffff',
      '--bubble-me': '#4f46e5',
      '--bubble-me-text': '#ffffff',
      '--bubble-them': '#ffffff',
      '--bubble-them-text': '#1a1b3a',
      '--bubble-claude': '#eceeff',
      '--bubble-claude-text': '#3730a3',
      '--bubble-claude-border': '#c7d2fe',
      '--font': '"Space Grotesk", sans-serif',
      '--font-mono': '"Space Mono", monospace',
      '--radius-sm': '6px',
      '--radius-md': '12px',
      '--radius-lg': '16px',
      '--radius-full': '999px',
    },
  },

  // ── 4. VACATION PLANNER ───────────────────────────────────────────────────
  {
    id: 'vacation',
    label: 'Vacation Planner',
    emoji: '🌴',
    appName: 'Wander',
    appNameSpan: 'Room',
    tagline: "Sun, sand, and someone who's actually been there.",
    yourNameLabel: 'Traveler name',
    yourNamePlaceholder: 'Who\'s going on this trip?',
    meetingNameLabel: 'Trip name',
    meetingNamePlaceholder: 'e.g. Amalfi Coast 2026 ✈️',
    startBtn: 'Start planning →',
    joinBtn: 'Join the trip →',
    joiningLabel: "You're joining the trip",
    fonts: `@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&display=swap');`,
    vars: {
      '--bg': '#fff9f0',
      '--surface': '#ffffff',
      '--surface-2': '#fff3e0',
      '--border': '#fddba8',
      '--text-primary': '#1a120a',
      '--text-secondary': '#8a6040',
      '--text-tertiary': '#c8a878',
      '--accent': '#f59e0b',
      '--accent-fg': '#1a120a',
      '--bubble-me': '#f59e0b',
      '--bubble-me-text': '#1a120a',
      '--bubble-them': '#ffffff',
      '--bubble-them-text': '#1a120a',
      '--bubble-claude': '#fff3e0',
      '--bubble-claude-text': '#7c4a08',
      '--bubble-claude-border': '#fcd87a',
      '--font': '"DM Sans", sans-serif',
      '--font-mono': '"Syne", sans-serif',
      '--radius-sm': '8px',
      '--radius-md': '16px',
      '--radius-lg': '22px',
      '--radius-full': '999px',
    },
  },

  // ── 5. LIGHT (clean default) ───────────────────────────────────────────────
  {
    id: 'light',
    label: 'Light',
    emoji: '☀️',
    appName: 'Borg',
    appNameSpan: 'Meeting',
    tagline: 'Where humans and AI meet.',
    yourNameLabel: 'Your name',
    yourNamePlaceholder: 'How others will see you',
    meetingNameLabel: 'Meeting name',
    meetingNamePlaceholder: 'e.g. Strategy brainstorm',
    startBtn: 'Start meeting →',
    joinBtn: 'Join meeting →',
    joiningLabel: "You're joining",
    fonts: `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&family=DM+Mono:wght@400;500&display=swap');`,
    vars: {
      '--bg': '#f5f5f0',
      '--surface': '#ffffff',
      '--surface-2': '#f0efea',
      '--border': '#e8e7e2',
      '--text-primary': '#1a1a18',
      '--text-secondary': '#7a7a72',
      '--text-tertiary': '#b0afa8',
      '--accent': '#1a1a18',
      '--accent-fg': '#f5f5f0',
      '--bubble-me': '#1a1a18',
      '--bubble-me-text': '#f5f5f0',
      '--bubble-them': '#ffffff',
      '--bubble-them-text': '#1a1a18',
      '--bubble-claude': '#f0efea',
      '--bubble-claude-text': '#1a1a18',
      '--bubble-claude-border': '#e0dfd8',
      '--font': '"DM Sans", sans-serif',
      '--font-mono': '"DM Mono", monospace',
      '--radius-sm': '6px',
      '--radius-md': '14px',
      '--radius-lg': '20px',
      '--radius-full': '999px',
    },
  },

  // ── 6. DARK ────────────────────────────────────────────────────────────────
  {
    id: 'dark',
    label: 'Dark',
    emoji: '🌙',
    appName: 'Borg',
    appNameSpan: 'Meeting',
    tagline: 'Where humans and AI meet.',
    yourNameLabel: 'Your name',
    yourNamePlaceholder: 'How others will see you',
    meetingNameLabel: 'Meeting name',
    meetingNamePlaceholder: 'e.g. Strategy brainstorm',
    startBtn: 'Start meeting →',
    joinBtn: 'Join meeting →',
    joiningLabel: "You're joining",
    fonts: `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&family=DM+Mono:wght@400;500&display=swap');`,
    vars: {
      '--bg': '#0e0e10',
      '--surface': '#18181c',
      '--surface-2': '#1e1e24',
      '--border': '#2a2a34',
      '--text-primary': '#f0f0f4',
      '--text-secondary': '#8888a0',
      '--text-tertiary': '#505060',
      '--accent': '#a78bfa',
      '--accent-fg': '#0e0e10',
      '--bubble-me': '#a78bfa',
      '--bubble-me-text': '#0e0e10',
      '--bubble-them': '#18181c',
      '--bubble-them-text': '#f0f0f4',
      '--bubble-claude': '#1e1e24',
      '--bubble-claude-text': '#c4b5fd',
      '--bubble-claude-border': '#2a2a3a',
      '--font': '"DM Sans", sans-serif',
      '--font-mono': '"DM Mono", monospace',
      '--radius-sm': '6px',
      '--radius-md': '14px',
      '--radius-lg': '20px',
      '--radius-full': '999px',
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SVG Avatars — one set per skin, for each of the 4 AI providers
// ─────────────────────────────────────────────────────────────────────────────

export const AVATARS = {
  borg: {
    claude: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" fill="#0a1a0a"/>
      <rect x="8" y="10" width="24" height="20" rx="1" fill="none" stroke="#00ff41" stroke-width="1.5"/>
      <rect x="12" y="14" width="7" height="5" rx="0.5" fill="#00ff41" opacity="0.8"/>
      <rect x="21" y="14" width="7" height="5" rx="0.5" fill="#00ff41" opacity="0.8"/>
      <line x1="8" y1="22" x2="32" y2="22" stroke="#00ff41" stroke-width="0.75" opacity="0.4"/>
      <rect x="14" y="24" width="12" height="2" rx="0.5" fill="#00ff41" opacity="0.5"/>
      <line x1="20" y1="10" x2="20" y2="6" stroke="#00ff41" stroke-width="1.5"/>
      <circle cx="20" cy="5" r="1.5" fill="#00ff41"/>
    </svg>`,
    chatgpt: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" fill="#0a1a0a"/>
      <polygon points="20,8 32,14 32,26 20,32 8,26 8,14" fill="none" stroke="#00cc33" stroke-width="1.5"/>
      <polygon points="20,12 28,16 28,24 20,28 12,24 12,16" fill="none" stroke="#00ff41" stroke-width="0.75" opacity="0.5"/>
      <circle cx="20" cy="20" r="3" fill="#00ff41" opacity="0.9"/>
      <line x1="20" y1="17" x2="20" y2="8" stroke="#00ff41" stroke-width="0.75" opacity="0.6"/>
      <line x1="22.6" y1="18.5" x2="28" y2="14" stroke="#00ff41" stroke-width="0.75" opacity="0.6"/>
      <line x1="22.6" y1="21.5" x2="28" y2="26" stroke="#00ff41" stroke-width="0.75" opacity="0.6"/>
    </svg>`,
    gemini: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" fill="#0a1a0a"/>
      <path d="M20 8 L20 32" stroke="#00ff41" stroke-width="1.5"/>
      <path d="M8 20 L32 20" stroke="#00ff41" stroke-width="1.5"/>
      <path d="M20 8 Q32 20 20 32 Q8 20 20 8Z" fill="none" stroke="#00cc33" stroke-width="1" opacity="0.7"/>
      <circle cx="20" cy="8" r="2" fill="#00ff41"/>
      <circle cx="20" cy="32" r="2" fill="#00ff41"/>
      <circle cx="8" cy="20" r="2" fill="#00ff41"/>
      <circle cx="32" cy="20" r="2" fill="#00ff41"/>
    </svg>`,
    grok: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" fill="#0a1a0a"/>
      <path d="M10 10 L30 10 L30 14 L14 14 L14 19 L26 19 L26 23 L14 23 L14 30 L10 30 Z" fill="#00ff41" opacity="0.9"/>
      <rect x="26" y="23" width="4" height="7" fill="#00ff41" opacity="0.6"/>
      <rect x="10" y="10" width="20" height="1" fill="#00ff41"/>
    </svg>`,
  },

  therapy: {
    claude: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#f9ede6"/>
      <circle cx="20" cy="16" r="7" fill="#e8c4b0"/>
      <path d="M7 36 Q7 26 20 26 Q33 26 33 36" fill="#d4a088"/>
      <circle cx="17" cy="15" r="1.2" fill="#7a4a35"/>
      <circle cx="23" cy="15" r="1.2" fill="#7a4a35"/>
      <path d="M16 19.5 Q20 22 24 19.5" stroke="#c27b5a" stroke-width="1.2" fill="none" stroke-linecap="round"/>
    </svg>`,
    chatgpt: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#e8f0e8"/>
      <circle cx="20" cy="16" r="7" fill="#b8d4b8"/>
      <path d="M7 36 Q7 26 20 26 Q33 26 33 36" fill="#8ab88a"/>
      <circle cx="17" cy="15" r="1.2" fill="#2d5a2d"/>
      <circle cx="23" cy="15" r="1.2" fill="#2d5a2d"/>
      <path d="M16 19.5 Q20 22 24 19.5" stroke="#4a8a4a" stroke-width="1.2" fill="none" stroke-linecap="round"/>
    </svg>`,
    gemini: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#f0e8f4"/>
      <circle cx="20" cy="16" r="7" fill="#d4b8e0"/>
      <path d="M7 36 Q7 26 20 26 Q33 26 33 36" fill="#b890cc"/>
      <circle cx="17" cy="15" r="1.2" fill="#5a2d7a"/>
      <circle cx="23" cy="15" r="1.2" fill="#5a2d7a"/>
      <path d="M16 19.5 Q20 22 24 19.5" stroke="#8a4aaa" stroke-width="1.2" fill="none" stroke-linecap="round"/>
    </svg>`,
    grok: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#fef0e8"/>
      <circle cx="20" cy="16" r="7" fill="#fad0b0"/>
      <path d="M7 36 Q7 26 20 26 Q33 26 33 36" fill="#f4a878"/>
      <circle cx="17" cy="15" r="1.2" fill="#7a3a1a"/>
      <circle cx="23" cy="15" r="1.2" fill="#7a3a1a"/>
      <path d="M16 19.5 Q20 22 24 19.5" stroke="#c86a30" stroke-width="1.2" fill="none" stroke-linecap="round"/>
    </svg>`,
  },

  launch: {
    claude: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#4f46e5"/>
      <path d="M20 8 L24 18 L35 18 L26 24 L29 35 L20 29 L11 35 L14 24 L5 18 L16 18 Z" fill="white" opacity="0.9"/>
    </svg>`,
    chatgpt: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#7c3aed"/>
      <circle cx="20" cy="20" r="9" fill="none" stroke="white" stroke-width="2"/>
      <circle cx="20" cy="20" r="4" fill="white" opacity="0.9"/>
      <line x1="20" y1="8" x2="20" y2="11" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="20" y1="29" x2="20" y2="32" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="8" y1="20" x2="11" y2="20" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="29" y1="20" x2="32" y2="20" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`,
    gemini: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#6d28d9"/>
      <path d="M20 9 L22.5 17.5 L31 20 L22.5 22.5 L20 31 L17.5 22.5 L9 20 L17.5 17.5 Z" fill="white" opacity="0.95"/>
    </svg>`,
    grok: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#5b21b6"/>
      <path d="M12 11 L28 11 L28 15.5 L16.5 15.5 L16.5 19 L26 19 L26 23 L16.5 23 L16.5 29 L12 29 Z" fill="white" opacity="0.9"/>
      <rect x="26" y="23" width="4.5" height="6" rx="1" fill="white" opacity="0.6"/>
    </svg>`,
  },

  vacation: {
    claude: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#fde68a"/>
      <circle cx="20" cy="20" r="12" fill="#fbbf24"/>
      <circle cx="16" cy="17" r="1.5" fill="#78350f"/>
      <circle cx="24" cy="17" r="1.5" fill="#78350f"/>
      <path d="M15 23 Q20 27 25 23" stroke="#78350f" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <path d="M8 14 Q14 10 20 14" stroke="#fbbf24" stroke-width="3" fill="none" opacity="0.5"/>
      <path d="M5 22 Q8 20 11 22" stroke="#60a5fa" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M29 22 Q32 20 35 22" stroke="#60a5fa" stroke-width="2" fill="none" stroke-linecap="round"/>
    </svg>`,
    chatgpt: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#bfdbfe"/>
      <circle cx="20" cy="16" r="8" fill="#60a5fa"/>
      <path d="M6 36 Q6 25 20 25 Q34 25 34 36" fill="#3b82f6"/>
      <circle cx="17" cy="15" r="1.3" fill="#1e3a5f"/>
      <circle cx="23" cy="15" r="1.3" fill="#1e3a5f"/>
      <path d="M16 20 Q20 23 24 20" stroke="#1e3a5f" stroke-width="1.3" fill="none" stroke-linecap="round"/>
      <path d="M14 10 Q16 7 20 8 Q24 7 26 10" stroke="#93c5fd" stroke-width="2" fill="none" stroke-linecap="round"/>
    </svg>`,
    gemini: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#d1fae5"/>
      <path d="M10 30 Q12 22 20 20 Q28 22 30 30" fill="#34d399"/>
      <rect x="18" y="12" width="4" height="16" rx="2" fill="#6ee7b7"/>
      <path d="M10 18 Q12 14 16 15 Q18 10 22 12 Q26 8 28 12 Q32 11 32 16" fill="#a7f3d0"/>
      <circle cx="15" cy="27" r="2" fill="#059669" opacity="0.6"/>
      <circle cx="25" cy="26" r="1.5" fill="#059669" opacity="0.6"/>
    </svg>`,
    grok: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#fed7aa"/>
      <path d="M8 28 Q14 16 20 14 Q26 16 32 28" fill="#fb923c"/>
      <circle cx="20" cy="14" r="5" fill="#fdba74"/>
      <circle cx="18" cy="13" r="1" fill="#7c2d12"/>
      <circle cx="22" cy="13" r="1" fill="#7c2d12"/>
      <path d="M17 16 Q20 18.5 23 16" stroke="#c2410c" stroke-width="1.2" fill="none" stroke-linecap="round"/>
      <path d="M8 30 Q20 26 32 30" stroke="#ea580c" stroke-width="2" fill="none" stroke-linecap="round"/>
    </svg>`,
  },

  light: {
    claude: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#f0efea"/>
      <circle cx="20" cy="16" r="7.5" fill="#d4d3cc"/>
      <path d="M7 36 Q7 26 20 26 Q33 26 33 36" fill="#c0bfb8"/>
      <circle cx="17" cy="15" r="1.2" fill="#4a4a44"/>
      <circle cx="23" cy="15" r="1.2" fill="#4a4a44"/>
      <path d="M16 19.5 Q20 22 24 19.5" stroke="#7a7a72" stroke-width="1.2" fill="none" stroke-linecap="round"/>
    </svg>`,
    chatgpt: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#e8f4e8"/>
      <circle cx="20" cy="16" r="7.5" fill="#b8d8b8"/>
      <path d="M7 36 Q7 26 20 26 Q33 26 33 36" fill="#98c098"/>
      <circle cx="17" cy="15" r="1.2" fill="#1a4a1a"/>
      <circle cx="23" cy="15" r="1.2" fill="#1a4a1a"/>
      <path d="M16 19.5 Q20 22 24 19.5" stroke="#3a7a3a" stroke-width="1.2" fill="none" stroke-linecap="round"/>
    </svg>`,
    gemini: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#e8e8f8"/>
      <circle cx="20" cy="16" r="7.5" fill="#c0b8e8"/>
      <path d="M7 36 Q7 26 20 26 Q33 26 33 36" fill="#a098d8"/>
      <circle cx="17" cy="15" r="1.2" fill="#2a1a5a"/>
      <circle cx="23" cy="15" r="1.2" fill="#2a1a5a"/>
      <path d="M16 19.5 Q20 22 24 19.5" stroke="#4a3a9a" stroke-width="1.2" fill="none" stroke-linecap="round"/>
    </svg>`,
    grok: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#f4f0e8"/>
      <circle cx="20" cy="16" r="7.5" fill="#d8c8a8"/>
      <path d="M7 36 Q7 26 20 26 Q33 26 33 36" fill="#c0a888"/>
      <circle cx="17" cy="15" r="1.2" fill="#4a3a1a"/>
      <circle cx="23" cy="15" r="1.2" fill="#4a3a1a"/>
      <path d="M16 19.5 Q20 22 24 19.5" stroke="#7a6a3a" stroke-width="1.2" fill="none" stroke-linecap="round"/>
    </svg>`,
  },

  dark: {
    claude: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#1e1e24"/>
      <circle cx="20" cy="16" r="7.5" fill="#2e2e38"/>
      <path d="M7 36 Q7 26 20 26 Q33 26 33 36" fill="#252530"/>
      <circle cx="17" cy="15" r="1.2" fill="#c4b5fd"/>
      <circle cx="23" cy="15" r="1.2" fill="#c4b5fd"/>
      <path d="M16 19.5 Q20 22 24 19.5" stroke="#a78bfa" stroke-width="1.2" fill="none" stroke-linecap="round"/>
    </svg>`,
    chatgpt: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#1e2424"/>
      <circle cx="20" cy="16" r="7.5" fill="#2e3e38"/>
      <path d="M7 36 Q7 26 20 26 Q33 26 33 36" fill="#253530"/>
      <circle cx="17" cy="15" r="1.2" fill="#6ee7b7"/>
      <circle cx="23" cy="15" r="1.2" fill="#6ee7b7"/>
      <path d="M16 19.5 Q20 22 24 19.5" stroke="#34d399" stroke-width="1.2" fill="none" stroke-linecap="round"/>
    </svg>`,
    gemini: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#1e1e2e"/>
      <circle cx="20" cy="16" r="7.5" fill="#2e2848"/>
      <path d="M7 36 Q7 26 20 26 Q33 26 33 36" fill="#25203e"/>
      <circle cx="17" cy="15" r="1.2" fill="#93c5fd"/>
      <circle cx="23" cy="15" r="1.2" fill="#93c5fd"/>
      <path d="M16 19.5 Q20 22 24 19.5" stroke="#60a5fa" stroke-width="1.2" fill="none" stroke-linecap="round"/>
    </svg>`,
    grok: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#221e1e"/>
      <circle cx="20" cy="16" r="7.5" fill="#382e2e"/>
      <path d="M7 36 Q7 26 20 26 Q33 26 33 36" fill="#2e2525"/>
      <circle cx="17" cy="15" r="1.2" fill="#fca5a5"/>
      <circle cx="23" cy="15" r="1.2" fill="#fca5a5"/>
      <path d="M16 19.5 Q20 22 24 19.5" stroke="#f87171" stroke-width="1.2" fill="none" stroke-linecap="round"/>
    </svg>`,
  },
};

export const DEFAULT_SKIN_ID = 'light';

export function getSkin(id) {
  return SKINS.find(s => s.id === id) || SKINS.find(s => s.id === DEFAULT_SKIN_ID);
}
