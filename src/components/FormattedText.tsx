import { Text, Box } from 'ink';
import { FormattedTextPartType } from '../agent/types';

type Props = {
  content: string;
};

/**
 * Parses and formats text content with code blocks and inline code
 * Similar to how Nila Code displays formatted content
 */
function parseInlineCode(text: string): Array<{ type: FormattedTextPartType.TEXT | FormattedTextPartType.INLINE_CODE; content: string }> {
  const parts: Array<{ type: FormattedTextPartType.TEXT | FormattedTextPartType.INLINE_CODE; content: string }> = [];
  const inlineCodeRegex = /`([^`]+)`/g;
  let lastIndex = 0;
  let match;
  
  while ((match = inlineCodeRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: FormattedTextPartType.TEXT,
        content: text.slice(lastIndex, match.index),
      });
    }
    parts.push({
      type: FormattedTextPartType.INLINE_CODE,
      content: match[1],
    });
    lastIndex = match.index + match[0].length;
  }
  
  if (lastIndex < text.length) {
    parts.push({
      type: FormattedTextPartType.TEXT,
      content: text.slice(lastIndex),
    });
  }
  
  return parts.length > 0 ? parts : [{ type: FormattedTextPartType.TEXT, content: text }];
}

export function FormattedText({ content }: Props) {
  const parts: Array<{ type: FormattedTextPartType.TEXT | FormattedTextPartType.CODE; content: string; language?: string }> = [];
  
  // Parse code blocks first (```language\ncode\n```)
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;
  
  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Add text before code block
    if (match.index > lastIndex) {
      const textBefore = content.slice(lastIndex, match.index);
      if (textBefore.trim()) {
        parts.push({ type: FormattedTextPartType.TEXT, content: textBefore });
      }
    }
    
    // Add code block
    parts.push({
      type: FormattedTextPartType.CODE,
      content: match[2],
      language: match[1] || 'text',
    });
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text
  if (lastIndex < content.length) {
    const textAfter = content.slice(lastIndex);
    if (textAfter.trim()) {
      parts.push({ type: FormattedTextPartType.TEXT, content: textAfter });
    }
  }
  
  // If no parts found, treat entire content as text
  if (parts.length === 0) {
    parts.push({ type: FormattedTextPartType.TEXT, content });
  }
  
  // Render parts
  return (
    <Box flexDirection="column">
      {parts.map((part, idx) => {
        if (part.type === FormattedTextPartType.CODE) {
          const lines = part.content.split('\n');
          return (
            <Box key={idx} flexDirection="column" marginY={1}>
              <Box 
                borderStyle="round" 
                borderColor="gray" 
                paddingX={1} 
                paddingY={0}
                flexDirection="column"
              >
                {part.language && part.language !== 'text' && (
                  <Text color="gray" dimColor>{part.language}</Text>
                )}
                <Text color="white" wrap="wrap">
                  {lines.join('\n')}
                </Text>
              </Box>
            </Box>
          );
        }
        
        // Regular text - parse inline code
        const textParts = parseInlineCode(part.content);
        
        return (
          <Box key={idx} flexDirection="column">
            {textParts.map((textPart, textIdx) => {
              if (textPart.type === FormattedTextPartType.INLINE_CODE) {
                return (
                  <Text key={textIdx} color="cyan" wrap="wrap">
                    {textPart.content}
                  </Text>
                );
              }
              return (
                <Text key={textIdx} color="white" wrap="wrap">
                  {textPart.content}
                </Text>
              );
            })}
          </Box>
        );
      })}
    </Box>
  );
}

