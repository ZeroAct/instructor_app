'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { SchemaDefinition, ModelConfig } from '@/types/schema';
import StepIndicator from './StepIndicator';
import SchemaStep from './SchemaStep';
import PromptStep from './PromptStep';
import ResultsStep from './ResultsStep';
import SettingsDialog from './SettingsDialog';
import LanguageSwitcher from './LanguageSwitcher';

const STORAGE_KEYS = {
  SCHEMA: 'instructor_app_schema',
  MODEL_CONFIG: 'instructor_app_model_config',
  PROMPT: 'instructor_app_prompt',
  PROMPT_PREFIX: 'instructor_app_prompt_prefix',
  EXTRACT_LIST: 'instructor_app_extract_list',
};

const DEFAULT_SCHEMA: SchemaDefinition = {
  name: 'UserProfile',
  description: 'A user profile with basic information',
  fields: [
    {
      name: 'name',
      type: 'str',
      description: "User's full name",
      required: true,
    },
  ],
};

const DEFAULT_MODEL_CONFIG: ModelConfig = {
  provider: 'openai',
  model: undefined,
  apiKey: undefined,
  parameters: [
    { key: 'temperature', value: 0.7, type: 'number' },
  ],
};

const DEFAULT_PROMPT_PREFIX = 'Extract user profile information from the following text:';
const DEFAULT_PROMPT = 'John Doe is a 30 year old software engineer living in San Francisco.';

export default function InstructorApp() {
  const t = useTranslations();
  const [currentStep, setCurrentStep] = useState(1);
  const [schema, setSchema] = useState<SchemaDefinition>(DEFAULT_SCHEMA);
  const [modelConfig, setModelConfig] = useState<ModelConfig>(DEFAULT_MODEL_CONFIG);
  const [promptPrefix, setPromptPrefix] = useState(DEFAULT_PROMPT_PREFIX);
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [result, setResult] = useState<any>(null);
  const [extractList, setExtractList] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedSchema = localStorage.getItem(STORAGE_KEYS.SCHEMA);
      if (savedSchema) {
        setSchema(JSON.parse(savedSchema));
      }

      const savedModelConfig = localStorage.getItem(STORAGE_KEYS.MODEL_CONFIG);
      if (savedModelConfig) {
        setModelConfig(JSON.parse(savedModelConfig));
      }

      const savedPromptPrefix = localStorage.getItem(STORAGE_KEYS.PROMPT_PREFIX);
      if (savedPromptPrefix) {
        setPromptPrefix(savedPromptPrefix);
      }

      const savedPrompt = localStorage.getItem(STORAGE_KEYS.PROMPT);
      if (savedPrompt) {
        setPrompt(savedPrompt);
      }

      const savedExtractList = localStorage.getItem(STORAGE_KEYS.EXTRACT_LIST);
      if (savedExtractList) {
        setExtractList(JSON.parse(savedExtractList));
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
    // Mark as initialized after loading from localStorage
    setIsInitialized(true);
  }, []);

  // Save to localStorage whenever values change (but not on initial mount)
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(STORAGE_KEYS.SCHEMA, JSON.stringify(schema));
    } catch (error) {
      console.error('Error saving schema to localStorage:', error);
    }
  }, [schema, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(STORAGE_KEYS.MODEL_CONFIG, JSON.stringify(modelConfig));
    } catch (error) {
      console.error('Error saving model config to localStorage:', error);
    }
  }, [modelConfig, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(STORAGE_KEYS.PROMPT_PREFIX, promptPrefix);
    } catch (error) {
      console.error('Error saving prompt prefix to localStorage:', error);
    }
  }, [promptPrefix, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(STORAGE_KEYS.PROMPT, prompt);
    } catch (error) {
      console.error('Error saving prompt to localStorage:', error);
    }
  }, [prompt, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(STORAGE_KEYS.EXTRACT_LIST, JSON.stringify(extractList));
    } catch (error) {
      console.error('Error saving extract list to localStorage:', error);
    }
  }, [extractList, isInitialized]);

  const steps = [
    { number: 1, title: t('steps.schema.title'), description: t('steps.schema.description') },
    { number: 2, title: t('steps.prompt.title'), description: t('steps.prompt.description') },
    { number: 3, title: t('steps.results.title'), description: t('steps.results.description') },
  ];

  const handleNext = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">🎓 {t('header.title')}</h1>
            <p className="text-purple-100 text-sm">{t('header.subtitle')}</p>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition flex items-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {t('header.settings')}
            </button>
          </div>
        </div>
      </header>

      {/* Settings Dialog */}
      <SettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={modelConfig}
        setConfig={setModelConfig}
      />

      {/* Step Indicator */}
      <div className="container mx-auto px-4 py-4">
        <StepIndicator steps={steps} currentStep={currentStep} />
      </div>

      {/* Main Content - Wide View */}
      <div className="container mx-auto px-4 pb-8">
        <div className="bg-white rounded-2xl shadow-xl p-6">
          {currentStep === 1 && (
            <SchemaStep
              schema={schema}
              setSchema={setSchema}
              setPrompt={setPrompt}
              setPromptPrefix={setPromptPrefix}
              onNext={handleNext}
            />
          )}
          {currentStep === 2 && (
            <PromptStep
              prompt={prompt}
              setPrompt={setPrompt}
              promptPrefix={promptPrefix}
              setPromptPrefix={setPromptPrefix}
              extractList={extractList}
              setExtractList={setExtractList}
              schema={schema}
              modelConfig={modelConfig}
              onNext={(resultData) => {
                setResult(resultData);
                handleNext();
              }}
              onPrevious={handlePrevious}
            />
          )}
          {currentStep === 3 && (
            <ResultsStep
              result={result}
              schema={schema}
              onPrevious={handlePrevious}
              onReset={() => {
                setCurrentStep(1);
                setResult(null);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
