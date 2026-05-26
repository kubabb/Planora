// PROJECT_PLAN.md generator — static template

import type { Generator } from './types.js';

export interface ProjectPlanInput {
  projectName: string;
  description: string;
  stack: string;
  author?: string;
}

export const projectPlanGenerator: Generator<ProjectPlanInput> = {
  generate(input: ProjectPlanInput): string {
    const stackList = input.stack.split(',').map((s) => s.trim());
    return `# ${input.projectName} — Project Plan

## Overview

${input.description}

**Author:** ${input.author || 'Planora'}
**Generated:** ${new Date().toISOString().split('T')[0]}

---

## Tech Stack

| Layer | Technology |
|-------|------------|
${stackList.map((s) => `| ${s.trim()} | — |`).join('\n')}

---

## MVP

### Core Features

1. **Feature 1** — description
2. **Feature 2** — description
3. **Feature 3** — description

### Non-MVP (v2+)

- Feature 4
- Feature 5

---

## Milestones

### M1: Foundation (Week 1-2)
- Project setup
- Core infrastructure
- CI/CD pipeline

### M2: Core Features (Week 3-5)
- Main functionality
- Data models
- API endpoints

### M3: Polish & Launch (Week 6-7)
- UI/UX refinements
- Testing
- Documentation

---

## Risks & Assumptions

| Risk | Impact | Mitigation |
|------|--------|------------|
| Scope creep | High | Strict MVP definition |
| Technical debt | Medium | Code reviews + tests |
| Dependencies | Low | Pinned versions |

---

## Success Metrics

- [ ] All MVP features implemented
- [ ] Test coverage > 80%
- [ ] CI pipeline passing
- [ ] Documentation complete
`;
  },
};
