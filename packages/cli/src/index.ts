#!/usr/bin/env node
// planora CLI — main entry point
import { Command } from 'commander';
import { configCommand } from './commands/config.js';
import { agentCommand } from './commands/agent.js';
import { planCommand } from './commands/plan.js';

const program = new Command();

program
  .name('planora')
  .description('AI-powered project planning tool')
  .version('0.1.0');

program.addCommand(configCommand);
program.addCommand(agentCommand);
program.addCommand(planCommand);

program.parse(process.argv);
