#!/usr/bin/env node

import { Command } from 'commander';
import { handleCommand } from './commands/index.mjs';
import { fillFormCommand } from './commands/fill-form.mjs';

const program = new Command();

program
    .name('cli-app')
    .description('CLI application')
    .version('1.0.0');

program
    .command('execute')
    .description('Execute a command')
    .action(handleCommand);

program
    .command('fill-form <formId>')
    .description('Interactively fill out a form')
    .action(fillFormCommand);

program.parse(); 