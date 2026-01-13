import { Box, Text } from 'ink';
import { MessageRole, ToolCallStatus } from '../agent/types';

type MessageItem = {
  role: MessageRole;
  content: string;
};

type ToolCallItem = {
  name: string;
  status: ToolCallStatus;
  result?: string;
};

type Line = {
  text: string;
  color?: string;
};

function splitLines(text: string): string[] {
  return text.split(/\r?\n/);
}

function wrapLine(line: string, width: number): string[] {
  if (width <= 0) return [''];
  if (line.length <= width) return [line];
  const out: string[] = [];
  for (let i = 0; i < line.length; i += width) {
    out.push(line.slice(i, i + width));
  }
  return out;
}

function wrapText(text: string, width: number): string[] {
  const logicalLines = splitLines(text);
  const out: string[] = [];
  for (const l of logicalLines) {
    out.push(...wrapLine(l, width));
  }
  return out;
}

function toolStatusLabel(status: ToolCallStatus): string {
  switch (status) {
    case ToolCallStatus.RUNNING:
      return 'running';
    case ToolCallStatus.DONE:
      return 'done';
    case ToolCallStatus.ERROR:
      return 'error';
  }
}

function toolStatusColor(status: ToolCallStatus): string {
  switch (status) {
    case ToolCallStatus.RUNNING:
      return 'yellow';
    case ToolCallStatus.DONE:
      return 'green';
    case ToolCallStatus.ERROR:
      return 'red';
  }
}

function buildTranscriptLines(params: {
  messages: MessageItem[];
  toolCalls: ToolCallItem[];
  isLoading: boolean;
  error: string | null;
  width: number;
}): Line[] {
  const { messages, toolCalls, isLoading, error, width } = params;
  const lines: Line[] = [];

  for (const msg of messages) {
    if (msg.role === MessageRole.USER) {
      const prefix = 'you ';
      const wrapped = wrapText(prefix + msg.content, width);
      for (const w of wrapped) lines.push({ text: w, color: 'yellow' });
      lines.push({ text: '' });
      continue;
    }

    const wrapped = wrapText(msg.content, width);
    for (const w of wrapped) lines.push({ text: w, color: 'white' });
    lines.push({ text: '' });
  }

  if (isLoading && toolCalls.length === 0) {
    lines.push({ text: 'thinking…', color: 'gray' });
    lines.push({ text: '' });
  }

  for (const tc of toolCalls) {
    const header = `tool ${tc.name} (${toolStatusLabel(tc.status)})`;
    lines.push({ text: header, color: toolStatusColor(tc.status) });
    if (tc.result) {
      const wrapped = wrapText(tc.result, width);
      for (const w of wrapped) lines.push({ text: w, color: 'gray' });
    }
    lines.push({ text: '' });
  }

  if (error) {
    const wrapped = wrapText(`error: ${error}`, width);
    for (const w of wrapped) lines.push({ text: w, color: 'red' });
    lines.push({ text: '' });
  }

  return lines;
}

export function TranscriptView(props: {
  messages: MessageItem[];
  afterAssistant?: MessageItem | null;
  toolCalls: ToolCallItem[];
  isLoading: boolean;
  error: string | null;
  width: number;
  height: number;
  scrollOffset?: number;
}) {
  const width = Math.max(1, props.width);
  const height = Math.max(1, props.height);
  const scrollOffset = Math.max(0, props.scrollOffset ?? 0);

  const allLines = buildTranscriptLines({
    messages: props.messages,
    toolCalls: props.toolCalls,
    isLoading: props.isLoading,
    error: props.error,
    width,
  });

  if (props.afterAssistant) {
    const assistantLines = buildTranscriptLines({
      messages: [props.afterAssistant],
      toolCalls: [],
      isLoading: false,
      error: null,
      width,
    });
    allLines.push(...assistantLines);
  }

  const maxScrollOffset = Math.max(0, allLines.length - height);
  const clampedOffset = Math.min(scrollOffset, maxScrollOffset);
  const start = Math.max(0, allLines.length - height - clampedOffset);
  const visible = allLines.slice(start, start + height);
  const fillerCount = Math.max(0, height - visible.length);

  return (
    <Box flexDirection="column" height={height}>
      {Array.from({ length: fillerCount }).map((_, i) => (
        <Text key={`pad-${i}`}> </Text>
      ))}
      {visible.map((l, i) => (
        <Text key={`line-${i}`} color={l.color}>
          {l.text.length === 0 ? ' ' : l.text}
        </Text>
      ))}
    </Box>
  );
}


