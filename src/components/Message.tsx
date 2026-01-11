import { Text, Box } from 'ink';
import { FormattedText } from './FormattedText';
import { MessageRole } from '../agent/types';

type Props = {
  role: MessageRole;
  content: string;
};

export function Message({ role, content }: Props) {
  const isUser = role === MessageRole.USER;
  
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

