import { test } from 'node:test';
import assert from 'node:assert';
import chalk from 'chalk';
import { LLMService } from '../../src/services/llm.mjs';
import { MockLLMService } from '../../src/services/mock-llm.mjs';

test('LLMService', async (t) => {
    // Mock service tests
    await t.test('handles generation failure gracefully', async (t) => {
        const service = new MockLLMService({
            shouldFail: true,
            failureMessage: 'API Error'
        });

        const mockField = {
            name: 'Test Field',
            description: 'Test description',
            type: 'text',
            examples: ['Example 1', 'Example 2'],
            contextPrompt: 'Test context'
        };

        const result = await service.generateFieldValue(mockField, {});
        assert.equal(result.success, false, 'Generation should fail');
        assert.ok(result.error, 'Error message should be present');
        assert.equal(result.error, 'API Error', 'Should contain the error message');
    });

    await t.test('cleans text responses correctly', async (t) => {
        const service = new MockLLMService({
            responseText: 'Name: Some text response\n1. With numbers\nLabel: And labels'
        });

        const mockField = {
            name: 'Test Field',
            description: 'Test description',
            type: 'text',
            examples: ['Example'],
            contextPrompt: 'Test context'
        };

        const result = await service.generateFieldValue(mockField, {});
        assert.ok(result.success, 'Generation should succeed');
        assert.equal(result.value, 'Some text response\nWith numbers\nAnd labels', 'Should clean labels and numbers');
    });

    await t.test('cleans array responses correctly', async (t) => {
        const service = new MockLLMService({
            responseText: '1. First item\n- Second item\n• Third item\nLabel: Fourth item\n\nEmpty lines should be removed\n'
        });

        const mockField = {
            name: 'Test Field',
            description: 'Test description',
            type: 'array',
            examples: [['Example 1', 'Example 2']],
            contextPrompt: 'Test context'
        };

        const result = await service.generateFieldValue(mockField, {});
        assert.ok(result.success, 'Generation should succeed');
        assert.deepEqual(result.value, [
            'First item',
            'Second item',
            'Third item',
            'Fourth item',
            'Empty lines should be removed'
        ], 'Should clean list markers and empty lines');
    });

    await t.test('retries on failure with backoff', async (t) => {
        let attempts = 0;
        const service = new MockLLMService({
            responseText: async () => {
                attempts++;
                if (attempts < 2) {
                    // Simulate failure for first attempt
                    throw new Error('Temporary error');
                }
                return 'Success after retry';
            }
        });

        const mockField = {
            name: 'Test Field',
            description: 'Test description',
            type: 'text',
            examples: ['Example'],
            contextPrompt: 'Test context'
        };

        const result = await service.generateFieldValue(mockField, {});
        assert.ok(result.success, 'Should succeed after retry');
        assert.equal(attempts, 2, 'Should have attempted twice');
        assert.equal(result.value, 'Success after retry', 'Should return successful response');
    });

    await t.test('uses form metadata in prompt', async (t) => {
        let promptUsed = '';
        const service = new MockLLMService({
            responseText: (field, values, metadata) => {
                promptUsed = JSON.stringify(metadata);
                return 'Test response';
            }
        });

        const mockField = {
            name: 'Test Field',
            description: 'Test description',
            type: 'text',
            examples: ['Example'],
            contextPrompt: 'Test context'
        };

        const mockMetadata = {
            integration: {
                llmPromptPrefix: 'Custom prefix',
                llmPromptSuffix: 'Custom suffix'
            }
        };

        await service.generateFieldValue(mockField, {}, 1, mockMetadata);
        const usedMetadata = JSON.parse(promptUsed);
        assert.equal(usedMetadata.integration.llmPromptPrefix, 'Custom prefix', 'Should use custom prefix');
        assert.equal(usedMetadata.integration.llmPromptSuffix, 'Custom suffix', 'Should use custom suffix');
    });

    // Real LLM tests
    if (!process.env.GOOGLE_GENAI_API_KEY) {
        console.error(chalk.yellow('⚠ Skipping real LLM tests: No API key available'));
        return;
    }

    await t.test('generates coherent responses with real LLM', async (t) => {
        const service = new LLMService();
        const mockField = {
            name: 'Test Field',
            description: 'A simple test description',
            type: 'text',
            examples: ['Example response'],
            contextPrompt: 'Generate a test response'
        };

        const result = await service.generateFieldValue(mockField, {});
        assert.ok(result.success, 'Generation should succeed');
        assert.ok(result.value && result.value.length > 0, 'Should generate non-empty response');
    });
}); 