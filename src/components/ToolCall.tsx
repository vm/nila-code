import { Text, Box } from 'ink';
import Spinner from 'ink-spinner';

type Props = {
  name: string;
  input?: Record<string, unknown>;
  status: 'running' | 'done' | 'error';
  result?: string;
  count?: number;
};

function formatToolName(name: string): string {
  return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function formatFilePath(path: string): string {
  // Highlight file paths
  if (path.includes('/') || path.includes('\\')) {
    return path;
  }
  return path;
}

function getToolIcon(name: string): string {
  if (name.includes('read')) return '📖';
  if (name.includes('edit') || name.includes('write')) return '✏️';
  if (name.includes('list')) return '📂';
  if (name.includes('run') || name.includes('command')) return '🏃';
  return '🔧';
}

export function ToolCall({ name, input, status, result, count }: Props) {
  const displayName = formatToolName(name);
  const icon = getToolIcon(name);
  
  if (status === 'running') {
    return (
      <Box flexDirection="column" paddingX={1}>
        <Box>
          <Text>
            <Text color="yellow">
              <Spinner type="dots" />
            </Text>
            <Text color="yellow" bold> {icon} </Text>
            <Text color="yellow">{displayName}</Text>
            {count && count > 1 && (
              <Text color="yellow" dimColor> ({count}×)</Text>
            )}
          </Text>
        </Box>
        {input && Object.keys(input).length > 0 && (
          <Box paddingLeft={4} marginTop={0} flexDirection="column">
            {Object.entries(input).slice(0, 2).map(([key, value]) => {
              const val = typeof value === 'string' ? value : JSON.stringify(value);
              const displayVal = val.length > 40 ? val.substring(0, 40) + '...' : val;
              return (
                <Text key={key} wrap="wrap">
                  <Text color="cyan" dimColor>{key}</Text>: <Text color="white">{displayVal}</Text>
                </Text>
              );
            })}
            {Object.keys(input).length > 2 && (
              <Text color="gray" dimColor>...</Text>
            )}
          </Box>
        )}
      </Box>
    );
  }

  if (status === 'error') {
    return (
      <Box flexDirection="column" paddingX={1}>
        <Box>
          <Text>
            <Text color="red" bold>❌ </Text>
            <Text color="red" bold>{icon} </Text>
            <Text color="red" bold>{displayName}</Text>
            {count && count > 1 && (
              <Text color="red" dimColor> ({count}×)</Text>
            )}
          </Text>
        </Box>
        {result && (
          <Box paddingLeft={4} marginTop={0}>
            <Text color="red" dimColor wrap="wrap">{result}</Text>
          </Box>
        )}
      </Box>
    );
  }

  // status === 'done'
  return (
    <Box flexDirection="column" paddingX={1}>
      <Box>
        <Text>
          <Text color="green" bold>✓ </Text>
          <Text color="green" bold>{icon} </Text>
          <Text color="green">{displayName}</Text>
          {count && count > 1 && (
            <Text color="green" dimColor> ({count}×)</Text>
          )}
        </Text>
      </Box>
        {input && Object.keys(input).length > 0 && (
          <Box paddingLeft={4} marginTop={0} flexDirection="column">
            {Object.entries(input).slice(0, 2).map(([key, value]) => {
              const val = typeof value === 'string' ? formatFilePath(value) : JSON.stringify(value);
              const displayVal = val.length > 50 ? val.substring(0, 50) + '...' : val;
              return (
                <Text key={key} wrap="wrap">
                  <Text color="cyan" dimColor>{key}</Text>: <Text color="white">{displayVal}</Text>
                </Text>
              );
            })}
            {Object.keys(input).length > 2 && (
              <Text color="gray" dimColor>...</Text>
            )}
          </Box>
        )}
      {result && result.length > 0 && (
        <Box paddingLeft={4} marginTop={0}>
          <Text color="gray" dimColor wrap="wrap">
            {result.length > 300 ? result.substring(0, 300) + '...' : result}
          </Text>
        </Box>
      )}
    </Box>
  );
}

