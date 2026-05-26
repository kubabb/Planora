import { useEffect, useMemo, useState } from 'react';

type TerminalEntry = {
  kind: 'command' | 'response';
  text: string;
  tone?: 'soft' | 'bright' | 'cyan';
};

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

const heroWords = ['build', 'plan', 'develop'];

function useTypingCycle(words: string[], typingMs = 90, pauseMs = 1300, deletingMs = 48) {
  const [wordIndex, setWordIndex] = useState(0);
  const [visibleLength, setVisibleLength] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const word = words[wordIndex] ?? '';
    const isComplete = visibleLength === word.length;
    const isEmpty = visibleLength === 0;
    const delay = isComplete && !isDeleting ? pauseMs : isDeleting ? deletingMs : typingMs;

    const handle = window.setTimeout(() => {
      if (!isDeleting && isComplete) {
        setIsDeleting(true);
        return;
      }

      if (isDeleting && isEmpty) {
        setIsDeleting(false);
        setWordIndex((current) => (current + 1) % words.length);
        return;
      }

      setVisibleLength((current) => current + (isDeleting ? -1 : 1));
    }, delay);

    return () => window.clearTimeout(handle);
  }, [deletingMs, isDeleting, pauseMs, typingMs, visibleLength, wordIndex, words]);

  return words[wordIndex]?.slice(0, visibleLength) ?? '';
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

