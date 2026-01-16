import { MessageRole, ToolCallStatus, type MessageItem, type ToolCallItem } from './types';
import type { Message } from '../agent/types';

export type TranscriptPartition<M> = {
  before: M[];
  afterAssistant: M | null;
};

type ToolCallResult = {
  result: string;
  error: boolean;
};

function parseToolArguments(raw: string | undefined): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return {};
  } catch {
    return {};
  }
}

export function deriveTranscript(conversation: Message[]): {
  messages: MessageItem[];
  toolCalls: ToolCallItem[];
} {
  const messages: MessageItem[] = [];
  const toolCalls: ToolCallItem[] = [];
  const results = new Map<string, ToolCallResult>();

  for (const msg of conversation) {
    if (msg.role === 'user' && typeof msg.content === 'string') {
      messages.push({ role: MessageRole.USER, content: msg.content });
      toolCalls.length = 0;
      results.clear();
      continue;
    }

    if (msg.role === 'assistant') {
      if (typeof msg.content === 'string') {
        messages.push({ role: MessageRole.ASSISTANT, content: msg.content });
        continue;
      }
      if (!Array.isArray(msg.content)) continue;
      for (const tc of msg.content) {
        const result = results.get(tc.id);
        const status = result
          ? result.error
            ? ToolCallStatus.ERROR
            : ToolCallStatus.DONE
          : ToolCallStatus.RUNNING;
        toolCalls.push({
          id: tc.id,
          name: tc.function.name,
          input: parseToolArguments(tc.function.arguments),
          status,
          result: result?.result,
          error: result?.error,
        });
      }
      continue;
    }

    if (msg.role !== 'tool') continue;
    if (!msg.tool_call_id) continue;
    if (typeof msg.content !== 'string') continue;
    const result = {
      result: msg.content,
      error: msg.content.startsWith('Error:'),
    };
    results.set(msg.tool_call_id, result);
    for (let i = 0; i < toolCalls.length; i++) {
      if (toolCalls[i]?.id !== msg.tool_call_id) continue;
      toolCalls[i] = {
        ...toolCalls[i],
        status: result.error ? ToolCallStatus.ERROR : ToolCallStatus.DONE,
        result: result.result,
        error: result.error,
      };
      break;
    }
  }

  return { messages, toolCalls };
}

export function splitForToolCalls<M extends { role: MessageRole }>(params: {
  messages: M[];
  toolCalls: readonly unknown[];
}): TranscriptPartition<M> {
  const { messages, toolCalls } = params;
  if (toolCalls.length === 0) return { before: messages, afterAssistant: null };

  const lastMessage = messages[messages.length - 1];
  if (lastMessage?.role === MessageRole.ASSISTANT) {
    return { before: messages.slice(0, -1), afterAssistant: lastMessage };
  }

  return { before: messages, afterAssistant: null };
}
