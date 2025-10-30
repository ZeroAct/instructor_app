'use client';

import { useState } from 'react';
import { SchemaDefinition, SchemaField } from '@/types/schema';
import { validateSchema } from '@/lib/api';

interface SchemaStepProps {
  schema: SchemaDefinition;
  setSchema: (schema: SchemaDefinition) => void;
  onNext: () => void;
}

export default function SchemaStep({ schema, setSchema, onNext }: SchemaStepProps) {
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const addField = () => {
    setSchema({
      ...schema,
      fields: [
        ...schema.fields,
        { name: '', type: 'str', description: '', required: true },
      ],
    });
  };

  const removeField = (index: number) => {
    setSchema({
      ...schema,
      fields: schema.fields.filter((_, i) => i !== index),
    });
  };

  const updateField = (index: number, field: Partial<SchemaField>) => {
    const newFields = [...schema.fields];
    newFields[index] = { ...newFields[index], ...field };
    setSchema({ ...schema, fields: newFields });
  };

  const handleValidate = async () => {
    setIsValidating(true);
    setValidationMessage(null);
    try {
      await validateSchema(schema);
      setValidationMessage('✓ Schema is valid!');
    } catch (error: any) {
      setValidationMessage(`✗ ${error.message}`);
    } finally {
      setIsValidating(false);
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(schema, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `${schema.name || 'schema'}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target?.result as string);
          setSchema(imported);
          setValidationMessage('✓ Schema imported successfully!');
        } catch (error) {
          setValidationMessage('✗ Failed to import schema: Invalid JSON');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">📋 Schema Definition</h2>
        <div className="flex gap-2">
          <label className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition cursor-pointer">
            📥 Import
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition"
          >
            📤 Export
          </button>
        </div>
      </div>

      <div className="bg-blue-50 border-l-4 border-purple-600 p-4 rounded">
        <p className="text-sm text-gray-700">
          <strong className="text-purple-600">Quick Start:</strong> Define the fields you want to extract from your text. You can import an existing schema or build one from scratch.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Schema Name
          </label>
          <input
            type="text"
            value={schema.name}
            onChange={(e) => setSchema({ ...schema, name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            placeholder="e.g., UserProfile"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Schema Description
          </label>
          <input
            type="text"
            value={schema.description}
            onChange={(e) => setSchema({ ...schema, description: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            placeholder="Describe your schema..."
          />
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="block text-sm font-semibold text-gray-700">Fields</label>
          <button
            onClick={addField}
            className="px-3 py-1 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            + Add Field
          </button>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {schema.fields.map((field, index) => (
            <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex justify-between items-start mb-3">
                <span className="font-semibold text-gray-700">Field {index + 1}</span>
                <button
                  onClick={() => removeField(index)}
                  className="px-2 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                >
                  Remove
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <input
                  type="text"
                  value={field.name}
                  onChange={(e) => updateField(index, { name: e.target.value })}
                  placeholder="Field name"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent text-sm"
                />
                <select
                  value={field.type}
                  onChange={(e) => updateField(index, { type: e.target.value as any })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent text-sm"
                >
                  <option value="str">String</option>
                  <option value="int">Integer</option>
                  <option value="float">Float</option>
                  <option value="bool">Boolean</option>
                  <option value="list">List</option>
                  <option value="nested">Nested Schema</option>
                </select>
                <input
                  type="text"
                  value={field.description}
                  onChange={(e) => updateField(index, { description: e.target.value })}
                  placeholder="Description"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent text-sm"
                />
              </div>
              <div className="mt-2">
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) => updateField(index, { required: e.target.checked })}
                    className="mr-2 h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-600"
                  />
                  <span className="text-sm text-gray-700">Required</span>
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

      {validationMessage && (
        <div
          className={`p-4 rounded-lg ${
            validationMessage.startsWith('✓')
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {validationMessage}
        </div>
      )}

      <div className="flex justify-between pt-4">
        <button
          onClick={handleValidate}
          disabled={isValidating}
          className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50"
        >
          {isValidating ? 'Validating...' : 'Validate Schema'}
        </button>
        <button
          onClick={onNext}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
        >
          Next: Configure Model →
        </button>
      </div>
    </div>
  );
}
