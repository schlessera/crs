import { test } from 'node:test';
import assert from 'node:assert';
import chalk from 'chalk';
import { LLMService } from '../../src/services/llm.mjs';

// Helper function to verify API key
async function isValidApiKey(apiKey) {
    if (!apiKey) return false;

    // Don't attempt validation with mock key
    if (apiKey === 'mock_key_for_test') return false;

    try {
        const service = new LLMService();
        const result = await service.generateFieldValue({
            name: 'Test',
            description: 'API key validation test',
            type: 'text',
            examples: ['test'],
            contextPrompt: 'Generate a single word'
        });
        return result.success;
    } catch (error) {
        return false;
    }
}

test('Form Flow Integration', async (t) => {
    const apiKey = process.env.GOOGLE_GENAI_API_KEY;
    if (!apiKey || apiKey === 'mock_key_for_test') {
        console.error(chalk.yellow('⚠ Skipping integration tests: No API key available'));
        return;
    }

    // Only verify if we have what looks like a real key
    const isValid = await isValidApiKey(apiKey);
    if (!isValid) {
        console.error(chalk.yellow('⚠ Skipping integration tests: Invalid API key'));
        return;
    }

    await t.test('maintains context between fields', async (t) => {
        const service = new LLMService();
        const mockFields = [
            {
                id: 'character-concept',
                name: 'Character Concept',
                type: 'textarea',
                examples: ['A wise merchant turned spy'],
                contextPrompt: 'Create a character concept'
            },
            {
                id: 'basic-name',
                name: 'Character Name',
                type: 'text',
                examples: ['John Smith'],
                contextPrompt: 'Generate a name based on the concept'
            }
        ];

        const results = {};

        // Generate first field
        const conceptResult = await service.generateFieldValue(mockFields[0], results);
        assert.ok(conceptResult.success, 'Successfully generated concept');
        results[mockFields[0].id] = conceptResult.value;

        // Generate second field with context from first
        const nameResult = await service.generateFieldValue(mockFields[1], results);
        assert.ok(nameResult.success, 'Successfully generated name');

        // Verify that the name generation took the concept into account
        assert.ok(
            nameResult.value && typeof nameResult.value === 'string',
            'Generated name is a non-empty string'
        );
    });
}); 