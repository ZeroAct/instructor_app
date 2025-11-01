'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { SchemaDefinition, ModelConfig } from '@/types/schema';
import { runCompletion } from '@/lib/api';
import FileUpload from './FileUpload';

interface PromptStepProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  promptPrefix: string;
  setPromptPrefix: (prefix: string) => void;
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
  promptPrefix,
  setPromptPrefix,
  extractList,
  setExtractList,
  schema,
  modelConfig,
  onNext,
  onPrevious,
}: PromptStepProps) {
  const t = useTranslations('promptStep');
  const tCommon = useTranslations('common');
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFileUpload, setShowFileUpload] = useState(false);

  const handleFileUploaded = (text: string, filename: string) => {
    // Replace prompt with file content (not append)
    setPrompt(text);
  };

  const handleRun = async () => {
    setIsRunning(true);
    setError(null);

    try {
      // Combine prefix and content for the full prompt
      const fullPrompt = promptPrefix.trim() 
        ? `${promptPrefix.trim()} ${prompt.trim()}`
        : prompt.trim();

      // Build request with dynamic parameters from config
      const requestParams: any = {
        schema_def: schema,
        messages: [{ role: 'user', content: fullPrompt }],
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
      <h2 className="text-xl font-bold text-gray-900">✍️ {t('title')}</h2>

      <div className="bg-blue-50 border-l-4 border-purple-600 p-3 rounded">
        <p className="text-sm text-gray-700">
          <strong className="text-purple-600">{t('enterText')}</strong> {t('enterTextDesc')}
        </p>
      </div>

      <div>
        <div className="flex justify-between items-center mb-1.5">
          <label className="block text-sm font-semibold text-gray-700">
            {t('prefixLabel')}
          </label>
        </div>
        
        <textarea
          value={promptPrefix}
          onChange={(e) => setPromptPrefix(e.target.value)}
          rows={2}
          placeholder={t('prefixPlaceholder')}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent text-sm"
        />
      </div>

      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <label className="block text-sm font-semibold text-gray-700">
            {t('contentLabel')}
          </label>
          {showFileUpload && (
            <FileUpload onFileUploaded={handleFileUploaded} disabled={isRunning} />
          )}
          {!showFileUpload && (
            <button
              type="button"
              onClick={() => setShowFileUpload(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-md transition"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              {t('uploadButton') || 'Upload File'}
            </button>
          )}
        </div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={6}
          placeholder={t('contentPlaceholder')}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent font-mono text-sm"
        />
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
            {t('extractList')}
          </span>
        </label>
        <p className="ml-6 text-xs text-gray-500">
          {t('extractListDesc')}
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-lg text-sm">
          <strong>{tCommon('error')}:</strong> {error}
        </div>
      )}

      <div className="flex justify-between pt-3">
        <button
          onClick={onPrevious}
          className="px-4 py-2 text-sm bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
        >
          ← {t('previous')}
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
              {t('running')}
            </>
          ) : (
            `▶️ ${t('runExtraction')}`
          )}
        </button>
      </div>
    </div>
  );
}
