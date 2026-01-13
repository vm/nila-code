import { describe, it, expect } from 'bun:test';
import { render } from 'ink-testing-library';
import { FormattedText } from '../../src/components/FormattedText';

describe('FormattedText', () => {
  describe('plain text', () => {
    it('renders simple text', () => {
      const { lastFrame } = render(
        <FormattedText content="Hello, world!" />
      );
      
      expect(lastFrame()).toContain('Hello, world!');
    });

    it('renders multiline text', () => {
      const { lastFrame } = render(
        <FormattedText content="Line 1\nLine 2\nLine 3" />
      );
      
      expect(lastFrame()).toContain('Line 1');
      expect(lastFrame()).toContain('Line 2');
      expect(lastFrame()).toContain('Line 3');
    });
  });

  describe('inline code', () => {
    it('renders single inline code', () => {
      const { lastFrame } = render(
        <FormattedText content="Use `console.log` for debugging" />
      );
      
      expect(lastFrame()).toContain('console.log');
      expect(lastFrame()).toContain('Use');
      expect(lastFrame()).toContain('for debugging');
    });

    it('renders multiple inline codes', () => {
      const { lastFrame } = render(
        <FormattedText content="Call `foo()` then `bar()`" />
      );
      
      expect(lastFrame()).toContain('foo()');
      expect(lastFrame()).toContain('bar()');
      expect(lastFrame()).toContain('Call');
      expect(lastFrame()).toContain('then');
    });

    it('handles inline code at start', () => {
      const { lastFrame } = render(
        <FormattedText content="`npm install` to set up" />
      );
      
      expect(lastFrame()).toContain('npm install');
      expect(lastFrame()).toContain('to set up');
    });

    it('handles inline code at end', () => {
      const { lastFrame } = render(
        <FormattedText content="Run the command `bun test`" />
      );
      
      expect(lastFrame()).toContain('bun test');
      expect(lastFrame()).toContain('Run the command');
    });
  });

  describe('code blocks', () => {
    it('renders code block content', () => {
      const content = `\`\`\`typescript
const x = 1;
const y = 2;
\`\`\``;
      
      const { lastFrame } = render(
        <FormattedText content={content} />
      );
      
      expect(lastFrame()).toContain('const x = 1;');
      expect(lastFrame()).toContain('const y = 2;');
    });

    it('shows language label for code blocks', () => {
      const content = `\`\`\`javascript
console.log("hello");
\`\`\``;
      
      const { lastFrame } = render(
        <FormattedText content={content} />
      );
      
      expect(lastFrame()).toContain('javascript');
      expect(lastFrame()).toContain('console.log');
    });

    it('renders code block without language', () => {
      const content = `\`\`\`
plain code
\`\`\``;
      
      const { lastFrame } = render(
        <FormattedText content={content} />
      );
      
      expect(lastFrame()).toContain('plain code');
    });

    it('renders text before and after code blocks', () => {
      const content = `Before text

\`\`\`typescript
const x = 1;
\`\`\`

After text`;
      
      const { lastFrame } = render(
        <FormattedText content={content} />
      );
      
      expect(lastFrame()).toContain('Before text');
      expect(lastFrame()).toContain('const x = 1;');
      expect(lastFrame()).toContain('After text');
    });

    it('renders multiple code blocks', () => {
      const content = `First block:

\`\`\`typescript
const a = 1;
\`\`\`

Second block:

\`\`\`python
x = 2
\`\`\``;
      
      const { lastFrame } = render(
        <FormattedText content={content} />
      );
      
      expect(lastFrame()).toContain('const a = 1;');
      expect(lastFrame()).toContain('x = 2');
      expect(lastFrame()).toContain('typescript');
      expect(lastFrame()).toContain('python');
    });
  });

  describe('mixed content', () => {
    it('renders inline code and code blocks together', () => {
      const content = `Use \`npm install\` first:

\`\`\`bash
npm install
npm run build
\`\`\`

Then run \`npm start\``;
      
      const { lastFrame } = render(
        <FormattedText content={content} />
      );
      
      expect(lastFrame()).toContain('npm install');
      expect(lastFrame()).toContain('npm run build');
      expect(lastFrame()).toContain('npm start');
    });
  });

  describe('edge cases', () => {
    it('handles empty content', () => {
      const { lastFrame } = render(
        <FormattedText content="" />
      );
      
      expect(lastFrame()).toBeDefined();
    });

    it('handles whitespace-only content', () => {
      const { lastFrame } = render(
        <FormattedText content="   " />
      );
      
      expect(lastFrame()).toBeDefined();
    });
  });
});

