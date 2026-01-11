import { Text, Box } from 'ink';
import { FormattedText } from './FormattedText';

type Props = {
  role: 'user' | 'assistant';
  content: string;
};

export function Message({ role, content }: Props) {
  const isUser = role === 'user';
  const label = isUser ? 'You' : 'Claude';
  const labelColor = isUser ? 'cyan' : 'magenta';
  const icon = isUser ? '👤' : '🤖';
  
  return (
    <Box flexDirection="column" paddingX={1} marginBottom={1}>
      <Box marginBottom={0}>
        <Text>
          <Text color={labelColor} bold>
            {icon} {label}
          </Text>
        </Text>
      </Box>
      <Box paddingLeft={3} marginTop={0} flexDirection="column">
        <FormattedText content={content} />
      </Box>
    </Box>
  );
}

