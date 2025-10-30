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

  const addNestedField = (parentIndex: number) => {
    const field = schema.fields[parentIndex];
    if (!field.nested_schema) {
      field.nested_schema = {
        name: `${field.name || 'Nested'}Schema`,
        description: '',
        fields: [],
      };
    }
    
    field.nested_schema.fields.push({
      name: '',
      type: 'str',
      description: '',
      required: true,
    });
    
    updateField(parentIndex, { nested_schema: field.nested_schema });
  };

  const removeNestedField = (parentIndex: number, nestedIndex: number) => {
    const field = schema.fields[parentIndex];
    if (field.nested_schema) {
      field.nested_schema.fields = field.nested_schema.fields.filter((_, i) => i !== nestedIndex);
      updateField(parentIndex, { nested_schema: field.nested_schema });
    }
  };

  const updateNestedField = (parentIndex: number, nestedIndex: number, updates: any) => {
    const field = schema.fields[parentIndex];
    if (field.nested_schema) {
      field.nested_schema.fields[nestedIndex] = {
        ...field.nested_schema.fields[nestedIndex],
        ...updates,
      };
      updateField(parentIndex, { nested_schema: field.nested_schema });
    }
  };

  const updateNestedSchemaInfo = (parentIndex: number, updates: { name?: string; description?: string }) => {
    const field = schema.fields[parentIndex];
    if (field.nested_schema) {
      field.nested_schema = { ...field.nested_schema, ...updates };
      updateField(parentIndex, { nested_schema: field.nested_schema });
    }
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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">📋 Schema Definition</h2>
        <div className="flex gap-2">
          <label className="px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition cursor-pointer">
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
            className="px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition"
          >
            📤 Export
          </button>
        </div>
      </div>

      <div className="bg-blue-50 border-l-4 border-purple-600 p-3 rounded">
        <p className="text-sm text-gray-700">
          <strong className="text-purple-600">Quick Start:</strong> Define the fields you want to extract from your text. You can import an existing schema or build one from scratch.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Schema Name
          </label>
          <input
            type="text"
            value={schema.name}
            onChange={(e) => setSchema({ ...schema, name: e.target.value })}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            placeholder="e.g., UserProfile"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Schema Description
          </label>
          <input
            type="text"
            value={schema.description}
            onChange={(e) => setSchema({ ...schema, description: e.target.value })}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            placeholder="Describe your schema..."
          />
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-semibold text-gray-700">Fields</label>
          <button
            onClick={addField}
            className="px-3 py-1 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            + Add Field
          </button>
        </div>

        <div className="space-y-2 max-h-80 overflow-y-auto">
          {schema.fields.map((field, index) => (
            <div key={index} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div className="flex justify-between items-start mb-2">
                <span className="font-semibold text-sm text-gray-700">Field {index + 1}</span>
                <button
                  onClick={() => removeField(index)}
                  className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                >
                  Remove
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  value={field.name}
                  onChange={(e) => updateField(index, { name: e.target.value })}
                  placeholder="Field name"
                  className="px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent text-sm"
                />
                <select
                  value={field.type}
                  onChange={(e) => {
                    const newType = e.target.value as any;
                    if (newType === 'nested' && !field.nested_schema) {
                      updateField(index, { 
                        type: newType,
                        nested_schema: {
                          name: `${field.name || 'Nested'}Schema`,
                          description: '',
                          fields: [],
                        }
                      });
                    } else {
                      updateField(index, { type: newType });
                    }
                  }}
                  className="px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent text-sm"
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
                  className="px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent text-sm"
                />
              </div>
              <div className="mt-1.5">
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) => updateField(index, { required: e.target.checked })}
                    className="mr-2 h-3.5 w-3.5 text-purple-600 border-gray-300 rounded focus:ring-purple-600"
                  />
                  <span className="text-sm text-gray-700">Required</span>
                </label>
              </div>

              {/* Nested Schema Section */}
              {field.type === 'nested' && (
                <div className="mt-2 p-2.5 bg-purple-50 border-2 border-dashed border-purple-300 rounded-lg">
                  <div className="mb-2">
                    <input
                      type="text"
                      value={field.nested_schema?.name || ''}
                      onChange={(e) => updateNestedSchemaInfo(index, { name: e.target.value })}
                      placeholder="Nested schema name"
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent text-sm font-semibold mb-1.5"
                    />
                    <input
                      type="text"
                      value={field.nested_schema?.description || ''}
                      onChange={(e) => updateNestedSchemaInfo(index, { description: e.target.value })}
                      placeholder="Nested schema description"
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent text-sm"
                    />
                  </div>

                  <div className="space-y-1.5 mb-2">
                    {field.nested_schema?.fields.map((nestedField, nestedIndex) => (
                      <div key={nestedIndex} className="bg-white p-2 rounded border border-gray-200">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-xs font-semibold text-gray-600">
                            Nested Field {nestedIndex + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeNestedField(index, nestedIndex)}
                            className="px-1.5 py-0.5 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5 mb-1.5">
                          <input
                            type="text"
                            value={nestedField.name}
                            onChange={(e) => updateNestedField(index, nestedIndex, { name: e.target.value })}
                            placeholder="Field name"
                            className="px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                          />
                          <select
                            value={nestedField.type}
                            onChange={(e) => updateNestedField(index, nestedIndex, { type: e.target.value })}
                            className="px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                          >
                            <option value="str">String</option>
                            <option value="int">Integer</option>
                            <option value="float">Float</option>
                            <option value="bool">Boolean</option>
                            <option value="list">List</option>
                          </select>
                          <input
                            type="text"
                            value={nestedField.description}
                            onChange={(e) => updateNestedField(index, nestedIndex, { description: e.target.value })}
                            placeholder="Description"
                            className="px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                          />
                        </div>
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={nestedField.required}
                            onChange={(e) => updateNestedField(index, nestedIndex, { required: e.target.checked })}
                            className="mr-1.5 h-3 w-3 text-purple-600 border-gray-300 rounded focus:ring-purple-600"
                          />
                          <span className="text-xs text-gray-700">Required</span>
                        </label>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => addNestedField(index)}
                    className="px-2.5 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition"
                  >
                    + Add Nested Field
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {validationMessage && (
        <div
          className={`p-3 rounded-lg ${
            validationMessage.startsWith('✓')
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {validationMessage}
        </div>
      )}

      <div className="flex justify-between pt-3">
        <button
          onClick={handleValidate}
          disabled={isValidating}
          className="px-4 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50"
        >
          {isValidating ? 'Validating...' : 'Validate Schema'}
        </button>
        <button
          onClick={onNext}
          className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
        >
          Next: Enter Prompt →
        </button>
      </div>
    </div>
  );
}
