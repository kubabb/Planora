// Project model

export interface Project {
  id: string;
  name: string;
  description: string;
  userId: string;
  stack: string[];
  basePath: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateProjectInput = Omit<Project, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateProjectInput = Partial<Omit<Project, 'id' | 'userId' | 'createdAt'>>;
