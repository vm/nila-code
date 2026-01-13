import { describe, it, expect } from 'bun:test';
import { render } from 'ink-testing-library';
import { Input } from '../../src/components/Input';

describe('Input', () => {
  describe('enabled state', () => {
    it('shows prompt indicator', () => {
      const { lastFrame } = render(
        <Input onSubmit={() => {}} />
      );
      
      expect(lastFrame()).toContain('›');
    });

    it('shows placeholder when empty', () => {
      const { lastFrame } = render(
        <Input onSubmit={() => {}} />
      );
      
      expect(lastFrame()).toContain('ask anything...');
    });

    it('shows cursor indicator', () => {
      const { lastFrame } = render(
        <Input onSubmit={() => {}} />
      );
      
      expect(lastFrame()).toContain('▎');
    });
  });

  describe('disabled state', () => {
    it('hides prompt when disabled', () => {
      const { lastFrame } = render(
        <Input onSubmit={() => {}} disabled={true} />
      );
      
      expect(lastFrame()).not.toContain('›');
      expect(lastFrame()).not.toContain('ask anything...');
    });

    it('hides cursor when disabled', () => {
      const { lastFrame } = render(
        <Input onSubmit={() => {}} disabled={true} />
      );
      
      expect(lastFrame()).not.toContain('▎');
    });
  });

  describe('input logic', () => {
    it('trim function removes whitespace', () => {
      const text = '  hello world  ';
      const trimmed = text.trim();
      expect(trimmed).toBe('hello world');
    });

    it('empty string after trim is falsy', () => {
      const text = '   ';
      const trimmed = text.trim();
      expect(trimmed).toBeFalsy();
    });

    it('non-empty string after trim is truthy', () => {
      const text = '  test  ';
      const trimmed = text.trim();
      expect(trimmed).toBeTruthy();
    });
  });
});
