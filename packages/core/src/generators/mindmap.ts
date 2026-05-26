// MINDMAP.md generator — hierarchical markdown for markmap

import type { Generator } from './types.js';

export interface MindmapInput {
  projectName: string;
  description: string;
  stack: string;
}

export const mindmapGenerator: Generator<MindmapInput> = {
  generate(input: MindmapInput): string {
    const stackList = input.stack.split(',').map((s) => s.trim());
    return `# ${input.projectName}

## Overview
- ${input.description}
- Tech Stack
${stackList.map((s) => `  - ${s.trim()}`).join('\n')}

## Architecture
- Frontend
  - Pages
    - Dashboard
    - Settings
  - Components
    - Layout
    - Navigation
- Backend
  - API
    - Endpoints
    - Middleware
  - Database
    - Models
    - Migrations
- Infrastructure
  - CI/CD
  - Deployment
  - Monitoring

## Features
- MVP
  - Core Feature 1
    - Sub-feature 1a
    - Sub-feature 1b
  - Core Feature 2
  - Core Feature 3
- v2
  - Advanced Feature 1
  - Advanced Feature 2

## Development
- Setup
  - Dependencies
  - Environment
- Workflow
  - Git
  - Code Review
  - Testing
- Deployment
  - Staging
  - Production
`;
  },
};
