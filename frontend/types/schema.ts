export interface SchemaField {
  name: string;
  type: 'str' | 'int' | 'float' | 'bool' | 'list' | 'nested';
  description: string;
  required: boolean;
  nested_schema?: NestedSchema;
}

export interface NestedSchema {
  name: string;
  description: string;
  fields: NestedSchemaField[];
}

export interface NestedSchemaField {
  name: string;
  type: 'str' | 'int' | 'float' | 'bool' | 'list';
  description: string;
  required: boolean;
}

export interface SchemaDefinition {
  name: string;
  description: string;
  fields: SchemaField[];
}

export interface ModelParameter {
  key: string;
  value: string | number;
  type: 'string' | 'number';
}

export interface ModelConfig {
  provider: 'openai' | 'litellm' | 'ollama';
  model?: string;
  apiKey?: string;
  baseUrl?: string;
  parameters: ModelParameter[];
}

export interface CompletionRequest {
  schema_def: SchemaDefinition;
  messages: { role: string; content: string }[];
  provider: string;
  model?: string;
  api_key?: string;
  temperature?: number;
  stream?: boolean;
  extract_list?: boolean;
  [key: string]: any; // Allow dynamic parameters
}

export interface CompletionResult {
  result: any;
}
