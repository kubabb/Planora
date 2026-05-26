// @planora/core — config module barrel

export type {
  PlanoraConfig,
  ProviderConfig,
  UserPreferences,
  SafeConfig,
} from './types.js';

export {
  DEFAULT_PREFERENCES,
  DEFAULT_PROVIDER_KEY,
  maskApiKey,
  redactConfig,
} from './types.js';

export {
  createDefaultConfig,
  loadConfig,
  saveConfig,
  upsertProvider,
  getActiveProvider,
  getConfigPath,
  ensureConfigDir,
} from './loader.js';

export type { ConfigValidationResult } from './validator.js';
export { validateConfig, validateAndTest } from './validator.js';
