'use client';

import { ModelConfig } from '@/types/schema';

interface ModelConfigStepProps {
  config: ModelConfig;
  setConfig: (config: ModelConfig) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export default function ModelConfigStep({
  config,
  setConfig,
  onNext,
  onPrevious,
}: ModelConfigStepProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">⚙️ Model Configuration</h2>

      <div className="bg-blue-50 border-l-4 border-purple-600 p-4 rounded">
        <p className="text-sm text-gray-700">
          <strong className="text-purple-600">Configure your LLM:</strong> Select the provider and model settings. Leave API key empty to use environment variables.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Provider
          </label>
          <select
            value={config.provider}
            onChange={(e) => setConfig({ ...config, provider: e.target.value as any })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
          >
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
          </select>
          <p className="mt-1 text-sm text-gray-500">Choose your LLM provider</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Model (Optional)
          </label>
          <input
            type="text"
            value={config.model || ''}
            onChange={(e) => setConfig({ ...config, model: e.target.value || undefined })}
            placeholder="Leave empty for default (e.g., gpt-4, claude-3-opus)"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
          />
          <p className="mt-1 text-sm text-gray-500">
            Defaults: gpt-4 for OpenAI, claude-3-opus for Anthropic
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            API Key (Optional)
          </label>
          <input
            type="password"
            value={config.apiKey || ''}
            onChange={(e) => setConfig({ ...config, apiKey: e.target.value || undefined })}
            placeholder="Leave empty to use environment variable"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
          />
          <p className="mt-1 text-sm text-gray-500">
            If not provided, will use OPENAI_API_KEY or ANTHROPIC_API_KEY from environment
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Temperature
            </label>
            <input
              type="number"
              min="0"
              max="2"
              step="0.1"
              value={config.temperature}
              onChange={(e) =>
                setConfig({ ...config, temperature: parseFloat(e.target.value) })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            />
            <p className="mt-1 text-sm text-gray-500">
              0 = deterministic, 2 = creative (default: 0.7)
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Max Tokens
            </label>
            <input
              type="number"
              min="1"
              max="4000"
              value={config.maxTokens}
              onChange={(e) =>
                setConfig({ ...config, maxTokens: parseInt(e.target.value) })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            />
            <p className="mt-1 text-sm text-gray-500">
              Maximum tokens in response (default: 1000)
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <button
          onClick={onPrevious}
          className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
        >
          ← Previous: Schema
        </button>
        <button
          onClick={onNext}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
        >
          Next: Enter Prompt →
        </button>
      </div>
    </div>
  );
}
