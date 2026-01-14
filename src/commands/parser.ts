import type { CommandInvocation, ParsedInput } from './types';

export function parseInput(input: string): ParsedInput {
  const trimmed = input.trim();
  if (trimmed.startsWith('/')) {
    return {
      type: 'command',
      invocation: parseCommandLine(trimmed),
    };
  }
  return {
    type: 'message',
    text: trimmed,
  };
}

export function parseCommandLine(line: string): CommandInvocation {
  const trimmed = line.trim();
  if (!trimmed.startsWith('/')) {
    return { name: '', args: '' };
  }

  const withoutSlash = trimmed.slice(1);
  const firstSpaceIndex = withoutSlash.indexOf(' ');

  if (firstSpaceIndex === -1) {
    return {
      name: withoutSlash,
      args: '',
    };
  }

  const name = withoutSlash.slice(0, firstSpaceIndex);
  const args = withoutSlash.slice(firstSpaceIndex + 1).trim();

  return {
    name,
    args: args || '',
  };
}

