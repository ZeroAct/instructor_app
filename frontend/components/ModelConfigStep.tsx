'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ModelConfig, ModelParameter } from '@/types/schema';
import { validateModel } from '@/lib/api';

interface ModelConfigStepProps {
  config: ModelConfig;
  setConfig: (config: ModelConfig) => void;
  onNext: () => void;
}

// Provider-specific default parameters
const PROVIDER_DEFAULTS: Record<string, ModelParameter[]> = {
  openai: [
    { key: 'temperature', value: 0.7, type: 'number' },
    { key: 'top_p', value: 1, type: 'number' },
  ],
  litellm: [
    { key: 'temperature', value: 0.7, type: 'number' },
    { key: 'top_p', value: 1, type: 'number' },
  ],
  ollama: [
    { key: 'temperature', value: 0.7, type: 'number' },
    { key: 'top_p', value: 1, type: 'number' },
  ],
};

export default function ModelConfigStep({
  config,
  setConfig,
  onNext,
}: ModelConfigStepProps) {
  const t = useTranslations('modelConfigStep');
  const [localConfig, setLocalConfig] = useState<ModelConfig>(config);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; message: string } | null>(null);

  // Sync localConfig with config prop when it changes
  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

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

  const handleProviderChange = (provider: 'openai' | 'litellm' | 'ollama') => {
    const newConfig = {
      ...localConfig,
      provider,
      parameters: PROVIDER_DEFAULTS[provider] || [],
    };
    setLocalConfig(newConfig);
    setConfig(newConfig);
    setValidationResult(null);
  };

  const handleAddParameter = () => {
    const newConfig = {
      ...localConfig,
      parameters: [
        ...localConfig.parameters,
        { key: '', value: '', type: 'string' as 'string' | 'number' },
      ],
    };
    setLocalConfig(newConfig);
    setConfig(newConfig);
  };

  const handleRemoveParameter = (index: number) => {
    const newConfig = {
      ...localConfig,
      parameters: localConfig.parameters.filter((_, i) => i !== index),
    };
    setLocalConfig(newConfig);
    setConfig(newConfig);
  };

  const handleParameterChange = (
    index: number,
    field: 'key' | 'value' | 'type',
    value: any
  ) => {
    const newParams = [...localConfig.parameters];
    if (field === 'type') {
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
    const newConfig = { ...localConfig, parameters: newParams };
    setLocalConfig(newConfig);
    setConfig(newConfig);
  };

  const handleConfigChange = (updates: Partial<ModelConfig>) => {
    const newConfig = { ...localConfig, ...updates };
    setLocalConfig(newConfig);
    setConfig(newConfig);
  };

  const handleNext = () => {
    setConfig(localConfig);
    onNext();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">⚙️ {t('title')}</h2>
      </div>

      <div className="bg-blue-50 border-l-4 border-purple-600 p-3 rounded">
        <p className="text-sm text-gray-700">
          <strong className="text-purple-600">{t('quickStart')}</strong> {t('quickStartText')}
        </p>
      </div>

      {/* Provider Section */}
      <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('provider')}</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('provider')}
            </label>
            <select
              value={localConfig.provider}
              onChange={(e) => handleProviderChange(e.target.value as any)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            >
              <option value="openai">OpenAI</option>
              <option value="litellm">LiteLLM</option>
              <option value="ollama">Ollama</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('baseUrl')}
            </label>
            <input
              type="text"
              value={localConfig.baseUrl || ''}
              onChange={(e) => handleConfigChange({ baseUrl: e.target.value || undefined })}
              placeholder={t('baseUrlPlaceholder')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('model')}
            </label>
            <input
              type="text"
              value={localConfig.model || ''}
              onChange={(e) => handleConfigChange({ model: e.target.value || undefined })}
              placeholder={t('modelPlaceholder')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('apiKey')}
            </label>
            <input
              type="password"
              value={localConfig.apiKey || ''}
              onChange={(e) => handleConfigChange({ apiKey: e.target.value || undefined })}
              placeholder={t('apiKeyPlaceholder')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Parameters Section */}
      <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-gray-900">{t('parameters')}</h3>
          <button
            onClick={handleAddParameter}
            className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            + {t('addParameter')}
          </button>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {localConfig.parameters.map((param, index) => (
            <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex justify-between items-start mb-3">
                <span className="text-sm font-semibold text-gray-700">{t('parameterKey')} {index + 1}</span>
                <button
                  onClick={() => handleRemoveParameter(index)}
                  className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                >
                  {t('remove')}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <input
                  type="text"
                  value={param.key}
                  onChange={(e) => handleParameterChange(index, 'key', e.target.value)}
                  placeholder={t('parameterKey')}
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
                  placeholder={t('parameterValue')}
                  step={param.type === 'number' ? '0.1' : undefined}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent text-sm"
                />
              </div>
            </div>
          ))}

          {localConfig.parameters.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {t('noParameters')}
            </div>
          )}
        </div>
      </div>

      {/* Model Validation Section */}
      <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('validation')}</h3>
        <p className="text-sm text-gray-600 mb-4">
          {t('validationDesc')}
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
          {isValidating ? `🔄 ${t('validating')}` : `✓ ${t('validateModel')}`}
        </button>

        {validationResult && (
          <div className={`mt-3 p-3 rounded-lg ${
            validationResult.valid 
              ? 'bg-green-100 border border-green-300 text-green-800'
              : 'bg-red-100 border border-red-300 text-red-800'
          }`}>
            <div className="font-semibold mb-1">
              {validationResult.valid ? `✓ ${t('validationSuccess')}` : `✗ ${t('validationError')}`}
            </div>
            <div className="text-sm">{validationResult.message}</div>
          </div>
        )}
      </div>

      <div className="flex justify-end pt-3">
        <button
          onClick={handleNext}
          className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
        >
          {t('nextSchema')} →
        </button>
      </div>
    </div>
  );
}
