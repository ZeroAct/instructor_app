'use client';

import { useState } from 'react';
import { SchemaDefinition, ModelConfig } from '@/types/schema';
import { runCompletion } from '@/lib/api';

interface PromptStepProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  extractList: boolean;
  setExtractList: (value: boolean) => void;
  schema: SchemaDefinition;
  modelConfig: ModelConfig;
  onNext: (result: any) => void;
  onPrevious: () => void;
}

export default function PromptStep({
  prompt,
  setPrompt,
  extractList,
  setExtractList,
  schema,
  modelConfig,
  onNext,
  onPrevious,
}: PromptStepProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRun = async () => {
    setIsRunning(true);
    setError(null);

    try {
      // Build request with dynamic parameters from config
      const requestParams: any = {
        schema_def: schema,
        messages: [{ role: 'user', content: prompt }],
        provider: modelConfig.provider,
        model: modelConfig.model,
        api_key: modelConfig.apiKey,
        base_url: modelConfig.baseUrl,
        stream: false,
        extract_list: extractList,
      };

      // Add custom parameters from model config
      modelConfig.parameters.forEach((param) => {
        requestParams[param.key] = param.value;
      });

      const result = await runCompletion(requestParams);

      onNext(result.result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">✍️ Prompt Input</h2>

      <div className="bg-blue-50 border-l-4 border-purple-600 p-3 rounded">
        <p className="text-sm text-gray-700">
          <strong className="text-purple-600">Enter your text:</strong> Provide the text from which you want to extract structured data based on your schema.
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Prompt / Input Text
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={8}
          placeholder="Enter your prompt or text to extract data from..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent font-mono text-sm"
        />
        <p className="mt-1.5 text-xs text-gray-500">
          The LLM will extract structured data from this text according to your schema
        </p>
      </div>

      <div>
        <label className="inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={extractList}
            onChange={(e) => setExtractList(e.target.checked)}
            className="mr-2 h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-600"
          />
          <span className="text-sm font-semibold text-gray-700">
            Extract as List (multiple instances)
          </span>
        </label>
        <p className="ml-6 text-xs text-gray-500">
          Enable this to extract multiple objects instead of a single object
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-lg text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="flex justify-between pt-3">
        <button
          onClick={onPrevious}
          className="px-4 py-2 text-sm bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
        >
          ← Previous: Schema
        </button>
        <button
          onClick={handleRun}
          disabled={isRunning || !prompt.trim()}
          className="px-5 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isRunning ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Running...
            </>
          ) : (
            '▶️ Run Completion'
          )}
        </button>
      </div>
    </div>
  );
}
