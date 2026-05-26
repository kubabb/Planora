// @planora/core — analyzers barrel

export type {
  RepoAnalysis,
  DetectedStack,
  FileStats,
  QualityIndicators,
} from './types.js';

export { analyzeRepo } from './repo-analyzer.js';
export { recommendStack, recommendFromExisting } from './stack-recommender.js';
