import { SchemaDefinition, CompletionRequest, CompletionResult } from '@/types/schema';

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
