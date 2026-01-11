import { Text, Box } from 'ink';
import Spinner from 'ink-spinner';
import { ToolCallStatus, ToolName, DiffLineType } from '../agent/types';

type Props = {
  name: string;
  input?: Record<string, unknown>;
  status: ToolCallStatus;
  result?: string;
  showPreview?: boolean;
  count?: number;
};

function getFileName(path: string): string {
  const parts = path.split('/');
  return parts[parts.length - 1] || path;
}

function countLines(str: string): number {
  if (!str) return 0;
  return str.split('\n').length;
}

function getDiffStats(input: Record<string, unknown>): { added: number; removed: number } | null {
  const oldStr = input.old_str as string | undefined;
  const newStr = input.new_str as string | undefined;
  
  if (oldStr === undefined && newStr === undefined) return null;
  
  const removed = countLines(oldStr || '');
  const added = countLines(newStr || '');
  
  // Don't show 0/0
  if (removed === 0 && added === 0) return null;
  
  return { added, removed };
}

const MAX_PREVIEW_LINES = 6;

function DiffPreview({ oldStr, newStr }: { oldStr: string; newStr: string }) {
  const oldLines = oldStr ? oldStr.split('\n') : [];
  const newLines = newStr ? newStr.split('\n') : [];
  
  // Build a simple diff view
  const diffLines: Array<{ type: DiffLineType; content: string }> = [];
  
  // Show removed lines
  for (const line of oldLines) {
    diffLines.push({ type: DiffLineType.REMOVE, content: line });
  }
  
  // Show added lines
  for (const line of newLines) {
    diffLines.push({ type: DiffLineType.ADD, content: line });
  }
  
  // Limit to MAX_PREVIEW_LINES
  const truncated = diffLines.length > MAX_PREVIEW_LINES;
  const displayLines = diffLines.slice(0, MAX_PREVIEW_LINES);
  
  if (displayLines.length === 0) return null;
  
  return (
    <Box flexDirection="column" marginLeft={2} marginTop={0}>
      <Box flexDirection="column" borderStyle="round" borderColor="gray" paddingX={1}>
        {displayLines.map((line, idx) => (
          <Box key={idx}>
            <Text color={line.type === DiffLineType.REMOVE ? 'red' : line.type === DiffLineType.ADD ? 'green' : 'gray'}>
              {line.type === DiffLineType.REMOVE ? '- ' : line.type === DiffLineType.ADD ? '+ ' : '  '}
            </Text>
            <Text 
              color={line.type === DiffLineType.REMOVE ? 'red' : line.type === DiffLineType.ADD ? 'green' : 'white'} 
              dimColor={line.type === DiffLineType.REMOVE}
            >
              {line.content.slice(0, 60)}{line.content.length > 60 ? '…' : ''}
            </Text>
          </Box>
        ))}
        {truncated && (
          <Text color="gray" dimColor>  … {diffLines.length - MAX_PREVIEW_LINES} more lines</Text>
        )}
      </Box>
    </Box>
  );
}

export function ToolCall({ name, input, status, result, showPreview = true, count = 1 }: Props) {
  const safeInput = input || {};
  const filePath = safeInput.file_path ? String(safeInput.file_path) : null;
  const directory = safeInput.directory ? String(safeInput.directory) : null;
  const command = safeInput.command ? String(safeInput.command) : null;
  
  // Determine what to display based on tool type
  const isEdit = name === ToolName.EDIT_FILE;
  const isRead = name === ToolName.READ_FILE;
  const isList = name === ToolName.LIST_FILES;
  const isRun = name === ToolName.RUN_COMMAND;
  
  // Get diff stats for edits
  const diffStats = isEdit ? getDiffStats(safeInput) : null;
  
  // Get old/new strings for preview
  const oldStr = safeInput.old_str as string | undefined;
  const newStr = safeInput.new_str as string | undefined;
  const hasEditContent = isEdit && (oldStr || newStr);
  
  // Choose icon based on tool type
  const getIcon = () => {
    if (status === ToolCallStatus.RUNNING) {
      return <Text color="yellow"><Spinner type="dots" /></Text>;
    }
    if (status === ToolCallStatus.ERROR) {
      return <Text color="red">✗</Text>;
    }
    // done
    if (isEdit) return <Text color="cyan">⚙</Text>;
    if (isRead) return <Text color="green">✓</Text>;
    if (isList) return <Text color="green">✓</Text>;
    if (isRun) return <Text color="green">▶</Text>;
    return <Text color="green">✓</Text>;
  };
  
  // Get the main label
  const getLabel = () => {
    if (isEdit && filePath) return getFileName(filePath);
    if (isRead && filePath) return getFileName(filePath);
    if (isList) {
      if (count > 1) return `scanned ${count} directories`;
      return directory === '.' ? './' : (directory ? directory + '/' : './');
    }
    if (isRun && command) {
      return command.length > 50 ? command.slice(0, 50) + '…' : command;
    }
    return name.replace(/_/g, ' ');
  };
  
  const icon = getIcon();
  const label = getLabel();
  
  if (status === ToolCallStatus.ERROR) {
    return (
      <Box flexDirection="column">
        <Box>
          {icon}
          <Text> </Text>
          <Text color="white">{label}</Text>
        </Box>
        {result && (
          <Box paddingLeft={2}>
            <Text color="red" dimColor wrap="wrap">{result.slice(0, 200)}</Text>
          </Box>
        )}
      </Box>
    );
  }
  
  return (
    <Box flexDirection="column">
      <Box>
        {icon}
        <Text> </Text>
        <Text color="white">{label}</Text>
        {diffStats && (
          <>
            <Text> </Text>
            <Text color="green">+{diffStats.added}</Text>
            <Text> </Text>
            <Text color="red">-{diffStats.removed}</Text>
          </>
        )}
      </Box>
      {showPreview && hasEditContent && status === ToolCallStatus.DONE && (
        <DiffPreview oldStr={oldStr || ''} newStr={newStr || ''} />
      )}
    </Box>
  );
}
