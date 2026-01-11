import { Text, Box } from 'ink';
import Spinner from 'ink-spinner';

type Props = {
  name: string;
  input?: Record<string, unknown>;
  status: 'running' | 'done' | 'error';
  result?: string;
};

function getShortToolName(name: string): string {
  const map: Record<string, string> = {
    'read_file': 'read',
    'edit_file': 'edit',
    'list_files': 'list',
    'run_command': 'run',
  };
  return map[name] || name.replace(/_/g, ' ');
}

function getMainInput(name: string, input: Record<string, unknown>): string | null {
  if (input.file_path) return String(input.file_path);
  if (input.directory) return String(input.directory);
  if (input.command) return String(input.command).slice(0, 50);
  return null;
}

export function ToolCall({ name, input, status, result }: Props) {
  const shortName = getShortToolName(name);
  const mainInput = input ? getMainInput(name, input) : null;
  
  if (status === 'running') {
    return (
      <Box>
        <Text color="yellow"><Spinner type="dots" /></Text>
        <Text color="gray"> {shortName}</Text>
        {mainInput && <Text color="white" dimColor> {mainInput}</Text>}
      </Box>
    );
  }

  if (status === 'error') {
    return (
      <Box flexDirection="column">
        <Box>
          <Text color="red">✗</Text>
          <Text color="gray"> {shortName}</Text>
          {mainInput && <Text color="white" dimColor> {mainInput}</Text>}
        </Box>
        {result && (
          <Box paddingLeft={2}>
            <Text color="red" dimColor wrap="wrap">{result}</Text>
          </Box>
        )}
      </Box>
    );
  }

  // status === 'done'
  return (
    <Box>
      <Text color="green">✓</Text>
      <Text color="gray"> {shortName}</Text>
      {mainInput && <Text color="white" dimColor> {mainInput}</Text>}
    </Box>
  );
}

