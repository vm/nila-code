import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { discoverSkills, loadSkill, detectScriptLanguage } from '../../src/skills/discovery';

describe('discoverSkills', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), 'agent-test-'));
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it('returns empty array when .nila/skills/ does not exist', () => {
    const skillsDir = join(testDir, '.nila', 'skills');
    const result = discoverSkills(skillsDir);
    expect(result).toEqual([]);
  });

  it('finds all skill directories', () => {
    const skillsDir = join(testDir, '.nila', 'skills');
    const qrDir = join(skillsDir, 'qr_code');
    const codemodDir = join(skillsDir, 'codemod');
    mkdirSync(qrDir, { recursive: true });
    mkdirSync(codemodDir, { recursive: true });
    writeFileSync(join(qrDir, 'skill.md'), '# QR Code\n\nGenerate a QR code.');
    writeFileSync(join(qrDir, 'generate_qr.py'), 'print("qr")');
    writeFileSync(join(codemodDir, 'skill.md'), '# Codemod\n\nMigrate code.');
    writeFileSync(join(codemodDir, 'migrate.ts'), 'export {}');

    const result = discoverSkills(skillsDir);
    expect(result).toHaveLength(2);
    expect(result.map(skill => skill.name).sort()).toEqual(['codemod', 'qr_code']);
  });

  it('ignores files at root level', () => {
    const skillsDir = join(testDir, '.nila', 'skills');
    const qrDir = join(skillsDir, 'qr_code');
    mkdirSync(qrDir, { recursive: true });
    writeFileSync(join(skillsDir, 'readme.txt'), 'Readme');
    writeFileSync(join(qrDir, 'skill.md'), '# QR Code');

    const result = discoverSkills(skillsDir);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('qr_code');
  });

  it('skips skill without skill.md', () => {
    const skillsDir = join(testDir, '.nila', 'skills');
    const missingDir = join(skillsDir, 'missing');
    const validDir = join(skillsDir, 'valid');
    mkdirSync(missingDir, { recursive: true });
    mkdirSync(validDir, { recursive: true });
    writeFileSync(join(validDir, 'skill.md'), '# Valid');

    const result = discoverSkills(skillsDir);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('valid');
  });
});

describe('loadSkill', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), 'agent-test-'));
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it('reads skill.md into prompt field', () => {
    const skillDir = join(testDir, 'qr_code');
    mkdirSync(skillDir, { recursive: true });
    const prompt = '# QR Code\n\nGenerate a QR code.';
    writeFileSync(join(skillDir, 'skill.md'), prompt);

    const result = loadSkill(skillDir);
    expect(result.prompt).toBe(prompt);
  });

  it('discovers colocated scripts', () => {
    const skillDir = join(testDir, 'qr_code');
    mkdirSync(skillDir, { recursive: true });
    writeFileSync(join(skillDir, 'skill.md'), '# QR Code');
    writeFileSync(join(skillDir, 'generate_qr.py'), 'print("qr")');
    writeFileSync(join(skillDir, 'migrate.ts'), 'export {}');
    writeFileSync(join(skillDir, 'notes.txt'), 'notes');

    const result = loadSkill(skillDir);
    expect(result.scripts).toHaveLength(2);
    expect(result.scripts.map(script => script.name).sort()).toEqual(['generate_qr', 'migrate']);
    expect(result.scripts.map(script => script.language).sort()).toEqual(['python', 'typescript']);
  });

  it('extracts name from directory name', () => {
    const skillDir = join(testDir, 'codemod');
    mkdirSync(skillDir, { recursive: true });
    writeFileSync(join(skillDir, 'skill.md'), '# Codemod');

    const result = loadSkill(skillDir);
    expect(result.name).toBe('codemod');
  });
});

describe('detectScriptLanguage', () => {
  it('maps .py to python', () => {
    const result = detectScriptLanguage('script.py');
    expect(result).toBe('python');
  });

  it('maps .ts to typescript', () => {
    const result = detectScriptLanguage('script.ts');
    expect(result).toBe('typescript');
  });
});

