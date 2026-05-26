import { useEffect, useMemo, useState } from 'react';

type TerminalEntry = {
  kind: 'command' | 'response';
  text: string;
  tone?: 'soft' | 'bright' | 'cyan';
};

const heroWords = ['plan', 'launch', 'debug', 'ship'];

const terminalScript: TerminalEntry[] = [
  { kind: 'command', text: 'npm install -g planora' },
  { kind: 'response', text: '+ planora installed', tone: 'soft' },
  { kind: 'command', text: 'planora config' },
  { kind: 'response', text: 'provider: openrouter', tone: 'cyan' },
  { kind: 'response', text: 'model: anthropic/claude-sonnet-4', tone: 'soft' },
  { kind: 'response', text: 'status: connected', tone: 'bright' },
  { kind: 'command', text: 'planora init --name "my-app" --stack "react,node,postgres"' },
  { kind: 'response', text: 'scaffold created in .planora/', tone: 'bright' },
  { kind: 'command', text: 'planora plan --ai' },
  { kind: 'response', text: 'PROJECT_PLAN.md generated', tone: 'bright' },
  { kind: 'response', text: 'ROADMAP.md generated', tone: 'bright' },
  { kind: 'response', text: 'MINDMAP.md generated', tone: 'bright' },
  { kind: 'response', text: 'ARCHITECTURE.md generated', tone: 'bright' },
  { kind: 'command', text: 'planora web' },
  { kind: 'response', text: 'dashboard running at http://localhost:4173', tone: 'cyan' },
];

function useWordCycle(words: string[], delayMs: number): string {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const handle = window.setInterval(() => {
      setIndex((current) => (current + 1) % words.length);
    }, delayMs);

    return () => window.clearInterval(handle);
  }, [delayMs, words.length]);

  return words[index]!;
}

