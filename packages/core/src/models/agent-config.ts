// Agent config model — replaced old HermesConfig
// AgentRun — replaced old HermesRun

export type AgentWorkflow = 'plan' | 'code' | 'review';

export type AgentRunStatus = 'pending' | 'running' | 'success' | 'failed';

export interface AgentRun {
  id: string;
  projectId: string;
  workflow: AgentWorkflow;
  status: AgentRunStatus;
  output: string;
  error?: string;
  stepsUsed: number;
  tokensUsed: number;
  startedAt: Date;
  finishedAt?: Date;
}

export type CreateAgentRunInput = Omit<AgentRun, 'id' | 'finishedAt'>;
