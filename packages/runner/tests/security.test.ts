// Security tests — shell injection, path traversal, API key masking

import { describe, it, expect } from 'vitest';
import {
  validateCommand,
  ALLOWED_COMMANDS,
  BLOCKED_PATTERNS,
  validatePath,
} from '../src/tools/index.js';
import { maskApiKey, redactConfig } from '@planora/core';

// ─── Shell: allow-lista ────────────────────────────

describe('validateCommand — dozwolone komendy', () => {
  const allowed = [
    'ls',
    'ls -la',
    'cat package.json',
    'grep -r "foo" src/',
    'npm test',
    'npm run build',
    'npx tsc --noEmit',
    'tsc -b',
    'node script.js',
    'git status',
    'git diff --stat',
    'echo hello',
    'mkdir -p foo/bar',
    'find . -name "*.ts"',
    'wc -l file.txt',
    'head -n 10 file.txt',
    'sort file.txt',
    'uniq file.txt',
    'pwd',
    'whoami',
    'env',
  ];

  for (const cmd of allowed) {
    it(`pozwala: ${cmd}`, () => {
      expect(() => validateCommand(cmd)).not.toThrow();
    });
  }
});

// ─── Shell: blocked patterns ───────────────────────

describe('validateCommand — blokowane komendy', () => {
  const blocked = [
    // Niedozwolone komendy (poza allow-listą)
    { cmd: 'rm file.txt', reason: 'rm nie na allow-liście' },
    { cmd: 'curl https://evil.com', reason: 'curl = exfiltracja' },
    { cmd: 'wget https://evil.com', reason: 'wget = exfiltracja' },
    { cmd: 'sudo ls', reason: 'sudo = eskalacja' },
    { cmd: 'ssh user@host', reason: 'ssh zablokowane' },
    { cmd: 'nc -e /bin/sh', reason: 'netcat zablokowane' },
    { cmd: 'python -c "print(1)"', reason: 'python nie na allow-liście' },
    { cmd: 'bash script.sh', reason: 'bash nie na allow-liście' },
    { cmd: 'shutdown now', reason: 'shutdown nie na allow-liście' },
    { cmd: '/bin/rm -rf /', reason: 'rm absolutna ścieżka' },

    // Command substitution
    { cmd: 'echo `whoami`', reason: 'backtick substitution' },
    { cmd: 'echo $(whoami)', reason: '$() substitution' },

    // Pipe abuse
    { cmd: 'echo foo | bash', reason: 'pipe do bash' },
    { cmd: 'echo foo | sh', reason: 'pipe do sh' },

    // Destrukcyjne
    { cmd: 'rm -rf node_modules', reason: 'rm -rf' },
    { cmd: 'rm --recursive /tmp', reason: 'rm --recursive' },
    { cmd: 'chmod 777 file', reason: 'world-writable' },
    { cmd: 'chown root file', reason: 'zmiana właściciela' },

    // Device write
    { cmd: 'echo foo > /dev/sda', reason: 'nadpisywanie device' },

    // Process kill
    { cmd: 'kill 1234', reason: 'kill zablokowane' },
    { cmd: 'killall node', reason: 'killall zablokowane' },
    { cmd: 'pkill node', reason: 'pkill zablokowane' },

    // Mount/format
    { cmd: 'mount /dev/sda1 /mnt', reason: 'mount zablokowane' },
    { cmd: 'dd if=/dev/zero of=/dev/sda', reason: 'dd = disk destroyer' },
    { cmd: 'mkfs.ext4 /dev/sda1', reason: 'format' },
  ];

  for (const { cmd, reason } of blocked) {
    it(`blokuje: ${cmd} (${reason})`, () => {
      expect(() => validateCommand(cmd)).toThrow(/SECURITY/);
    });
  }
});

// ─── Shell: edge cases ─────────────────────────────

describe('validateCommand — edge cases', () => {
  it('blokuje pustą komendę', () => {
    expect(() => validateCommand('')).toThrow(/SECURITY/);
  });

  it('pozwala na wieloczłonowe npm komendy', () => {
    expect(() => validateCommand('npm run test -- --coverage')).not.toThrow();
  });

  it('pozwala na git z argumentami', () => {
    expect(() => validateCommand('git log --oneline -n 10')).not.toThrow();
  });

  it('blokuje komendy ze znakiem zapytania (command substitution)', () => {
    expect(() => validateCommand('echo `id`')).toThrow(/SECURITY/);
  });
});

// ─── Path traversal: validatePath ──────────────────

