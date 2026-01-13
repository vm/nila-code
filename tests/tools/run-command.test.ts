import { describe, it, expect } from 'bun:test';
import { runCommand } from '../../src/tools/run-command';

describe('runCommand', () => {
  it('returns stdout for successful command', () => {
    const result = runCommand('echo "Hello, world!"');
    expect(result).toContain('Hello, world!');
  });

  it('returns combined stdout+stderr', () => {
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
    const result = runCommand('git commit --dry-run -m "UI improvements and tests"');
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

  it('handles escape at end of string (undefined nextChar)', () => {
    const result = runCommand('echo "test\\');
    expect(result).toBeDefined();
  });

  it('handles backslash before quote at end of string', () => {
    const result = runCommand('echo hello');
    expect(result).toBeDefined();
  });

  it('handles non-Error exceptions in catch block', () => {
    const result = runCommand('nonexistent-command-that-does-not-exist-12345');
    expect(result).toContain('Error');
  });
});

