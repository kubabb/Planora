// Analyzer types

export interface RepoAnalysis {
  name: string;
  path: string;
  stack: DetectedStack;
  structure: FileStats;
  quality: QualityIndicators;
  recommendations: string[];
}

export interface DetectedStack {
  language: string;
  framework: string | null;
  runtime: string | null;
  packageManager: string | null;
  database: string | null;
  testing: string | null;
  tools: string[];
}

export interface FileStats {
  totalFiles: number;
  sourceFiles: number;
  testFiles: number;
  configFiles: number;
  languages: Record<string, number>;
}

export interface QualityIndicators {
  hasGitignore: boolean;
  hasReadme: boolean;
  hasLicense: boolean;
  hasTests: boolean;
  hasCI: boolean;
  hasLinting: boolean;
  hasTypeChecking: boolean;
  score: number; // 0-100
}
