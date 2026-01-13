import { describe, it, expect } from 'bun:test';
import { ToolName } from '../../src/shared/types';
import { countLines, formatToolCallName, formatToolCallTarget, generateUnifiedDiff, getFileName } from '../../src/shared/tool-formatting';

describe('tool-formatting', () => {
  it('getFileName returns the last path segment, and falls back when path ends with /', () => {
    expect(getFileName('src/agent/types.ts')).toBe('types.ts');
    expect(getFileName('/a/b/')).toBe('/a/b/');
  });

  it('formatToolCallName uses friendly names and falls back by replacing underscores', () => {
    expect(formatToolCallName(ToolName.READ_FILE)).toBe('read file');
    expect(formatToolCallName('custom_tool_name')).toBe('custom tool name');
  });

  it('formatToolCallTarget formats command, truncates long commands, and formats paths', () => {
    expect(formatToolCallTarget(ToolName.RUN_COMMAND, { command: 'bun test' })).toBe('bun test');
    const longCommand = 'x'.repeat(100);
    const formatted = formatToolCallTarget(ToolName.RUN_COMMAND, { command: longCommand });
    expect(formatted).toEndWith('…');
    expect(formatted?.length).toBeLessThanOrEqual(61);
    expect(formatToolCallTarget(ToolName.LIST_FILES, { path: '.' })).toBe('./');
    expect(formatToolCallTarget(ToolName.READ_FILE, { path: 'src/agent/types.ts' })).toBe('types.ts');
    expect(formatToolCallTarget('custom', { path: 'src/agent/types.ts' })).toBe('types.ts');
    expect(formatToolCallTarget('custom', {})).toBeNull();
  });

  it('countLines counts empty strings as 0 and counts newline-separated strings', () => {
    expect(countLines('')).toBe(0);
    expect(countLines('a')).toBe(1);
    expect(countLines('a\nb\nc')).toBe(3);
  });

  it('generateUnifiedDiff renders creation diffs and truncates after 50 lines', () => {
    const newStr = Array.from({ length: 80 }, (_, i) => `line ${i + 1}`).join('\n');
    const diff = generateUnifiedDiff('', newStr, 'new.ts').join('\n');
    expect(diff).toContain('@@ -0,0 +1,80 @@');
    expect(diff).toContain('+ line 50');
    expect(diff).not.toContain('+ line 51');
    expect(diff).toContain('truncated, showing 50 of 80 lines');
  });

  it('generateUnifiedDiff includes context lines after changes', () => {
    const oldStr = ['same-1', 'same-2', 'old-3', 'same-4'].join('\n');
    const newStr = ['same-1', 'same-2', 'new-3', 'same-4'].join('\n');
    const diff = generateUnifiedDiff(oldStr, newStr, 'file.ts').join('\n');
    expect(diff).toContain('  same-1');
    expect(diff).toContain('  same-2');
    expect(diff).toContain('- old-3');
    expect(diff).toContain('+ new-3');
    expect(diff).toContain('  same-4');
  });

  it('generateUnifiedDiff appends trailing context beyond the initial 50 lines', () => {
    const oldLines = Array.from({ length: 55 }, (_, i) => `line ${i + 1}`);
    const newLines = [...oldLines];
    oldLines[49] = 'old change';
    newLines[49] = 'new change';
    const diff = generateUnifiedDiff(oldLines.join('\n'), newLines.join('\n'), 'file.ts').join('\n');
    expect(diff).toContain('- old change');
    expect(diff).toContain('+ new change');
    expect(diff).toContain('  line 51');
  });

  it('generateUnifiedDiff stops trailing context when lines diverge after the initial 50 lines', () => {
    const oldLines = Array.from({ length: 55 }, (_, i) => `line ${i + 1}`);
    const newLines = [...oldLines];
    oldLines[49] = 'old change';
    newLines[49] = 'new change';
    oldLines[50] = 'old diverge';
    newLines[50] = 'new diverge';
    const diff = generateUnifiedDiff(oldLines.join('\n'), newLines.join('\n'), 'file.ts').join('\n');
    expect(diff).toContain('- old change');
    expect(diff).toContain('+ new change');
    expect(diff).not.toContain('  line 51');
  });

  it('generateUnifiedDiff falls back when content is identical', () => {
    const str = ['a', 'b', 'c'].join('\n');
    const diff = generateUnifiedDiff(str, str, 'same.ts').join('\n');
    expect(diff).toContain('@@ -1,3 +1,3 @@');
    expect(diff).toContain('  a');
    expect(diff).toContain('  b');
    expect(diff).toContain('  c');
  });

  it('generateUnifiedDiff truncates display when a diff hunk exceeds the display limit', () => {
    const oldLines = [
      ...Array.from({ length: 23 }, (_, i) => `old ${i + 1}`),
      'same 24',
      'same 25',
      'same 26',
      'old 27',
      ...Array.from({ length: 40 }, (_, i) => `tail ${i + 1}`),
    ];

    const newLines = [
      ...Array.from({ length: 23 }, (_, i) => `new ${i + 1}`),
      'same 24',
      'same 25',
      'same 26',
      'new 27',
      ...Array.from({ length: 40 }, (_, i) => `tail ${i + 1}`),
    ];

    const diff = generateUnifiedDiff(oldLines.join('\n'), newLines.join('\n'), 'big.ts').join('\n');
    expect(diff).toContain('truncated, showing 50 of');
  });
});


