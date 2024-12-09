import { useState } from 'react';
import { Form } from '../types/form';
import type { LLMResponse } from '../../../src/services/llm.mjs';

interface SmartFillProps {
    form: Form;
    onComplete: (values: { [key: string]: string | string[] }) => void;
    onCancel: () => void;
}

interface FieldState {
    value: string | string[];
    status: 'pending' | 'generating' | 'done';
    suggestions: string[];
}

export default function SmartFill({ form, onComplete, onCancel }: SmartFillProps) {
    const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
    const [fieldStates, setFieldStates] = useState<{ [key: string]: FieldState }>({});
    const [isGenerating, setIsGenerating] = useState(false);

    const currentField = form.fields[currentFieldIndex];
    const currentState = fieldStates[currentField.id] || {
        value: currentField.type === 'array' ? [] : '',
        status: 'pending',
        suggestions: []
    };

    const generateSuggestion = async () => {
        setIsGenerating(true);
        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    field: currentField,
                    context: Object.entries(fieldStates).map(([id, state]) => ({
                        fieldId: id,
                        value: state.value
                    }))
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json() as LLMResponse;
            const suggestion = result.success ? result.value : '';

            if (suggestion) {
                setFieldStates(prev => ({
                    ...prev,
                    [currentField.id]: {
                        ...prev[currentField.id],
                        suggestions: [...(prev[currentField.id]?.suggestions || []), suggestion]
                    }
                }));
            }
        } catch (error) {
            console.error('Failed to generate suggestion:', error);
            alert('Failed to generate suggestion. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const acceptSuggestion = (value: string | string[]) => {
        setFieldStates(prev => ({
            ...prev,
            [currentField.id]: {
                ...prev[currentField.id],
                value,
                status: 'done'
            }
        }));

        if (currentFieldIndex < form.fields.length - 1) {
            setCurrentFieldIndex(prev => prev + 1);
        } else {
            const values = Object.entries(fieldStates).reduce((acc, [id, state]) => ({
                ...acc,
                [id]: state.value
            }), {});
            onComplete(values);
        }
    };

    const enterManualValue = (value: string | string[]) => {
        setFieldStates(prev => ({
            ...prev,
            [currentField.id]: {
                ...prev[currentField.id],
                value,
                status: 'done'
            }
        }));
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Smart Fill: {currentField.name}</h2>
                    <button
                        onClick={onCancel}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        Close
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded">
                        <p className="font-medium">Description:</p>
                        <p className="text-gray-600">{currentField.description}</p>
                    </div>

                    {currentField.examples.length > 0 && (
                        <div className="bg-gray-50 p-4 rounded">
                            <p className="font-medium">Examples:</p>
                            <ul className="list-disc pl-5 mt-1 space-y-1">
                                {currentField.examples.map((example, index) => (
                                    <li key={index} className="text-gray-600">{example}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <p className="font-medium">Suggestions:</p>
                            <button
                                onClick={generateSuggestion}
                                disabled={isGenerating}
                                className="text-blue-500 hover:text-blue-700 disabled:text-gray-400"
                            >
                                {isGenerating ? 'Generating...' : 'Generate Suggestion'}
                            </button>
                        </div>

                        {currentState.suggestions.map((suggestion, index) => (
                            <div key={index} className="flex gap-2 items-start">
                                <button
                                    onClick={() => acceptSuggestion(suggestion)}
                                    className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                                >
                                    Use
                                </button>
                                <div className="flex-1 bg-gray-50 p-3 rounded">
                                    {suggestion}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="border-t pt-4 mt-4">
                        <p className="font-medium mb-2">Or enter your own value:</p>
                        {currentField.type === 'textarea' ? (
                            <textarea
                                value={currentState.value as string}
                                onChange={(e) => enterManualValue(e.target.value)}
                                className="w-full rounded-md border-gray-300 shadow-sm"
                                rows={4}
                            />
                        ) : currentField.type === 'array' ? (
                            <div className="space-y-2">
                                {(currentState.value as string[]).map((item, index) => (
                                    <input
                                        key={index}
                                        type="text"
                                        value={item}
                                        onChange={(e) => {
                                            const newValue = [...(currentState.value as string[])];
                                            newValue[index] = e.target.value;
                                            enterManualValue(newValue);
                                        }}
                                        className="w-full rounded-md border-gray-300 shadow-sm"
                                    />
                                ))}
                                <button
                                    onClick={() => enterManualValue([...(currentState.value as string[]), ''])}
                                    className="text-blue-500 hover:text-blue-700"
                                >
                                    Add Item
                                </button>
                            </div>
                        ) : (
                            <input
                                type={currentField.type}
                                value={currentState.value as string}
                                onChange={(e) => enterManualValue(e.target.value)}
                                className="w-full rounded-md border-gray-300 shadow-sm"
                            />
                        )}
                    </div>

                    <div className="flex justify-between pt-4">
                        <button
                            onClick={() => setCurrentFieldIndex(prev => Math.max(0, prev - 1))}
                            disabled={currentFieldIndex === 0}
                            className="text-blue-500 hover:text-blue-700 disabled:text-gray-400"
                        >
                            Previous Field
                        </button>
                        <button
                            onClick={() => {
                                if (currentFieldIndex < form.fields.length - 1) {
                                    setCurrentFieldIndex(prev => prev + 1);
                                } else {
                                    const values = Object.entries(fieldStates).reduce((acc, [id, state]) => ({
                                        ...acc,
                                        [id]: state.value
                                    }), {});
                                    onComplete(values);
                                }
                            }}
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                        >
                            {currentFieldIndex < form.fields.length - 1 ? 'Next Field' : 'Complete'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
} 