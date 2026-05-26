// Mermaid diagram builder — programmatic generation

export type MermaidDirection = 'TD' | 'LR' | 'RL' | 'BT';

export interface MermaidNode {
  id: string;
  label: string;
  shape?: 'rect' | 'round' | 'stadium' | 'diamond' | 'circle' | 'cylinder';
  style?: Record<string, string>;
}

export interface MermaidEdge {
  from: string;
  to: string;
  label?: string;
  dashed?: boolean;
}

export interface FlowchartConfig {
  direction?: MermaidDirection;
  title?: string;
}

export function buildFlowchart(nodes: MermaidNode[], edges: MermaidEdge[], config: FlowchartConfig = {}): string {
  const lines: string[] = [];
  const dir = config.direction || 'TD';

  lines.push('```mermaid');
  lines.push(`flowchart ${dir}`);

  if (config.title) {
    lines.push(`  %% ${config.title}`);
  }

  // Nodes
  for (const node of nodes) {
    const shapeStart = getShapeStart(node.shape || 'rect');
    const shapeEnd = getShapeEnd(node.shape || 'rect');
    lines.push(`    ${node.id}${shapeStart}${node.label}${shapeEnd}`);
    if (node.style) {
      const styleStr = Object.entries(node.style)
        .map(([k, v]) => `${k}:${v}`)
        .join(',');
      lines.push(`    style ${node.id} ${styleStr}`);
    }
  }

  // Edges
  for (const edge of edges) {
    const arrow = edge.dashed ? '-.->' : '-->';
    const label = edge.label ? `|${edge.label}|` : '';
    lines.push(`    ${edge.from} ${arrow} ${label}${edge.to}`);
  }

  lines.push('```');
  return lines.join('\n');
}

export interface SequenceMessage {
  from: string;
  to: string;
  label: string;
  type?: 'solid' | 'dashed';
}

export function buildSequence(
  title: string,
  participants: string[],
  messages: SequenceMessage[],
): string {
  const lines: string[] = [];
  lines.push('```mermaid');
  lines.push('sequenceDiagram');
  lines.push(`  title ${title}`);

  for (const p of participants) {
    lines.push(`  participant ${p}`);
  }

  for (const msg of messages) {
    const arrow = msg.type === 'dashed' ? '-->>' : '->>';
    lines.push(`  ${msg.from}${arrow}${msg.to}: ${msg.label}`);
  }

  lines.push('```');
  return lines.join('\n');
}

export interface GanttTask {
  name: string;
  start: string; // e.g. '2025-01-01' or 'after prev'
  duration: string; // e.g. '7d' or '2w'
  status?: 'done' | 'active' | 'crit' | '';
}

export function buildGantt(
  title: string,
  sections: Array<{ name: string; tasks: GanttTask[] }>,
): string {
  const lines: string[] = [];
  lines.push('```mermaid');
  lines.push('gantt');
  lines.push(`  title ${title}`);
  lines.push('  dateFormat YYYY-MM-DD');

  for (const section of sections) {
    lines.push(`  section ${section.name}`);
    for (const task of section.tasks) {
      const status = task.status ? `:${task.status}` : '';
      lines.push(`  ${task.name}${status} ${task.start} ${task.duration}`);
    }
  }

  lines.push('```');
  return lines.join('\n');
}

// Helpers

function getShapeStart(shape: string): string {
  switch (shape) {
    case 'round': return '(';
    case 'stadium': return '(['; 
    case 'diamond': return '{';
    case 'circle': return '((';
    case 'cylinder': return '[(';
    case 'rect':
    default: return '[';
  }
}

function getShapeEnd(shape: string): string {
  switch (shape) {
    case 'round': return ')';
    case 'stadium': return '])';
    case 'diamond': return '}';
    case 'circle': return '))';
    case 'cylinder': return ')]';
    case 'rect':
    default: return ']';
  }
}
