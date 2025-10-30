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

export interface ModelConfig {
  provider: 'openai' | 'anthropic';
  model?: string;
  apiKey?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface CompletionRequest {
  schema_def: SchemaDefinition;
  messages: { role: string; content: string }[];
  provider: string;
  model?: string;
  api_key?: string;
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
  extract_list?: boolean;
}

export interface CompletionResult {
  result: any;
}
