import { SchemaDefinition, CompletionRequest, CompletionResult, ModelConfig } from '@/types/schema';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function validateSchema(schema: SchemaDefinition) {
  const response = await fetch(`${API_BASE_URL}/api/schema/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(schema),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to validate schema');
  }

  return response.json();
}

export async function validateModel(config: ModelConfig) {
  // Build request with model config
  const requestParams: any = {
    schema_def: {
      name: "TestValidation",
      description: "Test schema",
      fields: []
    },
    messages: [],
    provider: config.provider,
    model: config.model,
    api_key: config.apiKey,
    base_url: config.baseUrl,
    stream: false,
    extract_list: false,
  };

  // Add custom parameters from model config
  config.parameters.forEach((param) => {
    requestParams[param.key] = param.value;
  });

  const response = await fetch(`${API_BASE_URL}/api/model/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestParams),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to validate model');
  }

  return response.json();
}

export async function runCompletion(request: CompletionRequest): Promise<CompletionResult> {
  const response = await fetch(`${API_BASE_URL}/api/completion`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to run completion');
  }

  return response.json();
}

export async function exportResult(data: any, format: 'json' | 'markdown', title: string) {
  const response = await fetch(`${API_BASE_URL}/api/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data, format, title }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to export result');
  }

  return response.json();
}

export async function uploadFile(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/api/file/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to upload file');
  }

  return response.json();
}

export async function getFileUploadConfig() {
  const response = await fetch(`${API_BASE_URL}/api/file/config`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get file upload config');
  }

  return response.json();
}
