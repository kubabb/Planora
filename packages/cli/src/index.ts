#!/usr/bin/env node
// planora CLI — main entry point
import { Command } from 'commander';
import { createRequire } from 'node:module';
import { configCommand } from './commands/config.js';
import { agentCommand } from './commands/agent.js';
import { planCommand } from './commands/plan.js';
import { initCommand } from './commands/init.js';
import { roadmapCommand } from './commands/roadmap.js';
import { mindmapCommand } from './commands/mindmap.js';
import { webCommand } from './commands/web.js';
import { analyzeCommand } from './commands/analyze.js';
import { codeCommand } from './commands/code.js';
import { reviewCommand } from './commands/review.js';

const program = new Command();
const require = createRequire(import.meta.url);
const pkg = require('../package.json') as { version: string };

program
  .name('planora')
  .description('AI-powered project planning tool')
  .version(pkg.version);

program.addCommand(configCommand);
program.addCommand(agentCommand);
program.addCommand(planCommand);
program.addCommand(initCommand);
program.addCommand(roadmapCommand);
program.addCommand(mindmapCommand);
program.addCommand(webCommand);
program.addCommand(analyzeCommand);
program.addCommand(codeCommand);
program.addCommand(reviewCommand);

program.parse(process.argv);
