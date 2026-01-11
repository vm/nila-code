import { spawnSync } from 'bun';

/**
 * Parse a shell command string into command and arguments, respecting quotes.
 * Handles both single and double quotes, and escaped quotes.
 */
function parseCommand(command: string): string[] {
  const parts: string[] = [];
  let current = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let i = 0;

  while (i < command.length) {
    const char = command[i];
    const nextChar = command[i + 1];

    if (char === '\\' && (inSingleQuote || inDoubleQuote || nextChar === '"' || nextChar === "'")) {
      // Handle escaped characters
      if (nextChar) {
        current += nextChar;
        i += 2;
        continue;
      }
    }

    if (char === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
      i++;
      continue;
    }

    if (char === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
      i++;
      continue;
    }

    if ((char === ' ' || char === '\t') && !inSingleQuote && !inDoubleQuote) {
      // Whitespace outside quotes - end current argument
      if (current.length > 0) {
        parts.push(current);
        current = '';
      }
      i++;
      continue;
    }

    current += char;
    i++;
  }

  // Add the last argument if there is one
  if (current.length > 0) {
    parts.push(current);
  }

  return parts;
}

export function runCommand(command: string): string {
  try {
    // Parse command and arguments, respecting quotes
    const parts = parseCommand(command.trim());
    
    if (parts.length === 0) {
      return 'Error: Empty command';
    }

    const cmd = parts[0];
    const args = parts.slice(1);

    const result = spawnSync({
      cmd: [cmd, ...args],
      stdout: 'pipe',
      stderr: 'pipe',
    });

    // Combine stdout and stderr
    const stdout = result.stdout?.toString() || '';
    const stderr = result.stderr?.toString() || '';
    const combined = (stdout + stderr).trim();

    if (result.exitCode !== 0) {
      return `Error: Command failed with exit code ${result.exitCode}${combined ? `\n${combined}` : ''}`;
    }

    return combined || '';
  } catch (error) {
    if (error instanceof Error) {
      return `Error: Failed to run command "${command}": ${error.message}`;
    }
    return `Error: Failed to run command "${command}"`;
  }
}

