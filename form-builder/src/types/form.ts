export interface FormField {
    id: string;
    name: string;
    type: 'text' | 'number' | 'email' | 'textarea' | 'select' | 'array';
    required: boolean;
    placeholder: string;
    description: string;
    examples: string[];
    contextPrompt: string;
}

export interface ArrayFormField extends Omit<FormField, 'type' | 'examples'> {
    type: 'array';
    examples: string[][];
}

export type AnyFormField = FormField | ArrayFormField;

export interface Form {
    fields: AnyFormField[];
} 