function useTerminalPlayback(script: TerminalEntry[]) {
  const [history, setHistory] = useState<TerminalEntry[]>([]);
  const [activeCommand, setActiveCommand] = useState('');

  useEffect(() => {
    let cancelled = false;
    let timeoutId = 0;

    const schedule = (fn: () => void, ms: number) => {
      timeoutId = window.setTimeout(fn, ms);
    };

    const play = (entryIndex: number) => {
      if (cancelled) return;

      if (entryIndex >= script.length) {
        schedule(() => {
          if (cancelled) return;
          setHistory([]);
          setActiveCommand('');
          play(0);
        }, 2200);
        return;
      }

      const entry = script[entryIndex]!;
      if (entry.kind === 'response') {
        setHistory((current) => [...current, entry]);
        schedule(() => play(entryIndex + 1), 520);
        return;
      }

      let charIndex = 0;
      setActiveCommand('');

      const typeNext = () => {
        if (cancelled) return;

        if (charIndex < entry.text.length) {
          charIndex += 1;
          setActiveCommand(entry.text.slice(0, charIndex));
          schedule(typeNext, 22 + Math.round(Math.random() * 28));
          return;
        }

        setHistory((current) => [...current, entry]);
        setActiveCommand('');
        schedule(() => play(entryIndex + 1), 340);
      };

      typeNext();
    };

    play(0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [script]);

  return { history, activeCommand };
}

function NavLink({ label, active = false }: { label: string; active?: boolean }) {
  const href = active ? '#home' : `#${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <a
      className={`nav-link${active ? ' nav-link-active' : ''}`}
      href={href}
    >
      {label}
    </a>
  );
}

function StatusDots() {
  return (
    <div className="window-dots" aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
  );
}

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 2.25a10 10 0 0 0-3.16 19.49c.5.09.68-.21.68-.48 0-.24-.01-1.03-.01-1.87-2.5.46-3.15-.61-3.35-1.16-.11-.28-.58-1.16-1-1.39-.34-.18-.82-.64-.01-.65.76-.01 1.3.7 1.48.99.87 1.47 2.27 1.05 2.82.8.09-.63.34-1.05.62-1.29-2.22-.25-4.55-1.11-4.55-4.93 0-1.09.39-1.99 1.03-2.69-.1-.25-.45-1.28.1-2.66 0 0 .84-.27 2.75 1.03a9.42 9.42 0 0 1 5 0c1.91-1.3 2.75-1.03 2.75-1.03.55 1.38.2 2.41.1 2.66.64.7 1.03 1.59 1.03 2.69 0 3.83-2.33 4.67-4.55 4.93.35.31.66.91.66 1.84 0 1.33-.01 2.4-.01 2.73 0 .27.18.58.69.48A10 10 0 0 0 12 2.25Z"
        fill="currentColor"
      />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 12.75a4.13 4.13 0 1 0 0-8.25 4.13 4.13 0 0 0 0 8.25Zm0 1.5c-3.14 0-9 1.58-9 4.72 0 .84.66 1.53 1.5 1.53h15c.84 0 1.5-.69 1.5-1.53 0-3.14-5.86-4.72-9-4.72Z"
        fill="currentColor"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4.5 5.25h15A2.25 2.25 0 0 1 21.75 7.5v9A2.25 2.25 0 0 1 19.5 18.75h-15A2.25 2.25 0 0 1 2.25 16.5v-9A2.25 2.25 0 0 1 4.5 5.25Zm0 1.5a.75.75 0 0 0-.53.22L12 13.25l8.03-6.28a.75.75 0 0 0-.53-.22h-15Zm15 10.5a.75.75 0 0 0 .75-.75V8.5l-7.78 6.08a.75.75 0 0 1-.94 0L3.75 8.5v8a.75.75 0 0 0 .75.75h15Z"
        fill="currentColor"
      />
    </svg>
  );
}

function TerminalSection() {
  const { history, activeCommand } = useTerminalPlayback(terminalScript);

  return (
    <section className="terminal-section" id="documentation">
      <div className="terminal-section__bg" />
      <div className="terminal-shell glass-panel reveal" data-reveal>
        <div className="terminal-shell__header">
          <StatusDots />
          <span className="terminal-shell__title">PLANORA_CLI_V1.0.4</span>
          <span className="terminal-shell__spacer" />
        </div>
        <div className="terminal-shell__body">
          <div className="terminal-history" aria-live="polite">
            {history.map((entry, index) => (
              <div
                key={`${entry.kind}-${entry.text}-${index}`}
                className={`terminal-line terminal-line-${entry.kind} terminal-line-tone-${entry.tone ?? 'soft'}`}
              >
                {entry.kind === 'command' ? (
                  <span className="terminal-prompt">$</span>
                ) : (
                  <span className="terminal-arrow">&gt;</span>
                )}
                <span>{entry.text}</span>
              </div>
            ))}
          </div>
          <div className="terminal-line terminal-line-command terminal-line-active">
            <span className="terminal-prompt">$</span>
            <span>{activeCommand || ' '}</span>
            <span className="terminal-cursor" aria-hidden="true" />
          </div>
        </div>
      </div>
    </section>
  );
}

function CreatorSection() {
  return (
    <section className="creator-section" id="pricing">
      <div className="creator-section__bg" />
      <div className="creator-content reveal" data-reveal>
        <span className="eyebrow">Created by</span>
        <h2>kubabb</h2>
        <p>Architecting the next generation of developer tools for the void.</p>
        <div className="creator-links">
          <a href="https://github.com/kubabb/Planora" className="creator-link">
            <GithubIcon />
            <span>GitHub Repository</span>
          </a>
          <a href="https://github.com/kubabb" className="creator-link">
            <UserIcon />
            <span>GitHub Profile</span>
          </a>
          <a href="#" className="creator-link">
            <MailIcon />
            <span>Contact</span>
          </a>
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  eyebrow,
  title,
  body,
  large = false,
  accent = false,
  icon,
  visual,
}: {
  eyebrow: string;
  title: string;
  body: string;
  large?: boolean;
  accent?: boolean;
  icon?: string;
  visual?: 'chip' | 'grid';
}) {
  const classes = [
    'feature-card',
    'reveal',
    large ? 'feature-card-large' : '',
    accent ? 'feature-card-accent' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <article className={classes} data-reveal>
      <div className="feature-card__copy">
        <span className="eyebrow">{eyebrow}</span>
        <h3>{title}</h3>
        <p>{body}</p>
      </div>
      {icon ? (
        <div className="feature-card__icon" aria-hidden="true">
          <span>{icon}</span>
        </div>
      ) : null}
      {visual === 'grid' ? <div className="feature-card__grid-visual" aria-hidden="true" /> : null}
      {visual === 'chip' ? (
        <div className="feature-card__chip" aria-hidden="true">
          <div className="feature-card__chip-core" />
        </div>
      ) : null}
    </article>
  );
}

export function App() {
  const activeWord = useWordCycle(heroWords, 2200);
  const footerLinks = useMemo(() => ['Privacy', 'Terms', 'GitHub', 'Status'], []);

  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        }
      },
      { threshold: 0.18, rootMargin: '0px 0px -10% 0px' },
    );

    for (const element of elements) observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <div className="app-shell">
      <header className="topbar">
        <nav className="topbar__nav" aria-label="Primary">
          <NavLink label="Home" active />
          <NavLink label="Documentation" />
          <NavLink label="Pricing" />
          <NavLink label="Blog" />
        </nav>
      </header>

      <main>
        <section className="hero-section" id="home">
          <div className="hero-section__bg" />
          <div className="hero-section__noise" />
          <div className="hero-section__grid" />
          <div className="hero-content reveal is-visible" data-reveal>
            <div className="hero-orbit-label">Scroll to descend</div>
            <h1>
              <span>We </span>
              <span className="hero-word-frame">
                <span className="hero-word-slot" key={activeWord}>
                  {activeWord}.
                </span>
              </span>
            </h1>
          </div>
        </section>

        <TerminalSection />
        <CreatorSection />

        <section className="features-section">
          <div className="features-grid">
            <FeatureCard
              eyebrow="Precision"
              title="Zero-latency observability"
              body="Track every deployment with sub-millisecond precision across your edge control plane."
              large
              visual="grid"
            />
            <FeatureCard
              eyebrow="Security"
              title="Encrypted by default"
              body="Military-grade key rotation and zero-trust access for every container in the void."
            />
            <FeatureCard
              eyebrow="CLI"
              title="CLI First"
              body="Powerful terminal tools that integrate seamlessly with your existing workflow."
              icon=">"
            />
            <FeatureCard
              eyebrow="Orchestration"
              title="Global Scale Control"
              body="Deploy globally in seconds. Autonomous balancing handles the peaks so your team can stay focused."
              large
              accent
              visual="chip"
            />
          </div>
        </section>
      </main>

      <footer className="footer" id="blog">
        <div className="footer__brand">
          <div className="footer__mark">*</div>
          <div>
            <strong>Planora Systems</strong>
            <p>2024 Planora Systems. Engineered for the void.</p>
          </div>
        </div>
        <div className="footer__links">
          {footerLinks.map((label) => (
            <a key={label} href="#">
              {label}
            </a>
          ))}
        </div>
      </footer>
    </div>
  );
}
