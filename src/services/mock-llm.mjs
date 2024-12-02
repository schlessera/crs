import { TextFormatter } from './text-formatter.mjs';

// Mock LLM service for testing
export class MockLLMService {
    constructor(config = {}) {
        this.config = {
            shouldFail: false,
            failureMessage: 'API Error',
            maxRetries: 3,
            responseText: 'Test response',
            ...config
        };
    }

    async generateFieldValue(field, previousValues = {}, attempt = 1, formMetadata = {}) {
        try {
            // Handle static failure case
            if (this.config.shouldFail) {
                throw new Error(this.config.failureMessage);
            }

            // Get response (might throw if responseText is a function that throws)
            const response = typeof this.config.responseText === 'function'
                ? await this.config.responseText(field, previousValues, formMetadata)
                : this.config.responseText;

            return {
                success: true,
                value: TextFormatter.formatResponse(response, field.type === 'array')
            };
        } catch (error) {
            if (attempt < this.config.maxRetries) {
                // Exponential backoff
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
                return this.generateFieldValue(field, previousValues, attempt + 1, formMetadata);
            }
            return {
                success: false,
                error: error.message
            };
        }
    }
} 