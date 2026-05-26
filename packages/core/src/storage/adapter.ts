// Storage adapter interface

export interface StorageAdapter {
  // Users
  createUser(user: { id: string; name: string; email?: string; profile: string }): void;
  getUser(id: string): unknown | null;

  // Projects
  createProject(project: { id: string; name: string; description: string; userId: string; stack: string; basePath: string }): void;
  getProject(id: string): unknown | null;
  listProjects(userId?: string): unknown[];

  // Agent Runs
  createRun(run: { id: string; projectId: string; workflow: string; status: string; output: string; stepsUsed: number; tokensUsed: number; startedAt: string; finishedAt?: string; error?: string }): void;
  updateRun(id: string, update: { status?: string; output?: string; stepsUsed?: number; tokensUsed?: number; finishedAt?: string; error?: string }): void;
  listRuns(projectId: string): unknown[];

  // Close connection
  close(): void;
}
