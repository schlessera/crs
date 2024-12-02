import { test } from 'node:test';
import assert from 'node:assert';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import inquirer from 'inquirer';

const __dirname = dirname(fileURLToPath(import.meta.url));

test('Form Definition', async (t) => {
    await t.test('npc-form.json is valid and contains required fields', async (t) => {
        const formPath = join(__dirname, '../../data/npc-form.json');
        const formData = JSON.parse(await readFile(formPath, 'utf8'));

        assert.ok(formData.id, 'Form has an ID');
        assert.ok(Array.isArray(formData.fields), 'Form has fields array');

        // Check that required fields exist
        const requiredFields = ['character-concept', 'basic-name', 'physical-appearance'];
        for (const fieldId of requiredFields) {
            const field = formData.fields.find(f => f.id === fieldId);
            assert.ok(field, `Form contains ${fieldId} field`);
            assert.ok(field.name, `${fieldId} has a name`);
            assert.ok(field.description, `${fieldId} has a description`);
            assert.ok(field.type, `${fieldId} has a type`);
            assert.ok(Array.isArray(field.examples), `${fieldId} has examples`);
            assert.ok(field.contextPrompt, `${fieldId} has a context prompt`);
        }
    });

    await t.test('form fields have valid types', async (t) => {
        const formPath = join(__dirname, '../../data/npc-form.json');
        const formData = JSON.parse(await readFile(formPath, 'utf8'));

        const validTypes = ['text', 'textarea', 'array'];
        for (const field of formData.fields) {
            assert.ok(
                validTypes.includes(field.type),
                `Field ${field.id} has valid type (${field.type})`
            );
        }
    });

    await t.test('form has valid metadata', async (t) => {
        const formPath = join(__dirname, '../../data/npc-form.json');
        const formData = JSON.parse(await readFile(formPath, 'utf8'));

        assert.ok(formData.metadata, 'Form has metadata');
        assert.ok(formData.metadata.usage, 'Metadata has usage information');
        assert.ok(formData.metadata.integration, 'Metadata has integration settings');
        assert.ok(
            formData.metadata.integration.llmPromptPrefix,
            'Has LLM prompt prefix'
        );
        assert.ok(
            formData.metadata.integration.llmPromptSuffix,
            'Has LLM prompt suffix'
        );
    });

    await t.test('required fields are properly marked', async (t) => {
        const formPath = join(__dirname, '../../data/npc-form.json');
        const formData = JSON.parse(await readFile(formPath, 'utf8'));

        for (const field of formData.fields) {
            assert.ok(
                typeof field.required === 'boolean',
                `Field ${field.id} has required property as boolean`
            );
        }
    });
}); 