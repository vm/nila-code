import { describe, it, expect } from 'bun:test';
import { isBuiltinCommand, executeBuiltinHelp } from '../../src/commands/builtins';
import type { Command } from '../../src/commands/types';

describe('isBuiltinCommand', () => {
  it('returns true for help', () => {
    expect(isBuiltinCommand('help')).toBe(true);
  });

  it('returns false for non-builtins', () => {
    expect(isBuiltinCommand('makepr')).toBe(false);
    expect(isBuiltinCommand('commit')).toBe(false);
    expect(isBuiltinCommand('unknown')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isBuiltinCommand('')).toBe(false);
  });
});

describe('executeBuiltinHelp', () => {
  it('shows "No commands available" with empty commands', () => {
    const result = executeBuiltinHelp([]);
    expect(result).toContain('No commands available');
  });

  it('lists each command with name and description', () => {
    const commands: Command[] = [
      {
        name: 'makepr',
        description: 'Create a pull request',
        path: '/path/to/makepr.md',
        content: '# Make PR\n\nCreate a pull request',
      },
      {
        name: 'commit',
        description: 'Create a git commit',
        path: '/path/to/commit.md',
        content: 'Create a git commit',
      },
    ];

    const result = executeBuiltinHelp(commands);
    expect(result).toContain('makepr');
    expect(result).toContain('Create a pull request');
    expect(result).toContain('commit');
    expect(result).toContain('Create a git commit');
  });

  it('output format: /name — description per line', () => {
    const commands: Command[] = [
      {
        name: 'makepr',
        description: 'Create a pull request',
        path: '/path/to/makepr.md',
        content: 'Content',
      },
    ];

    const result = executeBuiltinHelp(commands);
    expect(result).toContain('/makepr — Create a pull request');
  });

  it('sorts commands alphabetically', () => {
    const commands: Command[] = [
      {
        name: 'zebra',
        description: 'Zebra command',
        path: '/path/to/zebra.md',
        content: 'Content',
      },
      {
        name: 'alpha',
        description: 'Alpha command',
        path: '/path/to/alpha.md',
        content: 'Content',
      },
      {
        name: 'beta',
        description: 'Beta command',
        path: '/path/to/beta.md',
        content: 'Content',
      },
    ];

    const result = executeBuiltinHelp(commands);
    const lines = result.split('\n').filter(line => line.trim());
    const alphaIndex = lines.findIndex(line => line.includes('alpha'));
    const betaIndex = lines.findIndex(line => line.includes('beta'));
    const zebraIndex = lines.findIndex(line => line.includes('zebra'));

    expect(alphaIndex).toBeLessThan(betaIndex);
    expect(betaIndex).toBeLessThan(zebraIndex);
  });

  it('handles commands with empty descriptions', () => {
    const commands: Command[] = [
      {
        name: 'test',
        description: '',
        path: '/path/to/test.md',
        content: '',
      },
    ];

    const result = executeBuiltinHelp(commands);
    expect(result).toContain('/test');
  });
});

