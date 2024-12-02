import { readFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { LLMService } from '../services/llm.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Color-coded logging functions
const log = {
    status: (msg) => console.error(chalk.blue('ℹ ') + chalk.blue(msg)),
    success: (msg) => console.error(chalk.green('✓ ') + chalk.green(msg)),
    warning: (msg) => console.error(chalk.yellow('⚠ ') + chalk.yellow(msg)),
    error: (msg) => console.error(chalk.red('✖ ') + chalk.red(msg)),
    generated: (msg) => console.error(chalk.magenta('→ ') + chalk.magenta(msg)),
    field: (name, desc) => console.error(`\n${chalk.cyan(name)}\n${chalk.gray(desc)}`),
};

export async function fillFormCommand(formId) {
    try {
        // Load the form definition
        const formPath = join(__dirname, '../../data', `${formId}.json`);
        const formData = JSON.parse(await readFile(formPath, 'utf8'));

        log.status(`Loading form: ${formId}`);
        const llmService = new LLMService();
        const results = {};

        for (const field of formData.fields) {
            let decided = false;
            let currentExample = null;
            let lastSuccessfulGeneration = null;
            let generationAttempt = 1;

            while (!decided) {
                // If we don't have a current example, try to generate one
                if (!currentExample) {
                    log.field(field.name, field.description);
                    log.status(`Generating suggestion...`);
                    const generation = await llmService.generateFieldValue(field, results, 1, formData.metadata);

                    if (generation.success) {
                        currentExample = generation.value;
                        lastSuccessfulGeneration = currentExample;
                        log.generated(formatExample(currentExample));
                    } else {
                        // Handle generation failure
                        log.error(`Generation failed: ${generation.error}`);
                        const { action } = await inquirer.prompt([
                            {
                                type: 'list',
                                name: 'action',
                                message: 'What would you like to do?',
                                choices: [
                                    ...(lastSuccessfulGeneration ? [{ name: 'Use last successful generation', value: 'use_last' }] : []),
                                    { name: 'Try generating again', value: 'retry' },
                                    { name: 'Enter my own value', value: 'manual' },
                                    { name: 'Abort form filling', value: 'abort' }
                                ]
                            }
                        ]);

                        switch (action) {
                            case 'use_last':
                                currentExample = lastSuccessfulGeneration;
                                log.warning('Using last successful generation');
                                break;
                            case 'retry':
                                log.status('Retrying generation...');
                                continue;
                            case 'manual':
                                currentExample = null;
                                break;
                            case 'abort':
                                log.error('Form filling aborted by user');
                                process.exit(0);
                        }
                    }
                }

                // If we have a current example or are entering manually, proceed with the prompt
                const { action } = await inquirer.prompt([
                    {
                        type: 'list',
                        name: 'action',
                        message: currentExample ? 'What would you like to do?' : 'Enter your own value:',
                        choices: [
                            ...(currentExample ? [
                                { name: 'Accept this suggestion', value: 'accept' },
                                { name: 'Generate another suggestion', value: 'another' }
                            ] : []),
                            { name: 'Enter my own value', value: 'manual' }
                        ]
                    }
                ]);

                switch (action) {
                    case 'accept':
                        results[field.id] = currentExample;
                        decided = true;
                        log.success(`Accepted value for ${field.name}`);
                        break;
                    case 'another':
                        currentExample = null;
                        break;
                    case 'manual':
                        if (field.type === 'array') {
                            const values = [];
                            let addingValues = true;

                            log.status('Enter values one at a time. Submit empty line when done.');

                            while (addingValues) {
                                const { value } = await inquirer.prompt([
                                    {
                                        type: 'input',
                                        name: 'value',
                                        message: chalk.cyan(`Enter value (${values.length + 1}):`),
                                        validate: (input) => {
                                            if (field.required && values.length === 0 && !input) {
                                                return 'At least one value is required';
                                            }
                                            return true;
                                        }
                                    }
                                ]);

                                if (!value.trim()) {
                                    if (values.length > 0) {
                                        addingValues = false;
                                    }
                                } else {
                                    values.push(value.trim());
                                }
                            }
                            results[field.id] = values;
                        } else {
                            const { value } = await inquirer.prompt([
                                {
                                    type: 'input',
                                    name: 'value',
                                    message: chalk.cyan(`Enter your ${field.name}:`),
                                    validate: (input) => {
                                        if (field.required && !input) {
                                            return 'This field is required';
                                        }
                                        return true;
                                    }
                                }
                            ]);
                            results[field.id] = value;
                        }
                        decided = true;
                        log.success(`Manually entered value for ${field.name}`);
                        break;
                }
            }
        }

        // Output results to stdout
        console.log(JSON.stringify(results, null, 2));
        log.success('Form completion finished');

    } catch (error) {
        log.error(`Error filling form: ${error.message}`);
        process.exit(1);
    }
}

function formatExample(example) {
    if (Array.isArray(example)) {
        return '\n  - ' + example.join('\n  - ');
    }
    return example;
} 