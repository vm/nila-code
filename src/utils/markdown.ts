import { FormattedTextPartType } from '../shared/types';
import { isValidColor } from './color-mapping';

export function extractDescription(content: string): string {
  const trimmed = content.trim();
  if (!trimmed) {
    return '';
  }

  const headingMatch = trimmed.match(/^#{1,6}\s+(.+)$/m);
  if (headingMatch) {
    return headingMatch[1].trim();
  }

  const firstLine = trimmed.split('\n')[0].trim();
  return firstLine || '';
}

export type FormattedTextPart = {
  type: FormattedTextPartType;
  content: string;
  color?: string;
};

function isEscaped(content: string, index: number): boolean {
  let backslashes = 0;
  for (let i = index - 1; i >= 0; i--) {
    if (content[i] !== '\\') break;
    backslashes += 1;
  }
  return backslashes % 2 === 1;
}

function findNextUnescaped(
  content: string,
  token: string,
  startIndex: number
): number {
  for (let i = startIndex; i <= content.length - token.length; i++) {
    if (content.startsWith(token, i) && !isEscaped(content, i)) {
      return i;
    }
  }
  return -1;
}

function unescapeText(content: string): string {
  let result = '';
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (char === '\\' && i + 1 < content.length) {
      result += content[i + 1];
      i += 1;
      continue;
    }
    result += char;
  }
  return result;
}

export function parseMarkdown(content: string): FormattedTextPart[] {
  if (content === '') {
    return [{ type: FormattedTextPartType.TEXT, content: '' }];
  }

  const parts: FormattedTextPart[] = [];
  let buffer = '';
  let i = 0;

  const flushBuffer = () => {
    if (!buffer) return;
    parts.push({ type: FormattedTextPartType.TEXT, content: buffer });
    buffer = '';
  };

  while (i < content.length) {
    const current = content[i];

    if (current === '\\') {
      if (i + 1 < content.length) {
        buffer += content[i + 1];
        i += 2;
        continue;
      }
      buffer += '\\';
      i += 1;
      continue;
    }

    if (
      content.startsWith('{color:', i) &&
      !isEscaped(content, i)
    ) {
      const startTagEnd = findNextUnescaped(content, '}', i + 7);
      if (startTagEnd !== -1) {
        const colorName = content.slice(i + 7, startTagEnd).trim();
        const endTagStart = findNextUnescaped(
          content,
          '{/color}',
          startTagEnd + 1
        );
        if (endTagStart !== -1) {
          const rawInner = content.slice(startTagEnd + 1, endTagStart);
          const inner = unescapeText(rawInner);
          const color = isValidColor(colorName) ? colorName : undefined;
          flushBuffer();
          parts.push({
            type: FormattedTextPartType.TEXT,
            content: inner,
            color,
          });
          i = endTagStart + '{/color}'.length;
          continue;
        }
      }
    }

    if (current === '`' && !isEscaped(content, i)) {
      const end = findNextUnescaped(content, '`', i + 1);
      if (end !== -1) {
        const rawInner = content.slice(i + 1, end);
        const inner = unescapeText(rawInner);
        flushBuffer();
        parts.push({
          type: FormattedTextPartType.INLINE_CODE,
          content: inner,
        });
        i = end + 1;
        continue;
      }
    }

    if (content.startsWith('**', i) && !isEscaped(content, i)) {
      const end = findNextUnescaped(content, '**', i + 2);
      if (end !== -1 && end > i + 2) {
        const rawInner = content.slice(i + 2, end);
        const inner = unescapeText(rawInner);
        flushBuffer();
        parts.push({
          type: FormattedTextPartType.BOLD,
          content: inner,
        });
        i = end + 2;
        continue;
      }
    }

    if (current === '*' && !isEscaped(content, i)) {
      const end = findNextUnescaped(content, '*', i + 1);
      if (end !== -1 && end > i + 1) {
        const rawInner = content.slice(i + 1, end);
        const inner = unescapeText(rawInner);
        flushBuffer();
        parts.push({
          type: FormattedTextPartType.ITALIC,
          content: inner,
        });
        i = end + 1;
        continue;
      }
    }

    buffer += current;
    i += 1;
  }

  flushBuffer();

  if (parts.length === 0) {
    return [{ type: FormattedTextPartType.TEXT, content }];
  }

  return parts;
}

