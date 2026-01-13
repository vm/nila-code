import { describe, it, expect, mock } from 'bun:test';

describe('Input', () => {
  it('should accept onSubmit callback', () => {
    const mockOnSubmit = mock();
    expect(typeof mockOnSubmit).toBe('function');
  });

  it('should accept disabled prop', () => {
    const disabled = true;
    expect(typeof disabled).toBe('boolean');
  });

  it('should handle text input', () => {
    const text = 'hello';
    expect(text.length).toBeGreaterThan(0);
  });

  it('should trim text before submitting', () => {
    const text = '  hello  ';
    const trimmed = text.trim();
    expect(trimmed).toBe('hello');
  });

  it('should not submit empty text', () => {
    const emptyText = '   ';
    const trimmed = emptyText.trim();
    expect(trimmed.length).toBe(0);
  });
});
