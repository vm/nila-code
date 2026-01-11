import { spawnSync } from 'bun';

export function runCommand(command: string): string {
  try {
    // Parse command and arguments
    const parts = command.trim().split(/\s+/);
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

