// PlanFile model

export type PlanFileType =
  | 'PROJECT_PLAN'
  | 'ROADMAP'
  | 'MINDMAP'
  | 'ARCHITECTURE'
  | 'AGENT_SETUP';

export interface PlanFile {
  id: string;
  projectId: string;
  type: PlanFileType;
  content: string;
  filePath: string;
  generatedAt: Date;
}

export type CreatePlanFileInput = Omit<PlanFile, 'id' | 'generatedAt'>;
