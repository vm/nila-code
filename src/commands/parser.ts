import type { CommandInvocation } from './types';

export function parseCommandLine(input: string): CommandInvocation {
  const trimmed = input.trim();

  if (!trimmed.startsWith('/')) {
    return { name: '', args: '' };
  }

  const withoutSlash = trimmed.slice(1);
  const spaceIndex = withoutSlash.indexOf(' ');

  if (spaceIndex === -1) {
    return { name: withoutSlash, args: '' };
  }

  const name = withoutSlash.slice(0, spaceIndex);
  const args = withoutSlash.slice(spaceIndex + 1).trim();

  return { name, args };
}
