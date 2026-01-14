import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { discoverCommands, loadCommand, extractDescription } from '../../src/commands/discovery';

describe('discoverCommands', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), 'agent-test-'));
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it('returns empty array when .nila/commands/ does not exist', () => {
    const commandsDir = join(testDir, '.nila', 'commands');
    const result = discoverCommands(commandsDir);
    expect(result).toEqual([]);
  });

  it('returns empty array when directory is empty', () => {
    const commandsDir = join(testDir, '.nila', 'commands');
    mkdirSync(commandsDir, { recursive: true });
    const result = discoverCommands(commandsDir);
    expect(result).toEqual([]);
  });

  it('finds all .md files in directory', () => {
    const commandsDir = join(testDir, '.nila', 'commands');
    mkdirSync(commandsDir, { recursive: true });
    writeFileSync(join(commandsDir, 'makepr.md'), '# Make PR\n\nCreate a pull request.');
    writeFileSync(join(commandsDir, 'help.md'), '# Help\n\nShow help.');
    
    const result = discoverCommands(commandsDir);
    expect(result).toHaveLength(2);
    expect(result.map(c => c.name).sort()).toEqual(['help', 'makepr']);
  });

  it('ignores non-.md files', () => {
    const commandsDir = join(testDir, '.nila', 'commands');
    mkdirSync(commandsDir, { recursive: true });
    writeFileSync(join(commandsDir, 'makepr.md'), '# Make PR');
    writeFileSync(join(commandsDir, 'script.sh'), '#!/bin/bash');
    writeFileSync(join(commandsDir, 'readme.txt'), 'Readme');
    
    const result = discoverCommands(commandsDir);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('makepr');
  });
});

describe('loadCommand', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), 'agent-test-'));
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it('extracts name from filename', () => {
    const filePath = join(testDir, 'makepr.md');
    writeFileSync(filePath, '# Make PR\n\nContent here.');
    
    const result = loadCommand(filePath);
    expect(result.name).toBe('makepr');
  });

  it('reads file content into content field', () => {
    const filePath = join(testDir, 'test.md');
    const content = '# Test Command\n\nThis is the content.';
    writeFileSync(filePath, content);
    
    const result = loadCommand(filePath);
    expect(result.content).toBe(content);
  });

  it('sets path to full file path', () => {
    const filePath = join(testDir, 'test.md');
    writeFileSync(filePath, 'Content');
    
    const result = loadCommand(filePath);
    expect(result.path).toBe(filePath);
  });

  it('handles unreadable file', () => {
    const filePath = join(testDir, 'nonexistent.md');
    
    expect(() => loadCommand(filePath)).toThrow();
  });
});

describe('extractDescription', () => {
  it('returns first heading text', () => {
    const content = '# Make PR\n\nThis is the description.';
    const result = extractDescription(content);
    expect(result).toBe('Make PR');
  });

  it('returns first heading text with multiple headings', () => {
    const content = '# First Heading\n\n## Second Heading\n\nContent.';
    const result = extractDescription(content);
    expect(result).toBe('First Heading');
  });

  it('returns first line if no heading', () => {
    const content = 'Create a git commit with an appropriate commit message.';
    const result = extractDescription(content);
    expect(result).toBe('Create a git commit with an appropriate commit message.');
  });

  it('returns first non-empty line if no heading', () => {
    const content = '\n\nCreate a git commit.\n\nMore content.';
    const result = extractDescription(content);
    expect(result).toBe('Create a git commit.');
  });

  it('returns empty string for empty content', () => {
    const result = extractDescription('');
    expect(result).toBe('');
  });

  it('returns empty string for whitespace-only content', () => {
    const result = extractDescription('   \n\n  \t  ');
    expect(result).toBe('');
  });

  it('handles heading with leading/trailing whitespace', () => {
    const content = '#   Make PR   \n\nContent.';
    const result = extractDescription(content);
    expect(result).toBe('Make PR');
  });

  it('handles heading level 2', () => {
    const content = '## Second Level\n\nContent.';
    const result = extractDescription(content);
    expect(result).toBe('Second Level');
  });

  it('handles heading level 3', () => {
    const content = '### Third Level\n\nContent.';
    const result = extractDescription(content);
    expect(result).toBe('Third Level');
  });
});

