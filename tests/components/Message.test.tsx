import { describe, it, expect } from 'bun:test';
import { render } from 'ink-testing-library';
import { Message } from '../../src/components/Message';
import { MessageRole } from '../../src/agent/types';

describe('Message', () => {
  describe('user messages', () => {
    it('displays "you" label for user messages', () => {
      const { lastFrame } = render(
        <Message role={MessageRole.USER} content="Hello, world!" />
      );
      
      expect(lastFrame()).toContain('you');
      expect(lastFrame()).toContain('Hello, world!');
    });

    it('displays message content inline with label', () => {
      const { lastFrame } = render(
        <Message role={MessageRole.USER} content="Test message" />
      );
      
      expect(lastFrame()).toContain('you');
      expect(lastFrame()).toContain('Test message');
    });
  });

  describe('assistant messages', () => {
    it('displays plain text content', () => {
      const { lastFrame } = render(
        <Message role={MessageRole.ASSISTANT} content="Hi there!" />
      );
      
      expect(lastFrame()).toContain('Hi there!');
    });

    it('renders inline code with backticks', () => {
      const { lastFrame } = render(
        <Message role={MessageRole.ASSISTANT} content="Use the `console.log` function" />
      );
      
      expect(lastFrame()).toContain('console.log');
      expect(lastFrame()).toContain('Use the');
      expect(lastFrame()).toContain('function');
    });

    it('renders code blocks', () => {
      const content = `Here's some code:

\`\`\`typescript
const x = 1;
\`\`\``;
      
      const { lastFrame } = render(
        <Message role={MessageRole.ASSISTANT} content={content} />
      );
      
      expect(lastFrame()).toContain('const x = 1;');
      expect(lastFrame()).toContain('typescript');
    });
  });

  describe('edge cases', () => {
    it('handles empty content', () => {
      const { lastFrame } = render(
        <Message role={MessageRole.USER} content="" />
      );
      
      expect(lastFrame()).toContain('you');
    });

    it('handles multiline content', () => {
      const { lastFrame } = render(
        <Message role={MessageRole.ASSISTANT} content="Line 1\nLine 2\nLine 3" />
      );
      
      expect(lastFrame()).toContain('Line 1');
      expect(lastFrame()).toContain('Line 2');
      expect(lastFrame()).toContain('Line 3');
    });

    it('handles special characters', () => {
      const { lastFrame } = render(
        <Message role={MessageRole.USER} content="Hello <world> & 'friends'" />
      );
      
      expect(lastFrame()).toContain("<world>");
      expect(lastFrame()).toContain("& 'friends'");
    });
  });
});
