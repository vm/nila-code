import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseCommandInput, loadCommand, listCommands } from '../../src/commands/loader';

describe('parseCommandInput', () => {
  it('extracts command name from /makepr', () => {
    const result = parseCommandInput('/makepr');
    expect(result).toEqual({ command: 'makepr', args: '' });
  });

  it('extracts args from /makepr fix auth bug', () => {
    const result = parseCommandInput('/makepr fix auth bug');
    expect(result).toEqual({ command: 'makepr', args: 'fix auth bug' });
  });

  it('returns null for input without / prefix', () => {
    const result = parseCommandInput('makepr fix auth bug');
    expect(result).toBeNull();
  });

  it('returns null for / alone', () => {
    const result = parseCommandInput('/');
    expect(result).toBeNull();
  });

  it('handles command with no args', () => {
    const result = parseCommandInput('/help');
    expect(result).toEqual({ command: 'help', args: '' });
  });

  it('handles command with trailing spaces', () => {
    const result = parseCommandInput('/makepr   ');
    expect(result).toEqual({ command: 'makepr', args: '' });
  });

  it('handles command with leading spaces after /', () => {
    const result = parseCommandInput('/ makepr');
    expect(result).toEqual({ command: 'makepr', args: '' });
  });
});

describe('loadCommand', () => {
  let testDir: string;
  let commandsDir: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), 'agent-test-'));
    commandsDir = join(testDir, '.nila', 'commands');
    mkdirSync(commandsDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it('returns file content when command exists', () => {
    const commandPath = join(commandsDir, 'makepr.md');
    const content = 'Create a pull request with the given description';
    writeFileSync(commandPath, content);

    const result = loadCommand('makepr', testDir);
    expect(result).toBe(content);
  });

  it('returns null when command file missing', () => {
    const result = loadCommand('nonexistent', testDir);
    expect(result).toBeNull();
  });

  it('handles missing .nila/commands/ directory', () => {
    rmSync(join(testDir, '.nila'), { recursive: true, force: true });
    const result = loadCommand('makepr', testDir);
    expect(result).toBeNull();
  });

  it('handles command with special characters in name', () => {
    const commandPath = join(commandsDir, 'test-command.md');
    const content = 'Test command';
    writeFileSync(commandPath, content);

    const result = loadCommand('test-command', testDir);
    expect(result).toBe(content);
  });
});

describe('listCommands', () => {
  let testDir: string;
  let commandsDir: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), 'agent-test-'));
    commandsDir = join(testDir, '.nila', 'commands');
    mkdirSync(commandsDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it('returns all .md files in commands directory', () => {
    writeFileSync(join(commandsDir, 'makepr.md'), 'Create a pull request');
    writeFileSync(join(commandsDir, 'release-notes.md'), 'Generate release notes');
    writeFileSync(join(commandsDir, 'not-a-command.txt'), 'Should be ignored');

    const result = listCommands(testDir);
    expect(result).toHaveLength(2);
    expect(result.map((c) => c.name).sort()).toEqual(['makepr', 'release-notes']);
  });

  it('extracts description from first line of each file', () => {
    writeFileSync(join(commandsDir, 'makepr.md'), 'Create a pull request\n\nMore details here');
    writeFileSync(join(commandsDir, 'release-notes.md'), 'Generate release notes');

    const result = listCommands(testDir);
    const makepr = result.find((c) => c.name === 'makepr');
    const releaseNotes = result.find((c) => c.name === 'release-notes');

    expect(makepr?.description).toBe('Create a pull request');
    expect(releaseNotes?.description).toBe('Generate release notes');
  });

  it('returns empty array when no commands exist', () => {
    const result = listCommands(testDir);
    expect(result).toEqual([]);
  });

  it('handles missing .nila/commands/ directory', () => {
    rmSync(join(testDir, '.nila'), { recursive: true, force: true });
    const result = listCommands(testDir);
    expect(result).toEqual([]);
  });

  it('skips empty first lines when extracting description', () => {
    writeFileSync(join(commandsDir, 'makepr.md'), '\n\nCreate a pull request');
    const result = listCommands(testDir);
    const makepr = result.find((c) => c.name === 'makepr');
    expect(makepr?.description).toBe('Create a pull request');
  });

  it('includes absolute path in CommandEntry', () => {
    writeFileSync(join(commandsDir, 'makepr.md'), 'Create a pull request');
    const result = listCommands(testDir);
    const makepr = result.find((c) => c.name === 'makepr');
    expect(makepr?.path).toBe(join(commandsDir, 'makepr.md'));
  });
});

