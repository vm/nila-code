import { describe, it, expect } from 'bun:test';
import { render } from 'ink-testing-library';
import { TranscriptLines } from '../../src/components/TranscriptLines';

describe('TranscriptLines', () => {
  it('renders the last N lines by default', () => {
    const { lastFrame } = render(
      <TranscriptLines
        height={3}
        lines={[
          { text: 'a' },
          { text: 'b' },
          { text: 'c' },
          { text: 'd' },
          { text: 'e' },
        ]}
      />
    );

    const out = lastFrame();
    expect(out).toContain('c');
    expect(out).toContain('d');
    expect(out).toContain('e');
    expect(out).not.toContain('a');
    expect(out).not.toContain('b');
  });

  it('scrolls up when scrollOffset increases', () => {
    const { lastFrame } = render(
      <TranscriptLines
        height={2}
        scrollOffset={1}
        lines={[{ text: '1' }, { text: '2' }, { text: '3' }, { text: '4' }]}
      />
    );

    const out = lastFrame();
    expect(out).toContain('2');
    expect(out).toContain('3');
    expect(out).not.toContain('4');
  });
});
