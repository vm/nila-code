import { describe, it, expect } from 'bun:test';
import { resolveColor, isValidColor } from '../../src/utils/color-mapping';

describe('color-mapping', () => {
  it('resolves basic color names', () => {
    expect(resolveColor('red')).toBe('red');
    expect(resolveColor('green')).toBe('green');
    expect(resolveColor('blue')).toBe('blue');
    expect(resolveColor('yellow')).toBe('yellow');
    expect(resolveColor('cyan')).toBe('cyan');
    expect(resolveColor('magenta')).toBe('magenta');
    expect(resolveColor('white')).toBe('white');
    expect(resolveColor('gray')).toBe('gray');
  });

  it('resolves bright color variants', () => {
    expect(resolveColor('blueBright')).toBe('blueBright');
    expect(resolveColor('redbright')).toBe('redBright');
    expect(resolveColor('GREENBRIGHT')).toBe('greenBright');
  });

  it('handles case insensitive color names', () => {
    expect(resolveColor('RED')).toBe('red');
    expect(resolveColor('Green')).toBe('green');
    expect(resolveColor('BlUe')).toBe('blue');
  });

  it('handles grey as gray', () => {
    expect(resolveColor('grey')).toBe('gray');
    expect(resolveColor('GREY')).toBe('gray');
  });

  it('returns undefined for invalid colors', () => {
    expect(resolveColor('invalid')).toBeUndefined();
    expect(resolveColor('purple')).toBeUndefined();
    expect(resolveColor('')).toBeUndefined();
  });

  it('trims whitespace', () => {
    expect(resolveColor('  red  ')).toBe('red');
    expect(resolveColor('\tgreen\n')).toBe('green');
  });

  it('isValidColor returns true for valid colors', () => {
    expect(isValidColor('red')).toBe(true);
    expect(isValidColor('green')).toBe(true);
    expect(isValidColor('blueBright')).toBe(true);
  });

  it('isValidColor returns false for invalid colors', () => {
    expect(isValidColor('invalid')).toBe(false);
    expect(isValidColor('purple')).toBe(false);
    expect(isValidColor('')).toBe(false);
  });
});