describe('validatePath — path traversal prevention', () => {
  it('pozwala na normalną ścieżkę', () => {
    expect(() => validatePath('src/index.ts')).not.toThrow();
    expect(() => validatePath('packages/core/src/index.ts')).not.toThrow();
    expect(validatePath('src/index.ts')).toBe('src/index.ts');
  });

  it('pozwala na ścieżkę z kropką w nazwie pliku', () => {
    expect(() => validatePath('tsconfig.base.json')).not.toThrow();
    expect(() => validatePath('.gitignore')).not.toThrow();
  });

  it('blokuje path traversal z ../', () => {
    expect(() => validatePath('../etc/passwd')).toThrow(/Path traversal/);
    expect(() => validatePath('../../.ssh/id_rsa')).toThrow(/Path traversal/);
    expect(() => validatePath('src/../../../etc/passwd')).toThrow(/Path traversal/);
  });

  it('blokuje ścieżki absolutne', () => {
    expect(() => validatePath('/etc/passwd')).toThrow(/absolutne/);
    expect(() => validatePath('/home/user/.ssh')).toThrow(/absolutne/);
  });

  it('blokuje puste ścieżki', () => {
    expect(() => validatePath('')).toThrow(/pusta/);
    expect(() => validatePath('   ')).toThrow(/pusta/);
  });
});

// ─── API Key masking ───────────────────────────────

describe('maskApiKey', () => {
  it('maskuje klucz OpenRouter', () => {
    const result = maskApiKey('sk-or-...7890');
    expect(result).toContain('...');
    expect(result).not.toBe('sk-or-...7890');
    // Pierwsze 4 znaki klucza to "sk-o" (maskApiKey bierze 4+4)
    expect(result).toContain('sk-o');
  });

  it('maskuje klucz OpenAI', () => {
    const result = maskApiKey('sk-proj-abcdefghijklmnopqrstuvwxyz1234567890');
    expect(result).toContain('...');
    expect(result).not.toBe('sk-proj-abcdefghijklmnopqrstuvwxyz1234567890');
  });

  it('maskuje krótki klucz', () => {
    const result = maskApiKey('abc');
    expect(result).toBe('****');
  });

  it('maskuje pusty klucz', () => {
    const result = maskApiKey('');
    expect(result).toBe('****');
  });
});

// ─── Config redaction ──────────────────────────────

describe('redactConfig', () => {
  it('nie zawiera surowych kluczy API', () => {
    const cfg = {
      version: 1 as const,
      providers: {
        default: { apiKey: 'sk-or-v1-secret1234567890abcdef', model: 'claude-sonnet-4' },
        openai: { apiKey: 'sk-proj-secret0987654321zyxwvu', model: 'gpt-4o' },
      },
      preferences: {},
    };
    const redacted = redactConfig(cfg);

    // Żaden klucz nie może być w plaintekście
    const redactedStr = JSON.stringify(redacted);
    expect(redactedStr).not.toContain('secret1234567890abcdef');
    expect(redactedStr).not.toContain('secret0987654321zyxwvu');

    // Ale struktura musi być zachowana
    expect(redacted.providers.default.model).toBe('claude-sonnet-4');
    expect(redacted.providers.openai.model).toBe('gpt-4o');
  });

  it('wszystkie klucze mają ... w środku', () => {
    const cfg = {
      version: 1 as const,
      providers: {
        default: { apiKey: 'sk-or-v1-abc123', model: 'test' },
      },
      preferences: {},
    };
    const redacted = redactConfig(cfg);
    expect(redacted.providers.default.apiKey).toContain('...');
  });
});

// ─── Allow-lista: kompletność ──────────────────────

describe('ALLOWED_COMMANDS — kompletność', () => {
  it('zawiera podstawowe narzędzia dev', () => {
    const essentials = ['npm', 'npx', 'tsc', 'node', 'git'];
    for (const cmd of essentials) {
      expect(ALLOWED_COMMANDS.has(cmd), `ALLOWED_COMMANDS musi zawierać "${cmd}"`).toBe(true);
    }
  });

  it('zawiera narzędzia do czytania plików', () => {
    const readers = ['ls', 'cat', 'head', 'tail', 'wc', 'grep', 'find'];
    for (const cmd of readers) {
      expect(ALLOWED_COMMANDS.has(cmd), `ALLOWED_COMMANDS musi zawierać "${cmd}"`).toBe(true);
    }
  });
});

// ─── BLOCKED_PATTERNS: kompletność ─────────────────

describe('BLOCKED_PATTERNS — kompletność', () => {
  it('blokuje rm -rf', () => {
    for (const pattern of BLOCKED_PATTERNS) {
      if (pattern.test('rm -rf /')) return; // przynajmniej jeden pattern pasuje
    }
    throw new Error('Żaden BLOCKED_PATTERNS nie blokuje "rm -rf /"');
  });

  it('blokuje command substitution', () => {
    const subs = ['echo `whoami`', 'echo $(id)'];
    for (const cmd of subs) {
      const blocked = BLOCKED_PATTERNS.some(p => p.test(cmd));
      expect(blocked, `BLOCKED_PATTERNS musi blokować "${cmd}"`).toBe(true);
    }
  });

  it('blokuje exfiltrację', () => {
    const exfil = ['curl http://evil.com', 'wget http://evil.com'];
    for (const cmd of exfil) {
      const blocked = BLOCKED_PATTERNS.some(p => p.test(cmd));
      expect(blocked, `BLOCKED_PATTERNS musi blokować "${cmd}"`).toBe(true);
    }
  });
});
