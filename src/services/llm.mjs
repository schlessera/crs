import { GoogleGenerativeAI } from '@google/generative-ai';
import { TextFormatter } from './text-formatter.mjs';

export class LLMService {
    constructor(maxRetries = 3) {
        const apiKey = process.env.GOOGLE_GENAI_API_KEY;
        if (!apiKey) {
            throw new Error('GOOGLE_GENAI_API_KEY environment variable is required');
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        this.model = genAI.getGenerativeModel({ model: "gemini-pro" });
        this.maxRetries = maxRetries;
    }

    async generateFieldValue(field, previousValues = {}, attempt = 1, formMetadata = {}) {
        try {
            // Construct the context from previous values
            const previousContext = Object.entries(previousValues)
                .map(([fieldId, value]) => `${fieldId}: ${JSON.stringify(value)}`)
                .join('\n');

            // Get metadata context or use defaults
            const prefix = formMetadata?.integration?.llmPromptPrefix || 'Generate appropriate content for the following field:';
            const suffix = formMetadata?.integration?.llmPromptSuffix || 'Ensure the generated content is consistent with any provided context.';

            // Construct the prompt
            const prompt = `${prefix}

${previousContext ? `Current context:\n${previousContext}\n` : ''}

Instructions:
1. Generate content for: ${field.name}
2. Content must match this description: ${field.description}
3. Response format: ${field.type === 'array' ? 'Multiple lines, one item per line' : 'Single text value'}
4. Do not include any headers, titles, or labels
5. Do not include the field name or description
6. Provide only the content itself

Reference examples:
${formatExamplesForPrompt(field.examples)}

Additional context: ${field.contextPrompt}

${suffix}

Response (content only):`;

            const result = await this.model.generateContent(prompt);
            const response = result.response.text().trim();

            return {
                success: true,
                value: TextFormatter.formatResponse(response, field.type === 'array')
            };

        } catch (error) {
            console.error(`Generation attempt ${attempt} failed:`, error.message);

            if (attempt < this.maxRetries) {
                console.error(`Retrying... (attempt ${attempt + 1}/${this.maxRetries})`);
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

function formatExamplesForPrompt(examples) {
    if (Array.isArray(examples[0])) {
        return 'Examples of valid responses:\n' +
            examples.map(example =>
                example.map(item => `- ${item}`).join('\n')
            ).join('\n\n');
    }
    return 'Examples of valid responses:\n' +
        examples.map(example => `- ${example}`).join('\n');
} 