export type Message = {
  role: 'user' | 'assistant' | 'tool';
  content: string | ToolCallMessage[];
  tool_call_id?: string;
};

export type ToolCallMessage = {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
};

export enum StopReason {
  MAX_TOKENS = 'length',
  END_TURN = 'stop',
  TOOL_USE = 'tool_calls',
}

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
  onToolStart?: (
    id: string,
    name: string,
    input: Record<string, unknown>
  ) => void;
  onToolComplete?: (
    id: string,
    name: string,
    input: Record<string, unknown>,
    result: string,
    error?: boolean
  ) => void;
};
