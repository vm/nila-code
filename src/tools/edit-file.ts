import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';

export function editFile(path: string, oldStr: string, newStr: string): string {
  try {
    // If oldStr is empty, create a new file
    if (oldStr === '') {
      // Create parent directories if they don't exist
      const dir = dirname(path);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      
      writeFileSync(path, newStr, 'utf-8');
      return `Created file "${path}"`;
    }

    // Otherwise, edit existing file
    if (!existsSync(path)) {
      return `Error: File "${path}" does not exist`;
    }

    const content = readFileSync(path, 'utf-8');
    
    // Check if oldStr appears multiple times
    const matches = content.match(new RegExp(escapeRegex(oldStr), 'g'));
    if (matches && matches.length > 1) {
      return `Error: The string to replace appears ${matches.length} times. Please be more specific.`;
    }

    // Check if oldStr is found
    if (!content.includes(oldStr)) {
      return `Error: The string to replace was not found in "${path}"`;
    }

    // Replace oldStr with newStr
    const newContent = content.replace(oldStr, newStr);
    writeFileSync(path, newContent, 'utf-8');
    
    return `Updated file "${path}"`;
  } catch (error) {
    if (error instanceof Error) {
      return `Error: Failed to edit file "${path}": ${error.message}`;
    }
    return `Error: Failed to edit file "${path}"`;
  }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

