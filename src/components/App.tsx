import { useState, useEffect, useRef } from 'react';
import { Box, Text, useApp, useStdout } from 'ink';
import Spinner from 'ink-spinner';
import { Agent } from '../agent/agent';
import { Message } from './Message';
import { ToolCall } from './ToolCall';
import { Input } from './Input';
import { MessageRole, ToolCallStatus, ToolName } from '../agent/types';
import type { ToolCall as ToolCallType } from '../agent/types';
import { cwd } from 'node:process';

type MessageItem = {
  role: MessageRole;
  content: string;
};

type ActiveToolCall = {
  id: string;
  name: string;
  input: Record<string, unknown>;
  status: ToolCallStatus.RUNNING;
};

export function App() {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [toolCalls, setToolCalls] = useState<ToolCallType[]>([]);
  const [activeToolCalls, setActiveToolCalls] = useState<ActiveToolCall[]>([]);
  const activeToolCallsRef = useRef<ActiveToolCall[]>([]);
  
  // Update ref whenever activeToolCalls changes
  useEffect(() => {
    activeToolCallsRef.current = activeToolCalls;
  }, [activeToolCalls]);

  const [agent] = useState(() => {
    return new Agent(undefined, {
      onToolStart: (id, name, input) => {
        setActiveToolCalls(prev => {
          const updated = [...prev, { id, name, input, status: ToolCallStatus.RUNNING }];
          activeToolCallsRef.current = updated;
          return updated;
        });
      },
      onToolComplete: (id, name, input, result, error) => {
        setActiveToolCalls(prev => {
          const updated = prev.filter(tc => tc.id !== id);
          activeToolCallsRef.current = updated;
          return updated;
        });
        setToolCalls(prev => [...prev, {
          name,
          input,
          result,
          error,
        }]);
      },
    });
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [terminalHeight, setTerminalHeight] = useState(stdout.rows || 24);

  // Handle Ctrl+C gracefully
  useEffect(() => {
    const handleExit = () => {
      exit();
    };
    process.on('SIGINT', handleExit);
    return () => {
      process.off('SIGINT', handleExit);
    };
  }, [exit]);

  // Update terminal height on resize
  useEffect(() => {
    const updateSize = () => {
      setTerminalHeight(stdout.rows || 24);
    };
    
    updateSize();
    stdout.on('resize', updateSize);
    
    return () => {
      stdout.off('resize', updateSize);
    };
  }, [stdout]);

  const handleSubmit = async (text: string) => {
    // Add user message
    setMessages(prev => [...prev, { role: MessageRole.USER, content: text }]);
    setIsLoading(true);
    setError(null);
    setToolCalls([]);
    setActiveToolCalls([]);

    try {
      const response = await agent.chat(text);
      
      // Add assistant response
      setMessages(prev => [...prev, { 
        role: MessageRole.ASSISTANT, 
        content: response.text,
      }]);
      
      // Clear active tool calls (they should already be cleared, but just in case)
      setActiveToolCalls([]);
      
      if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setActiveToolCalls([]);
    } finally {
      setIsLoading(false);
    }
  };

  const workingDir = cwd();

  return (
    <Box flexDirection="column" height={terminalHeight}>
      {/* Header Section */}
      {messages.length === 0 && (
        <Box flexDirection="column" paddingX={2} paddingTop={1}>
          <Box>
            <Text color="magenta" bold>coding-agent</Text>
            <Text color="gray"> · </Text>
            <Text color="gray" dimColor>{workingDir}</Text>
          </Box>
          <Box flexDirection="column" marginTop={1}>
            <Text color="gray" dimColor>Try asking:</Text>
            <Text color="white" dimColor>  create a hello.txt file</Text>
            <Text color="white" dimColor>  list all files here</Text>
            <Text color="white" dimColor>  run npm install</Text>
          </Box>
        </Box>
      )}

      {/* Messages and Tool Calls Section */}
      <Box flexDirection="column" paddingX={2} paddingY={1} flexGrow={1}>
        {(() => {
          // Determine if we have a "current turn" in progress or just completed
          const hasCurrentTurn = isLoading || toolCalls.length > 0;
          // Find the last assistant message (if any) - it belongs to the current turn
          const lastAssistantIdx = hasCurrentTurn 
            ? messages.map(m => m.role).lastIndexOf(MessageRole.ASSISTANT)
            : -1;
          
          return (
            <>
              {/* Render messages, but hold back the last assistant if it's part of current turn */}
              {messages.map((msg, idx) => {
                // Skip the last assistant message if we have tool calls (render it after)
                if (idx === lastAssistantIdx && toolCalls.length > 0) {
                  return null;
                }
                return (
                  <Box key={idx} flexDirection="column" marginTop={idx > 0 ? 1 : 0}>
                    <Message role={msg.role} content={msg.content} />
                  </Box>
                );
              })}
              
              {/* Active Tool Calls (running) */}
              {activeToolCalls.length > 0 && (
                <Box>
                  <Text color="yellow"><Spinner type="dots" /></Text>
                  <Text color="gray"> working...</Text>
                </Box>
              )}
              
              {/* Completed Tool Calls - grouped by type */}
              {(() => {
                const reads = toolCalls.filter(tc => tc.name === ToolName.READ_FILE);
                const edits = toolCalls.filter(tc => tc.name === ToolName.EDIT_FILE);
                const runs = toolCalls.filter(tc => tc.name === ToolName.RUN_COMMAND);
                
                const getFileName = (path: string) => {
                  const parts = path.split('/');
                  return parts[parts.length - 1] || path;
                };
                
                return (
                  <>
                    {/* Grouped reads */}
                    {reads.length > 0 && (
                      <Box>
                        <Text color="green">✓</Text>
                        <Text color="gray"> read </Text>
                        <Text color="white">
                          {reads.map(r => getFileName(String(r.input?.file_path || 'file'))).join(', ')}
                        </Text>
                      </Box>
                    )}
                    {/* Individual edits (show diff) */}
                    {edits.map((tc, idx) => (
                      <Box key={`edit-${idx}`}>
                        <ToolCall
                          name={tc.name}
                          input={tc.input}
                          status={tc.error ? ToolCallStatus.ERROR : ToolCallStatus.DONE}
                          result={tc.result}
                        />
                      </Box>
                    ))}
                    {/* Individual runs */}
                    {runs.map((tc, idx) => (
                      <Box key={`run-${idx}`}>
                        <ToolCall
                          name={tc.name}
                          input={tc.input}
                          status={tc.error ? ToolCallStatus.ERROR : ToolCallStatus.DONE}
                          result={tc.result}
                        />
                      </Box>
                    ))}
                  </>
                );
              })()}
              
              {/* Now render the last assistant message (after tool calls) */}
              {lastAssistantIdx >= 0 && toolCalls.length > 0 && (
                <Box flexDirection="column" marginTop={1}>
                  <Message role={MessageRole.ASSISTANT} content={messages[lastAssistantIdx].content} />
                </Box>
              )}
              
              {/* Loading indicator */}
              {isLoading && activeToolCalls.length === 0 && (
                <Box marginTop={1}>
                  <Text color="yellow"><Spinner type="dots" /></Text>
                  <Text color="gray" dimColor> thinking...</Text>
                </Box>
              )}
              {error && (
                <Box>
                  <Text color="red">error: {error}</Text>
                </Box>
              )}
            </>
          );
        })()}
      </Box>

      {/* Input - always at bottom */}
      <Box paddingX={2} paddingBottom={1}>
        <Input onSubmit={handleSubmit} disabled={isLoading} />
      </Box>
    </Box>
  );
}