function usePathname() {
  const [pathname, setPathname] = useState(window.location.pathname);

  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = (nextPath: string) => {
    if (window.location.pathname === nextPath) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    window.history.pushState({}, '', nextPath);
    setPathname(nextPath);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  return { pathname, navigate };
}

function NavLink({
  label,
  href,
  active = false,
  onNavigate,
}: {
  label: string;
  href: string;
  active?: boolean;
  onNavigate?: (href: string) => void;
}) {
  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!onNavigate) return;
    event.preventDefault();
    onNavigate(href);
  };

  return (
    <a
      className={`nav-link${active ? ' nav-link-active' : ''}`}
      href={href}
      onClick={handleClick}
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

function DocumentationPage({ onNavigateHome }: { onNavigateHome: (href: string) => void }) {
  const sections = [
    {
      id: 'overview',
      title: 'Overview',
      body:
        'Planora is a markdown-first planning system for software teams. It turns project context into structured plans, mind maps, architecture diagrams, and a local dashboard without making Hermes a product dependency.',
    },
    {
      id: 'workflow',
      title: 'User flow',
      body:
        'The first-run path is intentionally short: configure a provider, initialize a workspace, generate the plan pack, then review everything locally in the web app or in VS Code.',
      code: ['planora config', 'planora init', 'planora plan --ai', 'planora web'],
    },
    {
      id: 'generated-files',
      title: 'Generated files',
      body:
        'Markdown is the source of truth. Every generated artifact is git-friendly, readable in plain text, and available to the CLI, the extension, and the local web interface.',
      items: [
        ['PROJECT_PLAN.md', 'overview, goals, MVP, stack, milestones'],
        ['ROADMAP.md', 'phased delivery plan and sequencing'],
        ['MINDMAP.md', 'hierarchical outline for markmap rendering'],
        ['ARCHITECTURE.md', 'Mermaid-based system and data-flow diagrams'],
        ['AGENT_SETUP.md', 'provider, model, and workflow notes'],
        ['planora.json', 'project metadata and machine-readable settings'],
      ],
    },
    {
      id: 'architecture',
      title: 'Architecture',
      body:
        'The monorepo is split into shared core logic, execution surfaces, and an agent runtime. The current direction centers on Planora’s own agent with OpenRouter, OpenAI, Ollama, and compatible providers.',
      code: [
        'packages/core      models, generators, storage, AI client',
        'packages/cli       init, plan, config, web, agent commands',
        'packages/web       React + Vite dashboard on localhost:4173',
        'packages/runner    Planora agent runtime and workflows',
        'packages/vscode-ext editor integration and command surface',
      ],
    },
    {
      id: 'agent',
      title: 'Own agent direction',
      body:
        'The agent runtime is responsible for prompts, sessions, tool calls, and workflow execution. Users provide only the API key, provider, and model; Planora handles the rest of the conversation loop.',
      items: [
        ['Providers', 'OpenRouter recommended, plus OpenAI, Ollama, OpenCode, custom'],
        ['Config', '~/.planora/config.json stored locally'],
        ['Workflows', 'plan, code, review'],
        ['Tools', 'file read/write, shell, web search, fetch'],
      ],
    },
    {
      id: 'implementation-plan',
      title: 'Implementation plan',
      body:
        'The current build path is already laid out in the project plans. The practical order is to finish the AI client and config system first, then complete generators, agent workflows, CLI, web views, and finally optional Hermes orchestration.',
      items: [
        ['M2', 'finish core AI client, config loading, validation, tests'],
        ['M3', 'complete markdown generators and output shaping'],
        ['M4', 'expand web dashboard, project views, map and diagram rendering'],
        ['M5', 'finish CLI flows and Planora agent runtime'],
        ['M6', 'ship VS Code extension experience'],
        ['M7', 'add Hermes as an optional advanced orchestrator'],
      ],
    },
  ];

  return (
    <div className="docs-page">
      <section className="docs-sections" id="docs-sections">
        <div className="docs-layout">
          <aside className="docs-sidebar docs-sidebar-left reveal is-visible" data-reveal>
            <div className="docs-sidebar__brand">
              <span className="eyebrow">Planora</span>
              <p>Standalone planning docs for the actual product direction.</p>
            </div>
            <nav className="docs-sidebar__nav" aria-label="Documentation sections">
              {sections.map((section) => (
                <a key={section.id} href={`#${section.id}`}>
                  {section.title}
                </a>
              ))}
            </nav>
            <a
              href="/"
              className="docs-sidebar__back"
              onClick={(event) => {
                event.preventDefault();
                onNavigateHome('/');
              }}
            >
              Back home
            </a>
          </aside>
          <div className="docs-content">
            <article className="docs-intro reveal is-visible" data-reveal>
              <span className="eyebrow">Documentation</span>
              <h1>Planora documentation</h1>
              <p>
                Planora is a markdown-first planning tool for new builds and existing repositories.
                It runs with its own agent, takes a provider key such as OpenRouter, and generates
                readable project artifacts locally.
              </p>
            </article>
            {sections.map((section) => (
              <article key={section.id} id={section.id} className="docs-article reveal" data-reveal>
                <span className="eyebrow">{section.title}</span>
                <h2>{section.title}</h2>
                <p>{section.body}</p>
                {'code' in section && section.code ? (
                  <div className="docs-code-block">
                    {section.code.map((line) => (
                      <div key={line}>{line}</div>
                    ))}
                  </div>
                ) : null}
                {'items' in section && section.items ? (
                  <div className="docs-definition-list">
                    {section.items.map(([term, description]) => (
                      <div key={term} className="docs-definition-row">
                        <strong>{term}</strong>
                        <span>{description}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
          <aside className="docs-sidebar docs-sidebar-right reveal is-visible" data-reveal>
            <span className="eyebrow">On this page</span>
            <nav className="docs-sidebar__nav docs-sidebar__nav-quiet" aria-label="Table of contents">
              {sections.map((section) => (
                <a key={section.id} href={`#${section.id}`}>
                  {section.title}
                </a>
              ))}
            </nav>
          </aside>
        </div>
      </section>
    </div>
  );
}

function CreatorSection() {
  return (
    <section className="creator-section" id="about-us">
      <div className="creator-section__bg" />
      <div className="creator-content reveal" data-reveal>
        <span className="eyebrow">About us</span>
        <h2>kubabb</h2>
        <p>
          Building Planora as a calm planning layer for hackathons, MVPs, and projects that
          already have momentum.
        </p>
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
  const typedHeroWord = useTypingCycle(heroWords);
  const footerGroups = useMemo(
    () => [
      {
        title: 'Product',
        links: ['Documentation', 'CLI', 'Web dashboard', 'VS Code'],
      },
      {
        title: 'Planning',
        links: ['Hackathons', 'MVP roadmap', 'Existing repos', 'Team handoff'],
      },
      {
        title: 'Project',
        links: ['GitHub', 'Status', 'Privacy', 'Terms'],
      },
    ],
    [],
  );
  const { pathname, navigate } = usePathname();
  const isDocumentationPage = pathname === '/documentation';

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
  }, [isDocumentationPage]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <nav className="topbar__nav" aria-label="Primary">
          <NavLink label="Home" href="/" active={!isDocumentationPage} onNavigate={navigate} />
          <NavLink
            label="Documentation"
            href="/documentation"
            active={isDocumentationPage}
            onNavigate={navigate}
          />
          <NavLink label="About us" href={isDocumentationPage ? '/#about-us' : '#about-us'} />
          <NavLink label="Blog" href={isDocumentationPage ? '/#blog' : '#blog'} />
        </nav>
      </header>

      <main>
        {isDocumentationPage ? (
          <DocumentationPage onNavigateHome={navigate} />
        ) : (
          <>
        <section className="hero-section" id="home">
          <div className="hero-section__bg" />
          <div className="hero-section__noise" />
          <div className="hero-section__grid" />
          <div className="hero-content reveal is-visible" data-reveal>
            <span className="hero-orbit-label">Plan slowly. Ship clearly.</span>
            <h1>
              <span>We </span>
              <span className="hero-typed-word">{typedHeroWord}</span>
              <span className="hero-typed-cursor" aria-hidden="true" />
            </h1>
          </div>
        </section>

        <TerminalSection />
        <CreatorSection />

        <section className="features-section">
          <div className="features-grid">
            <FeatureCard
              eyebrow="Hackathons"
              title="Hackathon plans in minutes"
              body="Turn a raw idea into an MVP scope, task split, architecture sketch, and judging-ready roadmap before the build sprint gets loud."
              large
              visual="grid"
            />
            <FeatureCard
              eyebrow="Existing projects"
              title="Develop what is already alive"
              body="Map the current codebase, find realistic next milestones, and plan growth without pretending every project starts from zero."
            />
            <FeatureCard
              eyebrow="Team clarity"
              title="Split work without chaos"
              body="Give builders, designers, and presenters a shared plan so everyone knows what matters now, what can wait, and what proves the idea."
              icon=">"
            />
            <FeatureCard
              eyebrow="Roadmaps"
              title="Keep momentum after launch"
              body="Use Planora to turn post-demo feedback into staged improvements, backlog decisions, and a roadmap the team can actually follow."
              large
              accent
              visual="chip"
            />
          </div>
        </section>
          </>
        )}
      </main>

      <footer className="footer reveal" id="blog" data-reveal>
        <div className="footer__main">
          <div className="footer__brand">
            <div className="footer__mark">P</div>
            <div>
              <strong>Planora Systems</strong>
              <p>
                Planning tools for hackathon teams, MVP builders, and existing projects that need
                a clearer next step.
              </p>
            </div>
          </div>
          <div className="footer__status">
            <span>Local-first</span>
            <span>Markdown output</span>
            <span>Agent-ready</span>
          </div>
        </div>
        <div className="footer__columns">
          {footerGroups.map((group) => (
            <div key={group.title} className="footer__column">
              <h2>{group.title}</h2>
              {group.links.map((label) => (
                <a key={label} href={label === 'Documentation' ? '/documentation' : '#'}>
                  {label}
                </a>
              ))}
            </div>
          ))}
        </div>
        <div className="footer__bottom">
          <span>2026 Planora Systems</span>
          <span>Built by kubabb for slower planning and cleaner shipping.</span>
        </div>
      </footer>
    </div>
  );
}
