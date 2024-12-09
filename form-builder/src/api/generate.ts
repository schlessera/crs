import { LLMService, type LLMResponse } from '../../../src/services/llm.mjs';
import type { AnyFormField } from '../types/form';

interface GenerateContext {
    fieldId: string;
    value: string | string[];
}

export async function generateFieldValue(field: AnyFormField, context: GenerateContext[]): Promise<LLMResponse> {
    const llmService = new LLMService();

    const contextObject = context.reduce<Record<string, string | string[]>>((acc, { fieldId, value }) => ({
        ...acc,
        [fieldId]: value
    }), {});

    return await llmService.generateFieldValue(field, contextObject);
} 