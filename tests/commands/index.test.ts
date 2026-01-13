import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  parseSlashCommand,
  findCommand,
  listCommands,
  expandInput,
} from '../../src/commands/index';

describe('parseSlashCommand', () => {
  it('parses /name into { name, rest: "" }', () => {
    const result = parseSlashCommand('/name');
    expect(result).toEqual({ name: 'name', rest: '' });
  });

  it('parses /name with extra text into { name, rest: "with extra text" }', () => {
    const result = parseSlashCommand('/name with extra text');
    expect(result).toEqual({ name: 'name', rest: 'with extra text' });
  });

  it('returns null for non-slash input', () => {
    const result = parseSlashCommand('not a command');
    expect(result).toBeNull();
  });

  it('recognizes /help like any other slash command', () => {
    const result = parseSlashCommand('/help');
    expect(result).toEqual({ name: 'help', rest: '' });
  });

  it('normalizes /Name to lowercase name', () => {
    const result = parseSlashCommand('/Name');
    expect(result).toEqual({ name: 'name', rest: '' });
  });

  it('handles multiple spaces in rest text', () => {
    const result = parseSlashCommand('/cmd  multiple   spaces');
    expect(result).toEqual({ name: 'cmd', rest: 'multiple   spaces' });
  });

  it('handles empty string', () => {
    const result = parseSlashCommand('');
    expect(result).toBeNull();
  });

  it('handles just a slash', () => {
    const result = parseSlashCommand('/');
    expect(result).toBeNull();
  });
});

describe('findCommand', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), 'commands-test-'));
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it('loads a command from .code/commands/<name>.md if present', () => {
    const commandsDir = join(testDir, '.code', 'commands');
    mkdirSync(commandsDir, { recursive: true });
    writeFileSync(join(commandsDir, 'review.md'), 'Review the code.');

    const result = findCommand('review', testDir);
    expect(result).not.toBeNull();
    expect(result?.kind).toBe('command');
    expect(result?.name).toBe('review');
    expect(result?.content).toBe('Review the code.');
  });

  it('loads a skill from .code/skills/<name>/SKILL.md if present', () => {
    const skillsDir = join(testDir, '.code', 'skills', 'qr-code');
    mkdirSync(skillsDir, { recursive: true });
    writeFileSync(join(skillsDir, 'SKILL.md'), 'Generate a QR code.\nSkill path: {{skill_path}}');

    const result = findCommand('qr-code', testDir);
    expect(result).not.toBeNull();
    expect(result?.kind).toBe('skill');
    expect(result?.name).toBe('qr-code');
    expect(result?.content).toContain('Generate a QR code.');
    expect(result?.content).not.toContain('{{skill_path}}');
    expect(result?.content).toContain(skillsDir);
  });

  it('returns null for missing command', () => {
    const result = findCommand('nonexistent', testDir);
    expect(result).toBeNull();
  });

  it('replaces {{skill_path}} with absolute directory path', () => {
    const skillsDir = join(testDir, '.code', 'skills', 'test-skill');
    mkdirSync(skillsDir, { recursive: true });
    writeFileSync(join(skillsDir, 'SKILL.md'), 'Path: {{skill_path}}');

    const result = findCommand('test-skill', testDir);
    expect(result).not.toBeNull();
    expect(result?.content).not.toContain('{{skill_path}}');
    expect(result?.content).toContain(skillsDir);
  });

  it('returns skill files list excluding SKILL.md', () => {
    const skillsDir = join(testDir, '.code', 'skills', 'test-skill');
    mkdirSync(skillsDir, { recursive: true });
    writeFileSync(join(skillsDir, 'SKILL.md'), 'Test skill');
    writeFileSync(join(skillsDir, 'make_qr.py'), 'print("qr")');
    writeFileSync(join(skillsDir, 'helper.sh'), '#!/bin/bash');

    const result = findCommand('test-skill', testDir);
    expect(result).not.toBeNull();
    expect(result?.files).toContain('make_qr.py');
    expect(result?.files).toContain('helper.sh');
    expect(result?.files).not.toContain('SKILL.md');
  });

  it('prefers command over skill when both exist', () => {
    const commandsDir = join(testDir, '.code', 'commands');
    mkdirSync(commandsDir, { recursive: true });
    writeFileSync(join(commandsDir, 'review.md'), 'Command version');

    const skillsDir = join(testDir, '.code', 'skills', 'review');
    mkdirSync(skillsDir, { recursive: true });
    writeFileSync(join(skillsDir, 'SKILL.md'), 'Skill version');

    const result = findCommand('review', testDir);
    expect(result).not.toBeNull();
    expect(result?.kind).toBe('command');
    expect(result?.content).toBe('Command version');
  });

  it('is case insensitive for lookup', () => {
    const commandsDir = join(testDir, '.code', 'commands');
    mkdirSync(commandsDir, { recursive: true });
    writeFileSync(join(commandsDir, 'Review.md'), 'Review command');

    const result = findCommand('review', testDir);
    expect(result).not.toBeNull();
    expect(result?.content).toBe('Review command');
  });
});

