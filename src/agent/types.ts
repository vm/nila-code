import type Anthropic from '@anthropic-ai/sdk';

export type MessageParam = Anthropic.MessageParam;
export type ContentBlock = Anthropic.ContentBlock;
export type ToolResultBlockParam = Anthropic.ToolResultBlockParam;

export type ToolCall = {
  name: string;
  input: Record<string, unknown>;
  result: string;
  error?: boolean;
};

export type AgentResponse = {
  text: string;
  toolCalls: ToolCall[];
  tokenUsage?: {
    input: number;
    output: number;
  };
  error?: string;
};

export type AgentOptions = {
  maxRetries?: number;
  retryDelay?: number;
  enableParallelTools?: boolean;
  onToolStart?: (name: string, input: Record<string, unknown>) => void;
  onToolComplete?: (name: string, result: string, error?: boolean) => void;
};

