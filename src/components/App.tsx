import { useState, useEffect, useRef } from 'react';
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
      
      // Add assistant response
      setMessages(prev => [...prev, { 
        role: 'assistant', 
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
        {messages.map((msg, idx) => {
          if (msg.role === 'user') {
            return (
              <Box key={idx} flexDirection="column">
                <Message role={msg.role} content={msg.content} />
              </Box>
            );
          }
          return null;
        })}
        
        {/* Active Tool Calls (running) */}
        {activeToolCalls.map((toolCall, idx) => (
          <Box key={`active-${idx}`}>
            <ToolCall
              name={toolCall.name}
              input={toolCall.input}
              status="running"
            />
          </Box>
        ))}
        
        {/* Completed Tool Calls */}
        {toolCalls.map((toolCall, idx) => (
          <Box key={`done-${idx}`}>
            <ToolCall
              name={toolCall.name}
              input={toolCall.input}
              status={toolCall.error ? 'error' : 'done'}
              result={toolCall.result}
            />
          </Box>
        ))}
        
        {/* Assistant Messages */}
        {messages.map((msg, idx) => {
          if (msg.role === 'assistant') {
            return (
              <Box key={idx} flexDirection="column" marginTop={1}>
                <Message role={msg.role} content={msg.content} />
              </Box>
            );
          }
          return null;
        })}
        
        {isLoading && activeToolCalls.length === 0 && (
          <Box>
            <Text color="magenta">●</Text>
            <Text color="gray"> thinking</Text>
          </Box>
        )}
        {error && (
          <Box>
            <Text color="red">error: {error}</Text>
          </Box>
        )}
      </Box>

      {/* Input - always at bottom */}
      <Box paddingX={2} paddingBottom={1}>
        <Input onSubmit={handleSubmit} disabled={isLoading} />
      </Box>
    </Box>
  );
}

