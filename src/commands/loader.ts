import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import type { CommandEntry, ParsedCommand } from './types';

export function parseCommandInput(input: string): ParsedCommand | null {
  const trimmed = input.trim();
  if (!trimmed.startsWith('/')) {
    return null;
  }

  const withoutSlash = trimmed.slice(1).trim();
  if (withoutSlash.length === 0) {
    return null;
  }

  const parts = withoutSlash.split(/\s+/);
  const command = parts[0];
  const args = parts.slice(1).join(' ');

  return { command, args };
}

export function loadCommand(name: string, basePath: string): string | null {
  const commandsDir = join(basePath, '.nila', 'commands');
  const commandPath = join(commandsDir, `${name}.md`);

  try {
    const content = readFileSync(commandPath, 'utf-8');
    return content;
  } catch {
    return null;
  }
}

export function listCommands(basePath: string): CommandEntry[] {
  const commandsDir = join(basePath, '.nila', 'commands');

  try {
    const entries = readdirSync(commandsDir);
    const commands: CommandEntry[] = [];

    for (const entry of entries) {
      if (!entry.endsWith('.md')) {
        continue;
      }

      const commandPath = join(commandsDir, entry);
      const stats = statSync(commandPath);

      if (!stats.isFile()) {
        continue;
      }

      try {
        const content = readFileSync(commandPath, 'utf-8');
        const lines = content.split('\n');
        const firstNonEmptyLine = lines.find((line) => line.trim().length > 0) || '';
        const description = firstNonEmptyLine.trim();

        const name = entry.slice(0, -3);

        commands.push({
          name,
          description,
          path: commandPath,
        });
      } catch {
        continue;
      }
    }

    return commands.sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return [];
  }
}

