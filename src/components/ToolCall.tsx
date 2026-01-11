import { Text, Box } from 'ink';
import Spinner from 'ink-spinner';

type Props = {
  name: string;
  input?: Record<string, unknown>;
  status: 'running' | 'done' | 'error';
  result?: string;
};

function getToolDescription(name: string, input: Record<string, unknown>): string {
  const filePath = input.file_path ? String(input.file_path) : null;
  const directory = input.directory ? String(input.directory) : null;
  const command = input.command ? String(input.command) : null;
  
  // Get just the filename/dirname for brevity
  const shortPath = (path: string) => {
    const parts = path.split('/');
    return parts[parts.length - 1] || path;
  };
  
  switch (name) {
    case 'read_file':
      return filePath ? `read ${shortPath(filePath)}` : 'read';
    case 'edit_file':
      return filePath ? `edit ${shortPath(filePath)}` : 'edit';
    case 'list_files':
      return directory ? `list ${directory === '.' ? './' : shortPath(directory) + '/'}` : 'list';
    case 'run_command':
      if (command) {
        const truncated = command.length > 40 ? command.slice(0, 40) + '…' : command;
        return `run ${truncated}`;
      }
      return 'run';
    default:
      return name.replace(/_/g, ' ');
  }
}

export function ToolCall({ name, input, status, result }: Props) {
  const description = getToolDescription(name, input || {});
  
  if (status === 'running') {
    return (
      <Box>
        <Text color="yellow"><Spinner type="dots" /></Text>
        <Text color="gray"> {description}</Text>
      </Box>
    );
  }

  if (status === 'error') {
    return (
      <Box flexDirection="column">
        <Box>
          <Text color="red">✗</Text>
          <Text color="gray"> {description}</Text>
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
      <Text color="gray"> {description}</Text>
    </Box>
  );
}

