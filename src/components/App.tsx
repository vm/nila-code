import { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Text, useApp, useStdout } from 'ink';
import { Agent } from '../agent/agent';
import { Message } from './Message';
import { ToolCall } from './ToolCall';
import { Input } from './Input';
import type { ToolCall as ToolCallType } from '../agent/types';
import { cwd } from 'node:process';

type MessageItem = {
  role: 'user' | 'assistant';
  content: string;
  tokenUsage?: { input: number; output: number };
};

type ActiveToolCall = {
  name: string;
  input: Record<string, unknown>;
  status: 'running';
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
      onToolStart: (name, input) => {
        setActiveToolCalls(prev => {
          const updated = [...prev, { name, input, status: 'running' }];
          activeToolCallsRef.current = updated;
          return updated;
        });
      },
      onToolComplete: (name, result, error) => {
        setActiveToolCalls(prev => {
          const updated = prev.filter(tc => tc.name !== name);
          activeToolCallsRef.current = updated;
          return updated;
        });
        setToolCalls(prev => {
          const toolInput = activeToolCallsRef.current.find(tc => tc.name === name)?.input || {};
          return [...prev, {
            name,
            input: toolInput,
            result,
            error,
          }];
        });
      },
    });
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [terminalHeight, setTerminalHeight] = useState(stdout.rows || 24);
  const [totalTokens, setTotalTokens] = useState({ input: 0, output: 0 });

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
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setIsLoading(true);
    setError(null);
    setToolCalls([]);
    setActiveToolCalls([]);

    try {
      const response = await agent.chat(text);
      
      // Update token usage
      if (response.tokenUsage) {
        setTotalTokens(prev => ({
          input: prev.input + response.tokenUsage!.input,
          output: prev.output + response.tokenUsage!.output,
        }));
      }
      
      // Add assistant response
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response.text,
        tokenUsage: response.tokenUsage,
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

  const handleClear = useCallback(() => {
    agent.clearHistory();
    setMessages([]);
    setToolCalls([]);
    setActiveToolCalls([]);
    setError(null);
    setTotalTokens({ input: 0, output: 0 });
  }, [agent]);

  const workingDir = cwd();

  return (
    <Box flexDirection="column" padding={0}>
      {/* Header Section */}
      {messages.length === 0 && (
        <Box 
          flexDirection="column" 
          paddingX={2} 
          paddingY={1} 
          borderBottom 
          borderStyle="single" 
          borderColor="cyan"
        >
          <Box marginBottom={1}>
            <Text>
              <Text color="cyan" bold>🤖 </Text>
              <Text color="cyan" bold>Coding Agent</Text>
            </Text>
          </Box>
          <Box marginBottom={1}>
            <Text>
              <Text color="blue" dimColor>📁 </Text>
              <Text color="blue" dimColor wrap="wrap">{workingDir}</Text>
            </Text>
          </Box>
          <Box flexDirection="column" marginTop={1}>
            <Text color="yellow" bold>💡 Examples:</Text>
            <Text color="green" dimColor wrap="wrap">  • Create a file called hello.txt with 'Hello World'</Text>
            <Text color="green" dimColor wrap="wrap">  • List all files in the current directory</Text>
            <Text color="green" dimColor wrap="wrap">  • Read the package.json file</Text>
            <Text color="green" dimColor wrap="wrap">  • Run the command: ls -la</Text>
          </Box>
        </Box>
      )}

      {/* Token Usage Display */}
      {totalTokens.input > 0 && (
        <Box 
          paddingX={2} 
          paddingY={1} 
          borderBottom 
          borderStyle="single" 
          borderColor="magenta"
          backgroundColor="black"
        >
          <Text>
            <Text color="magenta" bold>📊 </Text>
            <Text color="magenta" dimColor wrap="wrap">
              Tokens: <Text color="cyan" bold>{totalTokens.input.toLocaleString()}</Text> in / <Text color="yellow" bold>{totalTokens.output.toLocaleString()}</Text> out
            </Text>
          </Text>
        </Box>
      )}

      {/* Messages and Tool Calls Section */}
      <Box flexDirection="column" paddingX={2} paddingY={1} flexGrow={1}>
        {messages.map((msg, idx) => {
          // Only show user messages here - assistant messages will be shown after tool calls
          if (msg.role === 'user') {
            return (
              <Box key={idx} flexDirection="column" marginBottom={1}>
                <Message role={msg.role} content={msg.content} />
              </Box>
            );
          }
          return null;
        })}
        
        {/* Active Tool Calls (running) - show individually */}
        {activeToolCalls.length > 0 && (
          <Box flexDirection="column" marginTop={messages.filter(m => m.role === 'user').length > 0 ? 1 : 0} marginBottom={1}>
            {activeToolCalls.map((toolCall, idx) => (
              <Box key={idx} marginBottom={1}>
                <ToolCall
                  name={toolCall.name}
                  input={toolCall.input}
                  status="running"
                />
              </Box>
            ))}
          </Box>
        )}
        
        {/* Completed Tool Calls - show grouped when done */}
        {toolCalls.length > 0 && activeToolCalls.length === 0 && (
          <Box flexDirection="column" marginTop={(messages.filter(m => m.role === 'user').length > 0 || activeToolCalls.length > 0) ? 1 : 0} marginBottom={1}>
            {(() => {
              // Group tool calls by name and file_path (if present)
              const grouped = new Map<string, { toolCall: ToolCallType; count: number }>();
              
              for (const toolCall of toolCalls) {
                // Create a key from tool name and file_path if it exists
                const filePath = toolCall.input.file_path as string | undefined;
                const key = filePath 
                  ? `${toolCall.name}:${filePath}`
                  : `${toolCall.name}:${JSON.stringify(toolCall.input)}`;
                
                if (grouped.has(key)) {
                  const existing = grouped.get(key)!;
                  existing.count++;
                  // Use the latest tool call's result
                  existing.toolCall = toolCall;
                } else {
                  grouped.set(key, { toolCall, count: 1 });
                }
              }
              
              return Array.from(grouped.values()).map(({ toolCall, count }, idx) => (
                <Box key={idx} marginBottom={1}>
                  <ToolCall
                    name={toolCall.name}
                    input={toolCall.input}
                    status={toolCall.error ? 'error' : 'done'}
                    result={toolCall.result}
                    count={count > 1 ? count : undefined}
                  />
                </Box>
              ));
            })()}
          </Box>
        )}
        
        {/* Show completed tool calls individually while still running */}
        {toolCalls.length > 0 && activeToolCalls.length > 0 && (
          <Box flexDirection="column" marginTop={(messages.filter(m => m.role === 'user').length > 0 || activeToolCalls.length > 0) ? 1 : 0} marginBottom={1}>
            {toolCalls.map((toolCall, idx) => (
              <Box key={idx} marginBottom={1}>
                <ToolCall
                  name={toolCall.name}
                  input={toolCall.input}
                  status={toolCall.error ? 'error' : 'done'}
                  result={toolCall.result}
                />
              </Box>
            ))}
          </Box>
        )}
        
        {/* Assistant Messages - shown at the bottom after tool calls */}
        {messages.map((msg, idx) => {
          if (msg.role === 'assistant') {
            return (
              <Box key={idx} flexDirection="column" marginTop={1} marginBottom={2}>
                <Message role={msg.role} content={msg.content} />
                {msg.tokenUsage && (
                  <Box marginTop={0} marginLeft={2}>
                    <Text wrap="wrap">
                      <Text color="magenta" dimColor>(</Text>
                      <Text color="cyan" dimColor>{msg.tokenUsage.input}</Text>
                      <Text color="magenta" dimColor> in / </Text>
                      <Text color="yellow" dimColor>{msg.tokenUsage.output}</Text>
                      <Text color="magenta" dimColor> out tokens)</Text>
                    </Text>
                  </Box>
                )}
              </Box>
            );
          }
          return null;
        })}
        
        {isLoading && activeToolCalls.length === 0 && (
          <Box marginTop={1}>
            <Text>
              <Text color="yellow">⚡ </Text>
              <Text color="yellow" dimColor wrap="wrap">Thinking...</Text>
            </Text>
          </Box>
        )}
        {error && (
          <Box marginTop={1} flexDirection="column" paddingX={1}>
            <Text>
              <Text color="red" bold>❌ </Text>
              <Text color="red" bold wrap="wrap">Error: </Text>
            </Text>
            <Box paddingLeft={2} marginTop={0}>
              <Text color="red" wrap="wrap">{error}</Text>
            </Box>
          </Box>
        )}
      </Box>

      {/* Input Section */}
      <Box 
        borderTop 
        borderStyle="single" 
        borderColor="cyan" 
        paddingX={2} 
        paddingY={1}
        backgroundColor="black"
      >
        <Input onSubmit={handleSubmit} disabled={isLoading} />
      </Box>
    </Box>
  );
}

