// Agent config — runtime config for the Planora agent

export interface AgentConfig {
  /** Max agent steps (think↔act cycles) before stopping */
  maxSteps: number;
  /** Max context window in estimated tokens */
  maxContextTokens: number;
  /** Max wall-clock time per run (ms) */
  timeoutMs: number;
  /** Language for prompts */
  language: 'pl' | 'en';
}

export const DEFAULT_AGENT_CONFIG: AgentConfig = {
  maxSteps: 10,
  maxContextTokens: 8000,
  timeoutMs: 300_000, // 5 minutes
  language: 'pl',
};

/** Load agent config from Planora user preferences */
export function agentConfigFromPreferences(prefs: {
  maxSteps?: number;
  language?: 'pl' | 'en';
}): AgentConfig {
  return {
    ...DEFAULT_AGENT_CONFIG,
    ...prefs,
  };
}
