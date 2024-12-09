import { Form, AnyFormField } from '../types/form';
import { useState } from 'react';
import SmartFill from './SmartFill';

interface FormPreviewProps {
    form: Form;
}

interface ArrayFieldState {
    [fieldId: string]: string[];
}

export default function FormPreview({ form }: FormPreviewProps) {
    const [arrayValues, setArrayValues] = useState<ArrayFieldState>({});
    const [initialValues, setInitialValues] = useState<{ [fieldId: string]: string }>({});
    const [showSmartFill, setShowSmartFill] = useState(false);

    const addArrayItem = (fieldId: string, isInitial: boolean = false) => {
        const valueToAdd = isInitial ? initialValues[fieldId] || '' : '';
        setArrayValues(prev => ({
            ...prev,
            [fieldId]: [...(prev[fieldId] || []), valueToAdd]
        }));

        if (isInitial) {
            setInitialValues(prev => ({
                ...prev,
                [fieldId]: ''
            }));
        }
    };

    const removeArrayItem = (fieldId: string, index: number) => {
        setArrayValues(prev => ({
            ...prev,
            [fieldId]: prev[fieldId].filter((_, i) => i !== index)
        }));
    };

    const updateArrayItem = (fieldId: string, index: number, value: string) => {
        setArrayValues(prev => ({
            ...prev,
            [fieldId]: prev[fieldId].map((item, i) => i === index ? value : item)
        }));
    };

    const handleInitialValueChange = (fieldId: string, value: string) => {
        setInitialValues(prev => ({
            ...prev,
            [fieldId]: value
        }));
    };

    const handleSmartFillComplete = (values: { [key: string]: string | string[] }) => {
        Object.entries(values).forEach(([fieldId, value]) => {
            if (Array.isArray(value)) {
                setArrayValues(prev => ({
                    ...prev,
                    [fieldId]: value
                }));
            }
        });
        setShowSmartFill(false);
    };

    const renderExamples = (field: AnyFormField) => {
        if (field.type === 'array') {
            const arrayExamples = field.examples as string[][];
            return arrayExamples.map((exampleArray: string[], index: number) => (
                <div key={index} className="text-sm text-gray-500">
                    <ul className="list-disc pl-5 mt-1 space-y-1">
                        {exampleArray.map((example: string, subIndex: number) => (
                            <li key={`${index}-${subIndex}`}>{example}</li>
                        ))}
                    </ul>
                </div>
            ));
        }

        const simpleExamples = field.examples as string[];
        return (
            <ul className="list-disc pl-5 mt-1 space-y-1">
                {simpleExamples.map((example: string, index: number) => (
                    <li key={index}>{example}</li>
                ))}
            </ul>
        );
    };

    return (
        <div className="border p-4 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Form Preview</h2>
                <button
                    onClick={() => setShowSmartFill(true)}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                    Smart Fill
                </button>
            </div>
            <form className="space-y-4">
                {form.fields.map((field: AnyFormField) => (
                    <div key={field.id} className="space-y-2">
                        <label className="block text-sm font-medium">
                            {field.name}
                            {field.required && <span className="text-red-500">*</span>}
                        </label>

                        {field.description && (
                            <p className="text-sm text-gray-500">{field.description}</p>
                        )}

                        {field.type === 'textarea' ? (
                            <textarea
                                placeholder={field.placeholder}
                                required={field.required}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            />
                        ) : field.type === 'select' ? (
                            <select
                                required={field.required}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            >
                                <option value="">Select an option</option>
                                {field.examples.map((example: string, index: number) => (
                                    <option key={index} value={example}>
                                        {example}
                                    </option>
                                ))}
                            </select>
                        ) : field.type === 'array' ? (
                            <div className="space-y-2">
                                {/* Initial input when no array exists */}
                                {!arrayValues[field.id] && (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder={field.placeholder}
                                            value={initialValues[field.id] || ''}
                                            onChange={(e) => handleInitialValueChange(field.id, e.target.value)}
                                            className="flex-1 rounded-md border-gray-300 shadow-sm"
                                            required={field.required}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => addArrayItem(field.id, true)}
                                            className="text-blue-500 hover:text-blue-700"
                                        >
                                            Add
                                        </button>
                                    </div>
                                )}

                                {/* Array items */}
                                {arrayValues[field.id]?.map((value, index) => (
                                    <div key={index} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={value}
                                            onChange={(e) => updateArrayItem(field.id, index, e.target.value)}
                                            className="flex-1 rounded-md border-gray-300 shadow-sm"
                                            required={field.required && index === 0}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeArrayItem(field.id, index)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}

                                {/* Add button for existing arrays */}
                                {arrayValues[field.id] && (
                                    <button
                                        type="button"
                                        onClick={() => addArrayItem(field.id)}
                                        className="text-sm text-blue-500 hover:text-blue-700"
                                    >
                                        Add Another
                                    </button>
                                )}
                            </div>
                        ) : (
                            <input
                                type={field.type}
                                placeholder={field.placeholder}
                                required={field.required}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            />
                        )}

                        {renderExamples(field)}
                    </div>
                ))}

                {form.fields.length > 0 && (
                    <button
                        type="submit"
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                        Submit
                    </button>
                )}
            </form>

            {showSmartFill && (
                <SmartFill
                    form={form}
                    onComplete={handleSmartFillComplete}
                    onCancel={() => setShowSmartFill(false)}
                />
            )}
        </div>
    );
} 