import { readFileSync } from 'node:fs';

export function readFile(path: string): string {
  try {
    const content = readFileSync(path, 'utf-8');
    return content;
  } catch (error) {
    if (error instanceof Error) {
      return `Error: Failed to read file "${path}": ${error.message}`;
    }
    return `Error: Failed to read file "${path}"`;
  }
}

