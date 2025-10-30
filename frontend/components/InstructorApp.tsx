'use client';

import { useState, useEffect } from 'react';
import { SchemaDefinition, ModelConfig } from '@/types/schema';
import StepIndicator from './StepIndicator';
import SchemaStep from './SchemaStep';
import ModelConfigStep from './ModelConfigStep';
import PromptStep from './PromptStep';
import ResultsStep from './ResultsStep';

const STORAGE_KEYS = {
  SCHEMA: 'instructor_app_schema',
  MODEL_CONFIG: 'instructor_app_model_config',
  PROMPT: 'instructor_app_prompt',
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
  temperature: 0.7,
  maxTokens: 1000,
};

const DEFAULT_PROMPT = 'Extract user profile information from the following text: John Doe is a 30 year old software engineer living in San Francisco.';

export default function InstructorApp() {
  const [currentStep, setCurrentStep] = useState(1);
  const [schema, setSchema] = useState<SchemaDefinition>(DEFAULT_SCHEMA);
  const [modelConfig, setModelConfig] = useState<ModelConfig>(DEFAULT_MODEL_CONFIG);
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [result, setResult] = useState<any>(null);
  const [extractList, setExtractList] = useState(false);

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
  }, []);

  // Save to localStorage whenever values change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SCHEMA, JSON.stringify(schema));
    } catch (error) {
      console.error('Error saving schema to localStorage:', error);
    }
  }, [schema]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MODEL_CONFIG, JSON.stringify(modelConfig));
    } catch (error) {
      console.error('Error saving model config to localStorage:', error);
    }
  }, [modelConfig]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PROMPT, prompt);
    } catch (error) {
      console.error('Error saving prompt to localStorage:', error);
    }
  }, [prompt]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.EXTRACT_LIST, JSON.stringify(extractList));
    } catch (error) {
      console.error('Error saving extract list to localStorage:', error);
    }
  }, [extractList]);

  const steps = [
    { number: 1, title: 'Schema', description: 'Define data structure' },
    { number: 2, title: 'Model', description: 'Configure LLM' },
    { number: 3, title: 'Prompt', description: 'Input text' },
    { number: 4, title: 'Results', description: 'View output' },
  ];

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">🎓 Instructor App</h1>
          <p className="text-purple-100 mt-1">Structured LLM Outputs with Dynamic Schemas</p>
        </div>
      </header>

      {/* Step Indicator */}
      <div className="container mx-auto px-4 py-8">
        <StepIndicator steps={steps} currentStep={currentStep} />
      </div>

      {/* Main Content - Wide View */}
      <div className="container mx-auto px-4 pb-12">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {currentStep === 1 && (
            <SchemaStep
              schema={schema}
              setSchema={setSchema}
              onNext={handleNext}
            />
          )}
          {currentStep === 2 && (
            <ModelConfigStep
              config={modelConfig}
              setConfig={setModelConfig}
              onNext={handleNext}
              onPrevious={handlePrevious}
            />
          )}
          {currentStep === 3 && (
            <PromptStep
              prompt={prompt}
              setPrompt={setPrompt}
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
          {currentStep === 4 && (
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
