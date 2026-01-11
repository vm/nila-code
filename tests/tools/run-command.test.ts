import { describe, it, expect } from 'bun:test';
import { runCommand } from '../../src/tools/run-command';

describe('runCommand', () => {
  it('returns stdout for successful command', () => {
    const result = runCommand('echo "Hello, world!"');
    expect(result).toContain('Hello, world!');
  });

  it('returns combined stdout+stderr', () => {
    // Using a command that outputs to both stdout and stderr
    const result = runCommand('echo "stdout" && echo "stderr" >&2');
    expect(result).toContain('stdout');
    expect(result).toContain('stderr');
  });

  it('returns error message for failing command', () => {
    const result = runCommand('false');
    expect(result).toContain('Error');
  });

  it('handles commands with arguments', () => {
    const result = runCommand('echo "test" "with" "args"');
    expect(result).toContain('test');
    expect(result).toContain('with');
    expect(result).toContain('args');
  });
});

