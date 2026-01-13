import { readdirSync, statSync } from 'node:fs';

export function listFiles(path: string): string {
  try {
    const entries = readdirSync(path);
    const items: string[] = [];

    for (const entry of entries) {
      if (entry.startsWith('.')) {
        continue;
      }

      const fullPath = `${path}/${entry}`;
      const stats = statSync(fullPath);

      if (stats.isDirectory()) {
        items.push(`${entry}/`);
      } else {
        items.push(entry);
      }
    }

    return items.sort().join('\n');
  } catch (error) {
    if (error instanceof Error) {
      return `Error: Failed to list files in "${path}": ${error.message}`;
    }
    return `Error: Failed to list files in "${path}"`;
  }
}
