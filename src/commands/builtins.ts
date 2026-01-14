import type { Command } from './types';

export const BUILTIN_COMMANDS: string[] = ['help'];

export function isBuiltinCommand(name: string): boolean {
  return BUILTIN_COMMANDS.includes(name);
}

export function executeBuiltinHelp(commands: Command[]): string {
  if (commands.length === 0) {
    return 'No commands available';
  }

  const sorted = [...commands].sort((a, b) => a.name.localeCompare(b.name));
  return sorted.map(cmd => `/${cmd.name} — ${cmd.description}`).join('\n');
}

