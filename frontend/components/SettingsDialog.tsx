'use client';

import { useState, useEffect } from 'react';
import { ModelConfig, ModelParameter } from '@/types/schema';
import { validateModel } from '@/lib/api';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  config: ModelConfig;
  setConfig: (config: ModelConfig) => void;
}

// Provider-specific default parameters
const PROVIDER_DEFAULTS: Record<string, ModelParameter[]> = {
  openai: [
    { key: 'temperature', value: 0.7, type: 'number' },
    { key: 'top_p', value: 1, type: 'number' },
  ],
};

export default function SettingsDialog({
  isOpen,
  onClose,
  config,
  setConfig,
}: SettingsDialogProps) {
  const [localConfig, setLocalConfig] = useState<ModelConfig>(config);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; message: string } | null>(null);

  // Sync localConfig with config prop when dialog opens or config changes
  useEffect(() => {
    if (isOpen) {
      setLocalConfig(config);
      setValidationResult(null); // Reset validation when opening
    }
  }, [isOpen, config]);

  if (!isOpen) return null;

  const handleValidateModel = async () => {
    setIsValidating(true);
    setValidationResult(null);
    
    try {
      const result = await validateModel(localConfig);
      setValidationResult({
        valid: result.valid,
        message: result.message,
      });
    } catch (error: any) {
      setValidationResult({
        valid: false,
        message: error.message,
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleProviderChange = (provider: 'openai') => {
    setLocalConfig({
      ...localConfig,
      provider,
      parameters: PROVIDER_DEFAULTS[provider] || [],
    });
    setValidationResult(null); // Reset validation when provider changes
  };

  const handleAddParameter = () => {
    setLocalConfig({
      ...localConfig,
      parameters: [
        ...localConfig.parameters,
        { key: '', value: '', type: 'string' },
      ],
    });
  };

  const handleRemoveParameter = (index: number) => {
    setLocalConfig({
      ...localConfig,
      parameters: localConfig.parameters.filter((_, i) => i !== index),
    });
  };

  const handleParameterChange = (
    index: number,
    field: 'key' | 'value' | 'type',
    value: any
  ) => {
    const newParams = [...localConfig.parameters];
    if (field === 'type') {
      // Convert value when type changes
      newParams[index] = {
        ...newParams[index],
        type: value,
        value: value === 'number' ? Number(newParams[index].value) || 0 : String(newParams[index].value),
      };
    } else if (field === 'value') {
      newParams[index] = {
        ...newParams[index],
        value: newParams[index].type === 'number' ? Number(value) || 0 : value,
      };
    } else {
      newParams[index] = { ...newParams[index], [field]: value };
    }
    setLocalConfig({ ...localConfig, parameters: newParams });
  };

  const handleSave = () => {
    setConfig(localConfig);
    onClose();
  };

  const handleCancel = () => {
    setLocalConfig(config);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">⚙️ Model Settings</h2>
            <button
              onClick={handleCancel}
              className="text-white hover:text-gray-200 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Provider Section */}
          <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Provider Configuration</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Provider
                </label>
                <select
                  value={localConfig.provider}
                  onChange={(e) => handleProviderChange(e.target.value as any)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                >
                  <option value="openai">OpenAI</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Model (Optional)
                </label>
                <input
                  type="text"
                  value={localConfig.model || ''}
                  onChange={(e) => setLocalConfig({ ...localConfig, model: e.target.value || undefined })}
                  placeholder="Leave empty for default (e.g., gpt-4, claude-3-opus)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Defaults: gpt-4 for OpenAI
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  API Key (Optional)
                </label>
                <input
                  type="password"
                  value={localConfig.apiKey || ''}
                  onChange={(e) => setLocalConfig({ ...localConfig, apiKey: e.target.value || undefined })}
                  placeholder="Leave empty to use environment variable"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Uses {localConfig.provider === 'openai' ? 'OPENAI_API_KEY' : undefined} from environment if not provided
                </p>
              </div>
            </div>
          </div>

          {/* Parameters Section */}
          <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-gray-900">Model Parameters</h3>
              <button
                onClick={handleAddParameter}
                className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                + Add Parameter
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Configure provider-specific parameters. Each provider supports different parameters.
            </p>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {localConfig.parameters.map((param, index) => (
                <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-sm font-semibold text-gray-700">Parameter {index + 1}</span>
                    <button
                      onClick={() => handleRemoveParameter(index)}
                      className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                    >
                      Delete
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={param.key}
                      onChange={(e) => handleParameterChange(index, 'key', e.target.value)}
                      placeholder="Parameter name"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent text-sm"
                    />
                    <select
                      value={param.type}
                      onChange={(e) => handleParameterChange(index, 'type', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent text-sm"
                    >
                      <option value="string">String</option>
                      <option value="number">Number</option>
                    </select>
                    <input
                      type={param.type === 'number' ? 'number' : 'text'}
                      value={param.value}
                      onChange={(e) => handleParameterChange(index, 'value', e.target.value)}
                      placeholder="Value"
                      step={param.type === 'number' ? '0.1' : undefined}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
              ))}

              {localConfig.parameters.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No parameters configured. Click "Add Parameter" to add one.
                </div>
              )}
            </div>
          </div>

          {/* Model Validation Section */}
          <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Model Validation</h3>
            <p className="text-sm text-gray-600 mb-4">
              Test your model configuration with a dummy request to verify it works correctly.
            </p>
            
            <button
              onClick={handleValidateModel}
              disabled={isValidating}
              className={`w-full px-4 py-2.5 rounded-lg font-semibold transition ${
                isValidating
                  ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isValidating ? '🔄 Validating...' : '✓ Validate Model Configuration'}
            </button>

            {validationResult && (
              <div className={`mt-3 p-3 rounded-lg ${
                validationResult.valid 
                  ? 'bg-green-100 border border-green-300 text-green-800'
                  : 'bg-red-100 border border-red-300 text-red-800'
              }`}>
                <div className="font-semibold mb-1">
                  {validationResult.valid ? '✓ Validation Successful' : '✗ Validation Failed'}
                </div>
                <div className="text-sm">{validationResult.message}</div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-between gap-3">
          <div>
            {validationResult?.valid && (
              <span className="text-green-600 text-sm font-semibold">
                ✓ Model validated - Ready to use
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="px-6 py-2.5 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
