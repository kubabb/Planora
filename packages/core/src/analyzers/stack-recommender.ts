// Stack recommender — suggests tech stack based on project description

import type { DetectedStack } from './types.js';

interface StackRecommendation {
  language: string;
  framework: string;
  runtime: string;
  database: string;
  tools: string[];
  reasoning: string;
}

const STACK_PATTERNS: Array<{ keywords: string[]; stack: StackRecommendation }> = [
  {
    keywords: ['web', 'frontend', 'react', 'spa', 'dashboard', 'ui'],
    stack: {
      language: 'TypeScript',
      framework: 'React + Vite',
      runtime: 'Node.js',
      database: 'SQLite (local-first)',
      tools: ['Vitest', 'ESLint', 'Prettier', 'Tailwind CSS'],
      reasoning: 'React + Vite to standard dla nowoczesnych SPA. TypeScript dla bezpieczeństwa typów.',
    },
  },
  {
    keywords: ['fullstack', 'full stack', 'next', 'ssr', 'seo'],
    stack: {
      language: 'TypeScript',
      framework: 'Next.js',
      runtime: 'Node.js',
      database: 'PostgreSQL (Supabase/Neon)',
      tools: ['Vitest', 'ESLint', 'Prisma', 'Tailwind CSS'],
      reasoning: 'Next.js daje SSR, API routes i świetne DX. Supabase jako managed Postgres.',
    },
  },
  {
    keywords: ['api', 'backend', 'rest', 'graphql', 'microservice', 'server'],
    stack: {
      language: 'TypeScript',
      framework: 'Fastify / Hono',
      runtime: 'Node.js',
      database: 'PostgreSQL',
      tools: ['Vitest', 'Prisma', 'Docker', 'GitHub Actions'],
      reasoning: 'Fastify/Hono są szybsze niż Express. TypeScript dla type safety API.',
    },
  },
  {
    keywords: ['cli', 'command line', 'terminal', 'tool'],
    stack: {
      language: 'TypeScript',
      framework: 'Commander.js / Clack',
      runtime: 'Node.js',
      database: 'SQLite',
      tools: ['Vitest', 'tsup', 'npm publish'],
      reasoning: 'Node.js CLI z Commander.js to sprawdzone rozwiązanie. SQLite dla local-first.',
    },
  },
  {
    keywords: ['data', 'ml', 'ai', 'machine learning', 'analytics'],
    stack: {
      language: 'Python',
      framework: 'FastAPI',
      runtime: 'Python 3.12+',
      database: 'PostgreSQL + Redis',
      tools: ['Pytest', 'Docker', 'Jupyter', 'pandas'],
      reasoning: 'Python dominuje w data/ML. FastAPI dla wydajnego API. Jupyter do eksploracji.',
    },
  },
  {
    keywords: ['mobile', 'app', 'ios', 'android', 'cross platform'],
    stack: {
      language: 'TypeScript',
      framework: 'React Native / Expo',
      runtime: 'Node.js',
      database: 'SQLite (local) + Supabase (cloud)',
      tools: ['Jest', 'ESLint', 'EAS Build'],
      reasoning: 'React Native + Expo dla szybkiego developmentu cross-platform.',
    },
  },
];

const DEFAULT_STACK: StackRecommendation = {
  language: 'TypeScript',
  framework: 'Node.js',
  runtime: 'Node.js 20+',
  database: 'SQLite',
  tools: ['Vitest', 'ESLint', 'Prettier'],
  reasoning: 'TypeScript + Node.js to uniwersalny, bezpieczny wybór dla większości projektów.',
};

export function recommendStack(description: string): StackRecommendation {
  const lower = description.toLowerCase();

  for (const pattern of STACK_PATTERNS) {
    const matches = pattern.keywords.filter((kw) => lower.includes(kw));
    if (matches.length >= 2) return pattern.stack;
  }

  // Single keyword match
  for (const pattern of STACK_PATTERNS) {
    if (pattern.keywords.some((kw) => lower.includes(kw))) return pattern.stack;
  }

  return DEFAULT_STACK;
}

export function recommendFromExisting(existing: DetectedStack): string[] {
  const recs: string[] = [];

  if (existing.language === 'JavaScript' && !existing.tools.includes('TypeScript')) {
    recs.push('Rozważ migrację na TypeScript dla lepszego type safety');
  }
  if (existing.runtime === 'Node.js' && existing.packageManager === 'npm') {
    recs.push('Rozważ pnpm — szybszy i oszczędza miejsce na dysku');
  }
  if (!existing.testing) {
    recs.push(existing.language === 'TypeScript' ? 'Dodaj Vitest do testów' : 'Dodaj framework testowy');
  }
  if (!existing.database && existing.framework === 'Next.js') {
    recs.push('Rozważ Prisma + SQLite na start, Supabase dla production');
  }
  if (!existing.tools.includes('Docker')) {
    recs.push('Rozważ Docker dla spójnego środowiska dev/prod');
  }

  return recs;
}
