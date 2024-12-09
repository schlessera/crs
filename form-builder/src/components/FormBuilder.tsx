import { useState, useEffect } from 'react';
import { Form, FormField, AnyFormField, ArrayFormField } from '../types/form';
import FieldEditor from './FieldEditor';
import FormPreview from './FormPreview';
import npcFormData from '../../../data/npc-form.json';

export default function FormBuilder() {
    const [form, setForm] = useState<Form>({ fields: [] });

    useEffect(() => {
        setForm({
            fields: npcFormData.fields.map(field => {
                if (field.type === 'array') {
                    return {
                        ...field,
                        type: 'array',
                        examples: field.examples as string[][],
                    } as ArrayFormField;
                }
                return {
                    ...field,
                    examples: Array.isArray(field.examples[0])
                        ? field.examples[0] as string[]
                        : field.examples as string[],
                } as FormField;
            })
        });
    }, []);

    const addField = () => {
        const newField: FormField = {
            id: crypto.randomUUID(),
            name: '',
            type: 'text',
            required: false,
            placeholder: '',
            description: '',
            examples: [],
            contextPrompt: '',
        };

        setForm((prev: Form) => ({
            fields: [...prev.fields, newField]
        }));
    };

    const updateField = (fieldId: string, updatedField: AnyFormField) => {
        setForm((prev: Form) => ({
            fields: prev.fields.map((field) =>
                field.id === fieldId ? updatedField : field
            )
        }));
    };

    const removeField = (fieldId: string) => {
        setForm((prev: Form) => ({
            fields: prev.fields.filter((field) => field.id !== fieldId)
        }));
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Form Builder</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-4">
                    <button
                        onClick={addField}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                        Add Field
                    </button>
                    {form.fields.map(field => (
                        <FieldEditor
                            key={field.id}
                            field={field}
                            onUpdate={updateField}
                            onRemove={removeField}
                        />
                    ))}
                </div>
                <div>
                    <FormPreview form={form} />
                </div>
            </div>
        </div>
    );
} 