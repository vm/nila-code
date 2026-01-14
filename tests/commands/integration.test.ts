import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseCommandInput, loadCommand, listCommands } from '../../src/commands/loader';

describe('Command integration', () => {
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

  it('full flow: parse input → load command → format message', () => {
    const commandPath = join(commandsDir, 'makepr.md');
    const commandContent = 'Create a pull request with the given description';
    writeFileSync(commandPath, commandContent);

    const input = '/makepr fix auth bug';
    const parsed = parseCommandInput(input);
    expect(parsed).not.toBeNull();
    expect(parsed?.command).toBe('makepr');
    expect(parsed?.args).toBe('fix auth bug');

    const content = loadCommand(parsed!.command, testDir);
    expect(content).toBe(commandContent);

    const formattedMessage = `${content}\n\n---\n\nUser request: ${parsed!.args}`;
    expect(formattedMessage).toContain(commandContent);
    expect(formattedMessage).toContain('fix auth bug');
  });

  it('/help returns formatted list of commands', () => {
    writeFileSync(join(commandsDir, 'makepr.md'), 'Create a pull request');
    writeFileSync(join(commandsDir, 'release-notes.md'), 'Generate release notes');

    const commands = listCommands(testDir);
    expect(commands).toHaveLength(2);

    const helpText = commands
      .map((cmd) => `/${cmd.name} - ${cmd.description}`)
      .join('\n');

    expect(helpText).toContain('/makepr - Create a pull request');
    expect(helpText).toContain('/release-notes - Generate release notes');
  });

  it('handles command with no args', () => {
    const commandPath = join(commandsDir, 'help.md');
    const commandContent = 'Show available commands';
    writeFileSync(commandPath, commandContent);

    const input = '/help';
    const parsed = parseCommandInput(input);
    expect(parsed).not.toBeNull();
    expect(parsed?.command).toBe('help');
    expect(parsed?.args).toBe('');

    const content = loadCommand(parsed!.command, testDir);
    expect(content).toBe(commandContent);

    const formattedMessage = `${content}\n\n---\n\nUser request: ${parsed!.args}`;
    expect(formattedMessage).toContain(commandContent);
  });

  it('handles unknown command gracefully', () => {
    const input = '/unknown-command';
    const parsed = parseCommandInput(input);
    expect(parsed).not.toBeNull();

    const content = loadCommand(parsed!.command, testDir);
    expect(content).toBeNull();
  });
});

