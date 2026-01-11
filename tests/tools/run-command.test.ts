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

  it('handles git commit with message containing spaces', () => {
    // Test that git commit messages with spaces are parsed correctly
    // We'll use --dry-run to avoid actually committing
    const result = runCommand('git commit --dry-run -m "UI improvements and tests"');
    // Should not error with pathspec issues - if it does, the error will contain "pathspec"
    expect(result).not.toContain('pathspec');
  });

  it('handles single quotes in commit messages', () => {
    const result = runCommand("git commit --dry-run -m 'Add feature with spaces'");
    expect(result).not.toContain('pathspec');
  });

  it('handles complex quoted strings', () => {
    const result = runCommand('echo "This is a test with multiple words"');
    expect(result).toBe('This is a test with multiple words');
  });

  it('handles escaped quotes', () => {
    const result = runCommand('echo "He said \\"hello\\""');
    expect(result).toContain('He said');
  });

  it('handles empty command', () => {
    const result = runCommand('');
    expect(result).toContain('Empty command');
  });
});

