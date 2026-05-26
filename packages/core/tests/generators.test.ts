// Generators tests

import { describe, it, expect } from 'vitest';
import {
  projectPlanGenerator,
  roadmapGenerator,
  mindmapGenerator,
  architectureGenerator,
  agentSetupGenerator,
  planoraJsonGenerator,
} from '../src/generators/index.js';

describe('projectPlanGenerator', () => {
  it('generates markdown with project name', () => {
    const output = projectPlanGenerator.generate({
      projectName: 'TestApp',
      description: 'A test app',
      stack: 'React,Node.js',
    });
    expect(output).toContain('# TestApp');
    expect(output).toContain('A test app');
    expect(output).toContain('React');
  });
});

describe('roadmapGenerator', () => {
  it('generates roadmap with correct number of phases', () => {
    const output = roadmapGenerator.generate({ projectName: 'Test', phases: 3 });
    expect(output).toContain('## Q1: Foundation');
    expect(output).toContain('## Q2: Core Development');
    expect(output).toContain('## Q3: Advanced Features');
    expect(output).not.toContain('## Q4');
  });
});

describe('mindmapGenerator', () => {
  it('generates hierarchical markdown', () => {
    const output = mindmapGenerator.generate({
      projectName: 'Test',
      description: 'Test desc',
      stack: 'TS,Node',
    });
    expect(output).toContain('# Test');
    expect(output).toContain('## Architecture');
    expect(output).toContain('## Features');
    expect(output).toContain('TS');
    expect(output).toContain('Node');
  });
});

describe('architectureGenerator', () => {
  it('generates mermaid diagrams', () => {
    const output = architectureGenerator.generate({
      projectName: 'Test',
      description: 'Test',
      stack: 'React,Node.js,SQLite',
    });
    expect(output).toContain('```mermaid');
    expect(output).toContain('flowchart TD');
    expect(output).toContain('## Components');
  });
});

describe('agentSetupGenerator', () => {
  it('generates config with provider info', () => {
    const output = agentSetupGenerator.generate({
      projectName: 'Test',
      provider: 'openrouter',
      model: 'gpt-4o-mini',
    });
    expect(output).toContain('openrouter');
    expect(output).toContain('gpt-4o-mini');
    expect(output).toContain('planora agent --history');
  });
});

describe('planoraJsonGenerator', () => {
  it('generates valid JSON with project info', () => {
    const output = planoraJsonGenerator.generate({
      projectId: 'abc-123',
      projectName: 'TestApp',
      stack: 'React,Node',
      files: ['a.md', 'b.md'],
    });
    const parsed = JSON.parse(output);
    expect(parsed.name).toBe('TestApp');
    expect(parsed.stack).toEqual(['React', 'Node']);
    expect(parsed.files).toEqual(['a.md', 'b.md']);
    expect(parsed.agentReady).toBe(true);
  });
});
