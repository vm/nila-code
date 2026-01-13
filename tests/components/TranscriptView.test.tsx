import { describe, it, expect } from 'bun:test';
import { render } from 'ink-testing-library';
import { TranscriptView } from '../../src/components/TranscriptView';
import { MessageRole, ToolCallStatus, ToolName } from '../../src/agent/types';

describe('TranscriptView', () => {
  it('renders a descriptive tool call label with the command', () => {
    const { lastFrame } = render(
      <TranscriptView
        messages={[]}
        toolCalls={[{
          name: ToolName.RUN_COMMAND,
          input: { command: 'bun test' },
          status: ToolCallStatus.DONE,
        }]}
        isLoading={false}
        error={null}
        width={80}
        height={24}
      />
    );

    expect(lastFrame()).toContain('run command: bun test (done)');
  });

  it('truncates long commands', () => {
    const longCommand = 'git commit -m "This is a very long commit message that should be truncated because it exceeds sixty characters"';
    const { lastFrame } = render(
      <TranscriptView
        messages={[]}
        toolCalls={[{
          name: ToolName.RUN_COMMAND,
          input: { command: longCommand },
          status: ToolCallStatus.RUNNING,
        }]}
        isLoading={false}
        error={null}
        width={80}
        height={24}
      />
    );

    expect(lastFrame()).toContain('run command:');
    expect(lastFrame()).toContain('…');
    expect(lastFrame()).not.toContain('truncated');
  });

  it('renders a descriptive tool call label with a filename for read_file', () => {
    const { lastFrame } = render(
      <TranscriptView
        messages={[]}
        toolCalls={[{
          name: ToolName.READ_FILE,
          input: { path: 'src/agent/types.ts' },
          status: ToolCallStatus.DONE,
        }]}
        isLoading={false}
        error={null}
        width={80}
        height={24}
      />
    );

    expect(lastFrame()).toContain('read file: types.ts (done)');
  });

  it('renders a descriptive tool call label with a filename for edit_file', () => {
    const { lastFrame } = render(
      <TranscriptView
        messages={[]}
        toolCalls={[{
          name: ToolName.EDIT_FILE,
          input: { path: 'src/components/App.tsx', old_str: 'old', new_str: 'new' },
          status: ToolCallStatus.RUNNING,
        }]}
        isLoading={false}
        error={null}
        width={80}
        height={24}
      />
    );

    expect(lastFrame()).toContain('edit file: App.tsx (running)');
  });

  it('renders directory path for list_files', () => {
    const { lastFrame } = render(
      <TranscriptView
        messages={[]}
        toolCalls={[{
          name: ToolName.LIST_FILES,
          input: { path: 'src/tools' },
          status: ToolCallStatus.DONE,
        }]}
        isLoading={false}
        error={null}
        width={80}
        height={24}
      />
    );

    expect(lastFrame()).toContain('list files: src/tools (done)');
  });

  it('renders ./ for list_files with current directory', () => {
    const { lastFrame } = render(
      <TranscriptView
        messages={[]}
        toolCalls={[{
          name: ToolName.LIST_FILES,
          input: { path: '.' },
          status: ToolCallStatus.DONE,
        }]}
        isLoading={false}
        error={null}
        width={80}
        height={24}
      />
    );

    expect(lastFrame()).toContain('list files: ./ (done)');
  });
});
