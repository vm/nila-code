import { Text, Box } from 'ink';
import { FormattedText } from './FormattedText';

type Props = {
  role: 'user' | 'assistant';
  content: string;
};

export function Message({ role, content }: Props) {
  const isUser = role === 'user';
  
  return (
    <Box flexDirection="column">
      <Text color={isUser ? 'cyan' : 'magenta'} bold>
        {isUser ? 'you' : 'agent'}
      </Text>
      <Box paddingLeft={2} flexDirection="column">
        <FormattedText content={content} />
      </Box>
    </Box>
  );
}

