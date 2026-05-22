import { useNavigate } from 'react-router-dom';
import { useSkin } from './SkinContext.jsx';

const LAST_UPDATED = 'May 22, 2026';
const CONTACT_EMAIL = 'hello@borgmeeting.com'; // TODO: replace with real address
const GITHUB_URL = 'https://github.com/Digital-Physics/borgmeeting'; // update when renamed

export default function PrivacyPolicy() {
  const navigate = useNavigate();
  const { skin } = useSkin();

  return (
    <div className="home">
      <div className="home-card" style={{ maxWidth: 640, textAlign: 'left' }}>

        <button
          onClick={() => navigate('/')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-tertiary)', fontSize: 13, padding: 0,
            marginBottom: 24, display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          ← Back
        </button>

        <div className="home-logo" style={{ fontSize: 20, marginBottom: 4 }}>
          Privacy Policy
        </div>
        <div className="form-hint" style={{ marginBottom: 32 }}>
          Last updated {LAST_UPDATED}
        </div>

        <Section title="The short version">
          <p>
            BorgMeeting does not track you, sell your data, or read your messages.
            Your messages are end-to-end encrypted before they leave your browser.
            We cannot read them. Nobody can read them without the room link.
          </p>
        </Section>

        <Section title="What we store">
          <ul>
            <li>
              <strong>Room metadata</strong> - room name, creator name, creation date,
              enabled AI providers, and auto-delete setting. This is unencrypted
              because it has to be - it's needed to display the room to participants.
            </li>
            <li>
              <strong>Messages</strong> - stored as AES-GCM 256-bit encrypted ciphertext.
              The decryption key lives only in your room link (the <code>#key=</code> fragment).
              It is never sent to our server. We store noise.
            </li>
            <li>
              <strong>Nothing else.</strong> No accounts. No cookies. No session tokens.
              No IP logs. No analytics.
            </li>
          </ul>
        </Section>

        <Section title="What we don't store">
          <ul>
            <li>
              <strong>Your API keys</strong> - they live in your browser's sessionStorage
              and are sent directly from your browser to the AI provider (Anthropic, OpenAI,
              Google, xAI). They never touch our server.
            </li>
            <li>
              <strong>Your message content</strong> - we store ciphertext. Without the
              room link, it is mathematically unreadable.
            </li>
          </ul>
        </Section>

        <Section title="Auto-deletion">
          <p>
            Rooms and all their messages are permanently and automatically deleted after
            the inactivity period you chose when creating the room (24 hours, 7 days,
            or 30 days). There is no backup. Deletion is final.
          </p>
        </Section>

        <Section title="Visit counter">
          <p>
            When you load the home page, we send a single anonymous ping to a self-hosted
            counter (no third-party analytics service) that increments a visit count for
            borgmeeting.com. No IP address, browser fingerprint, or any other identifying
            information is recorded. This is our only telemetry.
          </p>
        </Section>

        <Section title="Third-party AI providers">
          <p>
            When you @mention an AI in a room, your browser sends the conversation context
            and your API key directly to that provider's API (Anthropic, OpenAI, Google, or
            xAI). Those requests are subject to each provider's own privacy policy and terms.
            We proxy the request through our worker to avoid exposing the provider API endpoint
            directly, but the content of the request is your message context - we do not log it.
          </p>
        </Section>

        <Section title="Open source">
          <p>
            The frontend is open source. You can read exactly what the app does with your
            keys and messages.{' '}
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer"
              style={{ color: 'var(--accent)' }}>
              Read the code on GitHub →
            </a>
          </p>
        </Section>

        <Section title="Changes">
          <p>
            If we make material changes to this policy, we'll update the date above.
            Since there are no accounts, we have no way to notify you directly - check
            back if it matters to you.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions?{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: 'var(--accent)' }}>
              {CONTACT_EMAIL}
            </a>
          </p>
        </Section>

      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--accent)',
        marginBottom: 8,
      }}>
        {title}
      </div>
      <div style={{
        fontSize: 14,
        lineHeight: 1.7,
        color: 'var(--text-secondary)',
      }}>
        {children}
      </div>
    </div>
  );
}