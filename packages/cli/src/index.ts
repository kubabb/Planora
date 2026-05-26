#!/usr/bin/env node
// planora CLI — main entry point
import { Command } from 'commander';
import { configCommand } from './commands/config.js';
import { agentCommand } from './commands/agent.js';
import { planCommand } from './commands/plan.js';
import { initCommand } from './commands/init.js';
import { roadmapCommand } from './commands/roadmap.js';
import { mindmapCommand } from './commands/mindmap.js';
import { webCommand } from './commands/web.js';
import { analyzeCommand } from './commands/analyze.js';

const program = new Command();

program
  .name('planora')
  .description('AI-powered project planning tool')
  .version('0.1.0');

program.addCommand(configCommand);
program.addCommand(agentCommand);
program.addCommand(planCommand);
program.addCommand(initCommand);
program.addCommand(roadmapCommand);
program.addCommand(mindmapCommand);
program.addCommand(webCommand);
program.addCommand(analyzeCommand);

program.parse(process.argv);
