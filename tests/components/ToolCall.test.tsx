import { describe, it, expect } from 'bun:test';
import { render } from 'ink-testing-library';
import { ToolCall } from '../../src/components/ToolCall';
import { ToolCallStatus, ToolName } from '../../src/agent/types';

describe('ToolCall', () => {
  describe('rendering with file paths', () => {
    it('shows filename for read_file', () => {
      const { lastFrame } = render(
        <ToolCall
          name={ToolName.READ_FILE}
          input={{ path: 'src/agent/types.ts' }}
          status={ToolCallStatus.DONE}
        />
      );
      
      expect(lastFrame()).toContain('read file');
      expect(lastFrame()).toContain('types.ts');
    });

    it('shows filename for edit_file', () => {
      const { lastFrame } = render(
        <ToolCall
          name={ToolName.EDIT_FILE}
          input={{ path: 'src/components/App.tsx', old_str: 'old', new_str: 'new' }}
          status={ToolCallStatus.DONE}
        />
      );
      
      expect(lastFrame()).toContain('edit file');
      expect(lastFrame()).toContain('App.tsx');
    });

    it('shows directory path for list_files', () => {
      const { lastFrame } = render(
        <ToolCall
          name={ToolName.LIST_FILES}
          input={{ path: 'src/tools' }}
          status={ToolCallStatus.DONE}
        />
      );
      
      expect(lastFrame()).toContain('list files');
      expect(lastFrame()).toContain('src/tools');
    });

    it('shows ./ for list_files with current directory', () => {
      const { lastFrame } = render(
        <ToolCall
          name={ToolName.LIST_FILES}
          input={{ path: '.' }}
          status={ToolCallStatus.DONE}
        />
      );
      
      expect(lastFrame()).toContain('list files');
      expect(lastFrame()).toContain('./');
    });

    it('shows command for run_command', () => {
      const { lastFrame } = render(
        <ToolCall
          name={ToolName.RUN_COMMAND}
          input={{ command: 'ls -la' }}
          status={ToolCallStatus.DONE}
        />
      );
      
      expect(lastFrame()).toContain('run');
      expect(lastFrame()).toContain('ls -la');
    });

    it('truncates long commands', () => {
      const longCommand = 'git commit -m "This is a very long commit message that should be truncated because it exceeds forty characters"';
      const { lastFrame } = render(
        <ToolCall
          name={ToolName.RUN_COMMAND}
          input={{ command: longCommand }}
          status={ToolCallStatus.DONE}
        />
      );
      
      expect(lastFrame()).toContain('run');
      expect(lastFrame()).toContain('…');
      expect(lastFrame()).not.toContain('truncated');
    });
  });

  describe('status indicators', () => {
    it('shows green checkmark for done status', () => {
      const { lastFrame } = render(
        <ToolCall
          name={ToolName.READ_FILE}
          input={{ path: 'test.ts' }}
          status={ToolCallStatus.DONE}
        />
      );
      
      expect(lastFrame()).toContain('✓');
    });

    it('shows red X for error status', () => {
      const { lastFrame } = render(
        <ToolCall
          name={ToolName.READ_FILE}
          input={{ path: 'test.ts' }}
          status={ToolCallStatus.ERROR}
          result="File not found"
        />
      );
      
      expect(lastFrame()).toContain('✗');
      expect(lastFrame()).toContain('File not found');
    });
  });

  describe('edit file diff info', () => {
    it('shows line counts for edits', () => {
      const { lastFrame } = render(
        <ToolCall
          name={ToolName.EDIT_FILE}
          input={{ 
            path: 'src/test.ts',
            old_str: 'line1\nline2\nline3',
            new_str: 'newline1\nnewline2\nnewline3\nnewline4\nnewline5'
          }}
          status={ToolCallStatus.DONE}
        />
      );
      
      expect(lastFrame()).toContain('+5');
      expect(lastFrame()).toContain('-3');
    });

    it('does not show diff info for read_file', () => {
      const { lastFrame } = render(
        <ToolCall
          name={ToolName.READ_FILE}
          input={{ path: 'src/test.ts' }}
          status={ToolCallStatus.DONE}
        />
      );
      
      expect(lastFrame()).not.toContain('+');
      expect(lastFrame()).not.toContain('-');
    });
  });

  describe('handles missing input gracefully', () => {
    it('renders without input', () => {
      const { lastFrame } = render(
        <ToolCall
          name={ToolName.READ_FILE}
          status={ToolCallStatus.DONE}
        />
      );
      
      expect(lastFrame()).toContain('read file');
    });

    it('renders with empty input', () => {
      const { lastFrame } = render(
        <ToolCall
          name={ToolName.LIST_FILES}
          input={{}}
          status={ToolCallStatus.DONE}
        />
      );
      
      expect(lastFrame()).toContain('list files');
    });
  });
});
