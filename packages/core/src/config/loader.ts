// Config loader — read/write ~/.planora/config.json

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import type { PlanoraConfig } from './types';
import { DEFAULT_PREFERENCES } from './types';

const PLANORA_DIR = path.join(os.homedir(), '.planora');
const CONFIG_PATH = path.join(PLANORA_DIR, 'config.json');
const CONFIG_PERMS = 0o600;

/** Create a default config (empty providers, default prefs) */
export function createDefaultConfig(): PlanoraConfig {
  return {
    version: 1,
    providers: {},
    preferences: { ...DEFAULT_PREFERENCES },
  };
}

/** Ensure ~/.planora/ directory exists with correct perms */
export function ensureConfigDir(): void {
  if (!fs.existsSync(PLANORA_DIR)) {
    fs.mkdirSync(PLANORA_DIR, { mode: 0o700 });
  }
}

/** Load config from disk. Returns default if file doesn't exist. */
export function loadConfig(): PlanoraConfig {
  ensureConfigDir();
  if (!fs.existsSync(CONFIG_PATH)) {
    return createDefaultConfig();
  }
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as PlanoraConfig;
    // Basic validation
    if (!parsed.version || !parsed.providers) {
      return createDefaultConfig();
    }
    return parsed;
  } catch {
    return createDefaultConfig();
  }
}

/** Save config to disk with secure permissions */
export function saveConfig(config: PlanoraConfig): void {
  ensureConfigDir();
  const json = JSON.stringify(config, null, 2);
  fs.writeFileSync(CONFIG_PATH, json, { mode: CONFIG_PERMS, encoding: 'utf-8' });
  // Ensure perms even on existing file
  fs.chmodSync(CONFIG_PATH, CONFIG_PERMS);
}

/** Add or update a provider in config */
export function upsertProvider(
  config: PlanoraConfig,
  key: string,
  provider: PlanoraConfig['providers'][string],
): PlanoraConfig {
  return {
    ...config,
    providers: {
      ...config.providers,
      [key]: provider,
    },
  };
}

/** Get the active provider config */
export function getActiveProvider(config: PlanoraConfig): PlanoraConfig['providers'][string] | null {
  const keys = Object.keys(config.providers);
  if (keys.length === 0) return null;
  const key = config.providers['default'] ? 'default' : keys[0];
  return config.providers[key] ?? null;
}

/** Get config path for display */
export function getConfigPath(): string {
  return CONFIG_PATH;
}