describe('listCommands', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), 'commands-test-'));
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it('returns all available command names and skill names, de-duped', () => {
    const commandsDir = join(testDir, '.code', 'commands');
    mkdirSync(commandsDir, { recursive: true });
    writeFileSync(join(commandsDir, 'review.md'), 'Review');
    writeFileSync(join(commandsDir, 'test.md'), 'Test');

    const skillsDir = join(testDir, '.code', 'skills');
    mkdirSync(join(skillsDir, 'qr-code'), { recursive: true });
    writeFileSync(join(skillsDir, 'qr-code', 'SKILL.md'), 'QR code');
    mkdirSync(join(skillsDir, 'deploy'), { recursive: true });
    writeFileSync(join(skillsDir, 'deploy', 'SKILL.md'), 'Deploy');

    const result = listCommands(testDir);
    expect(result).toContain('review');
    expect(result).toContain('test');
    expect(result).toContain('qr-code');
    expect(result).toContain('deploy');
    expect(result.length).toBe(4);
  });

  it('returns empty array when no commands or skills exist', () => {
    const result = listCommands(testDir);
    expect(result).toEqual([]);
  });

  it('only includes .md files from commands directory', () => {
    const commandsDir = join(testDir, '.code', 'commands');
    mkdirSync(commandsDir, { recursive: true });
    writeFileSync(join(commandsDir, 'review.md'), 'Review');
    writeFileSync(join(commandsDir, 'test.txt'), 'Not a command');

    const result = listCommands(testDir);
    expect(result).toContain('review');
    expect(result).not.toContain('test');
  });

  it('only includes skills with SKILL.md', () => {
    const skillsDir = join(testDir, '.code', 'skills');
    mkdirSync(join(skillsDir, 'valid-skill'), { recursive: true });
    writeFileSync(join(skillsDir, 'valid-skill', 'SKILL.md'), 'Valid');
    mkdirSync(join(skillsDir, 'invalid-skill'), { recursive: true });
    writeFileSync(join(skillsDir, 'invalid-skill', 'README.md'), 'Invalid');

    const result = listCommands(testDir);
    expect(result).toContain('valid-skill');
    expect(result).not.toContain('invalid-skill');
  });
});

describe('expandInput', () => {
  let testDir: string;

  function expectAgent(
    result: import('../../src/commands/index').ExpandResult
  ): asserts result is Extract<import('../../src/commands/index').ExpandResult, { kind: 'agent' }> {
    if (result.kind !== 'agent') {
      throw new Error(`Expected agent result, got: ${result.kind}`);
    }
  }

  function expectLocal(
    result: import('../../src/commands/index').ExpandResult
  ): asserts result is Extract<import('../../src/commands/index').ExpandResult, { kind: 'local' }> {
    if (result.kind !== 'local') {
      throw new Error(`Expected local result, got: ${result.kind}`);
    }
  }

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), 'commands-test-'));
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it('returns agent result for non-slash input', () => {
    const result = expandInput('regular text', testDir);
    expectAgent(result);
    expect(result.userText).toBe('regular text');
    expect(result.prompt).toBe('regular text');
  });

  it('/help returns local response listing commands/skills', () => {
    const commandsDir = join(testDir, '.code', 'commands');
    mkdirSync(commandsDir, { recursive: true });
    writeFileSync(join(commandsDir, 'review.md'), 'Review');
    mkdirSync(join(testDir, '.code', 'skills', 'qr-code'), { recursive: true });
    writeFileSync(join(testDir, '.code', 'skills', 'qr-code', 'SKILL.md'), 'QR');

    const result = expandInput('/help', testDir);
    expectLocal(result);
    expect(result.userText).toBe('/help');
    expect(result.outputText).toContain('Available commands:');
    expect(result.outputText).toContain('/review');
    expect(result.outputText).toContain('/qr-code');
  });

  it('/help shows message when no commands exist', () => {
    const result = expandInput('/help', testDir);
    expectLocal(result);
    expect(result.outputText).toContain('Available commands:');
    expect(result.outputText).toContain('No commands or skills found');
  });

  it('unknown command returns local error message pointing to /help', () => {
    const result = expandInput('/nope', testDir);
    expectLocal(result);
    expect(result.error).toBe(true);
    expect(result.outputText).toContain('Unknown command: /nope');
    expect(result.outputText).toContain('/help');
  });

  it('known command expands to agent prompt and appends rest', () => {
    const commandsDir = join(testDir, '.code', 'commands');
    mkdirSync(commandsDir, { recursive: true });
    writeFileSync(join(commandsDir, 'review.md'), 'Review the code for correctness.');

    const result = expandInput('/review the auth module', testDir);
    expectAgent(result);
    expect(result.userText).toBe('/review the auth module');
    expect(result.prompt).toContain('Review the code for correctness.');
    expect(result.prompt).toContain('the auth module');
  });

  it('known skill expands to agent prompt, includes file listing, and appends rest', () => {
    const skillsDir = join(testDir, '.code', 'skills', 'qr-code');
    mkdirSync(skillsDir, { recursive: true });
    writeFileSync(join(skillsDir, 'SKILL.md'), 'Generate a QR code.');
    writeFileSync(join(skillsDir, 'make_qr.py'), 'print("qr")');

    const result = expandInput('/qr-code "hello world"', testDir);
    expectAgent(result);
    expect(result.userText).toBe('/qr-code "hello world"');
    expect(result.prompt).toContain('Generate a QR code.');
    expect(result.prompt).toContain('Files in skill:');
    expect(result.prompt).toContain('make_qr.py');
    expect(result.prompt).toContain('"hello world"');
  });

  it('skill without files does not include file listing', () => {
    const skillsDir = join(testDir, '.code', 'skills', 'simple');
    mkdirSync(skillsDir, { recursive: true });
    writeFileSync(join(skillsDir, 'SKILL.md'), 'Simple skill.');

    const result = expandInput('/simple', testDir);
    expectAgent(result);
    expect(result.prompt).toBe('Simple skill.');
    expect(result.prompt).not.toContain('Files in skill:');
  });

  it('command without rest text only includes command content', () => {
    const commandsDir = join(testDir, '.code', 'commands');
    mkdirSync(commandsDir, { recursive: true });
    writeFileSync(join(commandsDir, 'test.md'), 'Test command.');

    const result = expandInput('/test', testDir);
    expectAgent(result);
    expect(result.prompt).toBe('Test command.');
  });
});

