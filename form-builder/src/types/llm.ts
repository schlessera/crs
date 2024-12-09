import { AnyFormField } from './form';

export interface LLMResponse {
    success: boolean;
    value?: string;
    error?: string;
}

export interface LLMService {
    generateFieldValue(
        field: AnyFormField,
        previousValues?: Record<string, any>,
        attempt?: number,
        formMetadata?: Record<string, any>
    ): Promise<LLMResponse>;
} 