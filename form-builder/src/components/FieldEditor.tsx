import React from 'react';
import { AnyFormField, ArrayFormField } from '../types/form';

interface FieldEditorProps {
    field: AnyFormField;
    onUpdate: (id: string, field: AnyFormField) => void;
    onRemove: (id: string) => void;
}

export default function FieldEditor({ field, onUpdate, onRemove }: FieldEditorProps) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const updatedValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

        onUpdate(field.id, {
            ...field,
            [name]: updatedValue,
        });
    };

    const handleExampleChange = (index: number, value: string) => {
        if (field.type === 'array') {
            const newExamples = [...field.examples] as string[][];
            if (!newExamples[0]) newExamples[0] = [];
            newExamples[0][index] = value;
            onUpdate(field.id, {
                ...field,
                examples: newExamples,
            } as ArrayFormField);
        } else {
            const newExamples = [...field.examples];
            newExamples[index] = value;
            onUpdate(field.id, {
                ...field,
                examples: newExamples,
            });
        }
    };

    const addExample = () => {
        if (field.type === 'array') {
            const newExamples = [...field.examples] as string[][];
            if (!newExamples[0]) newExamples[0] = [];
            newExamples[0].push('');
            onUpdate(field.id, {
                ...field,
                examples: newExamples,
            } as ArrayFormField);
        } else {
            onUpdate(field.id, {
                ...field,
                examples: [...field.examples, ''],
            });
        }
    };

    const removeExample = (index: number) => {
        if (field.type === 'array') {
            const newExamples = [...field.examples] as string[][];
            newExamples[0] = newExamples[0].filter((_, i) => i !== index);
            onUpdate(field.id, {
                ...field,
                examples: newExamples,
            } as ArrayFormField);
        } else {
            onUpdate(field.id, {
                ...field,
                examples: field.examples.filter((_, i) => i !== index),
            });
        }
    };

    return (
        <div className="border p-4 rounded-lg shadow-sm space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Field Editor</h3>
                <button
                    onClick={() => onRemove(field.id)}
                    className="text-red-500 hover:text-red-700"
                >
                    Remove
                </button>
            </div>

            <div className="space-y-2">
                <div>
                    <label className="block text-sm font-medium">Name</label>
                    <input
                        type="text"
                        name="name"
                        value={field.name}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium">Type</label>
                    <select
                        name="type"
                        value={field.type}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    >
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="email">Email</option>
                        <option value="textarea">Textarea</option>
                        <option value="select">Select</option>
                        <option value="array">Array</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium">
                        <input
                            type="checkbox"
                            name="required"
                            checked={field.required}
                            onChange={handleChange}
                            className="mr-2"
                        />
                        Required
                    </label>
                </div>

                <div>
                    <label className="block text-sm font-medium">Placeholder</label>
                    <input
                        type="text"
                        name="placeholder"
                        value={field.placeholder}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium">Description</label>
                    <textarea
                        name="description"
                        value={field.description}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="block text-sm font-medium">Examples</label>
                        <button
                            type="button"
                            onClick={addExample}
                            className="text-sm text-blue-500 hover:text-blue-700"
                        >
                            Add Example
                        </button>
                    </div>
                    {field.examples.map((example, index) => (
                        <div key={index} className="flex gap-2">
                            <input
                                type="text"
                                value={example}
                                onChange={(e) => handleExampleChange(index, e.target.value)}
                                placeholder={`Example ${index + 1}`}
                                className="flex-1 rounded-md border-gray-300 shadow-sm"
                            />
                            <button
                                type="button"
                                onClick={() => removeExample(index)}
                                className="text-red-500 hover:text-red-700"
                            >
                                Remove
                            </button>
                        </div>
                    ))}
                </div>

                <div>
                    <label className="block text-sm font-medium">Context Prompt</label>
                    <textarea
                        name="contextPrompt"
                        value={field.contextPrompt}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    />
                </div>
            </div>
        </div>
    );
}