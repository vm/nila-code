import { MessageRole } from './types';

export type TranscriptPartition<M> = {
  before: M[];
  afterAssistant: M | null;
};

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


