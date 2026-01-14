import { describe, it, expect } from 'bun:test';
import { parseInput, parseCommandLine } from '../../src/commands/parser';

describe('parseInput', () => {
  it('returns type: command for input starting with /', () => {
    const result = parseInput('/makepr');
    expect(result.type).toBe('command');
    if (result.type === 'command') {
      expect(result.invocation.name).toBe('makepr');
    }
  });

  it('returns type: message for regular text', () => {
    const result = parseInput('hello world');
    expect(result.type).toBe('message');
    if (result.type === 'message') {
      expect(result.text).toBe('hello world');
    }
  });

  it('handles input with leading whitespace', () => {
    const result = parseInput('  /makepr');
    expect(result.type).toBe('command');
    if (result.type === 'command') {
      expect(result.invocation.name).toBe('makepr');
    }
  });

  it('trims message text', () => {
    const result = parseInput('  hello world  ');
    expect(result.type).toBe('message');
    if (result.type === 'message') {
      expect(result.text).toBe('hello world');
    }
  });
});

describe('parseCommandLine', () => {
  it('extracts command name correctly', () => {
    const result = parseCommandLine('/makepr');
    expect(result.name).toBe('makepr');
    expect(result.args).toBe('');
  });

  it('extracts args as single string', () => {
    const result = parseCommandLine('/release-notes v2.1.0');
    expect(result.name).toBe('release-notes');
    expect(result.args).toBe('v2.1.0');
  });

  it('handles no args', () => {
    const result = parseCommandLine('/help');
    expect(result.name).toBe('help');
    expect(result.args).toBe('');
  });

  it('handles multi-word args', () => {
    const result = parseCommandLine('/pr fix auth bug');
    expect(result.name).toBe('pr');
    expect(result.args).toBe('fix auth bug');
  });

  it('handles / alone returns empty name', () => {
    const result = parseCommandLine('/');
    expect(result.name).toBe('');
    expect(result.args).toBe('');
  });

  it('normalizes whitespace-only args to empty string', () => {
    const result = parseCommandLine('/command   ');
    expect(result.name).toBe('command');
    expect(result.args).toBe('');
  });

  it('handles multiple spaces in args', () => {
    const result = parseCommandLine('/command  arg1   arg2');
    expect(result.name).toBe('command');
    expect(result.args).toBe('arg1   arg2');
  });

  it('trims leading whitespace from line', () => {
    const result = parseCommandLine('  /makepr');
    expect(result.name).toBe('makepr');
    expect(result.args).toBe('');
  });

  it('returns empty name for non-command line', () => {
    const result = parseCommandLine('not a command');
    expect(result.name).toBe('');
    expect(result.args).toBe('');
  });
});

