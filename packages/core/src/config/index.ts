// @planora/core — config module barrel

export type {
  PlanoraConfig,
  ProviderConfig,
  UserPreferences,
  SafeConfig,
} from './types';

export {
  DEFAULT_PREFERENCES,
  DEFAULT_PROVIDER_KEY,
  maskApiKey,
  redactConfig,
} from './types';

export {
  createDefaultConfig,
  loadConfig,
  saveConfig,
  upsertProvider,
  getActiveProvider,
  getConfigPath,
  ensureConfigDir,
} from './loader';

export type { ConfigValidationResult } from './validator';
export { validateConfig, validateAndTest } from './validator';
