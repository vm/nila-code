import { useState, useEffect, useRef } from 'react';
import { Box, Text, useApp, useStdout } from 'ink';
import Spinner from 'ink-spinner';
import { Agent } from '../agent/agent';
import { Message } from './Message';
import { ToolCall } from './ToolCall';
import { Input } from './Input';
import { MessageRole, ToolCallStatus } from '../agent/types';
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
  
  useEffect(() => {
    activeToolCallsRef.current = activeToolCalls;
  }, [activeToolCalls]);

  const [agent] = useState(() => {
    return new Agent(undefined, {
      onToolStart: (id, name, input) => {
        setActiveToolCalls(prev => {
          const updated = [...prev, { id, name, input, status: ToolCallStatus.RUNNING as const }];
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
        setToolCalls(prev => [...prev, { name, input, result, error }]);
      },
    });
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [terminalHeight, setTerminalHeight] = useState(stdout.rows || 24);

  useEffect(() => {
    const handleExit = () => exit();
    process.on('SIGINT', handleExit);
    return () => { process.off('SIGINT', handleExit); };
  }, [exit]);

  useEffect(() => {
    const updateSize = () => setTerminalHeight(stdout.rows || 24);
    updateSize();
    stdout.on('resize', updateSize);
    return () => { stdout.off('resize', updateSize); };
  }, [stdout]);

  const handleSubmit = async (text: string) => {
    setMessages(prev => [...prev, { role: MessageRole.USER, content: text }]);
    setIsLoading(true);
    setError(null);
    setToolCalls([]);
    setActiveToolCalls([]);

    try {
      const response = await agent.chat(text);
      setMessages(prev => [...prev, { role: MessageRole.ASSISTANT, content: response.text }]);
      setActiveToolCalls([]);
      if (response.error) setError(response.error);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setActiveToolCalls([]);
    } finally {
      setIsLoading(false);
    }
  };

  const workingDir = cwd();


  const hasCurrentTurn = isLoading || toolCalls.length > 0;
  const lastAssistantIdx = hasCurrentTurn 
    ? messages.map(m => m.role).lastIndexOf(MessageRole.ASSISTANT)
    : -1;


  const banner = [
    '███╗   ██╗██╗██╗      █████╗      ██████╗ ██████╗ ██████╗ ███████╗',
    '████╗  ██║██║██║     ██╔══██╗    ██╔════╝██╔═══██╗██╔══██╗██╔════╝',
    '██╔██╗ ██║██║██║     ███████║    ██║     ██║   ██║██║  ██║█████╗  ',
    '██║╚██╗██║██║██║     ██╔══██║    ██║     ██║   ██║██║  ██║██╔══╝  ',
    '██║ ╚████║██║███████╗██║  ██║    ╚██████╗╚██████╔╝██████╔╝███████╗',
    '╚═╝  ╚═══╝╚═╝╚══════╝╚═╝  ╚═╝     ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝',
  ];

  const gradientColors = ['#ff6b6b', '#feca57', '#48dbfb', '#1dd1a1', '#5f27cd', '#ff9ff3'];

  return (
    <Box flexDirection="column" height={terminalHeight}>
      {messages.length === 0 && (
        <Box flexDirection="column" alignItems="center" justifyContent="center" flexGrow={1}>
          <Box flexDirection="column">
            {banner.map((line, i) => (
              <Text key={i} color={gradientColors[i]}>{line}</Text>
            ))}
          </Box>
          
          <Box marginTop={2}>
            <Text color="gray" dimColor>{workingDir}</Text>
          </Box>
        </Box>
      )}

      <Box flexDirection="column" paddingX={2} paddingY={1} flexGrow={1}>
        {messages.map((msg, idx) => {
          if (idx === lastAssistantIdx && toolCalls.length > 0) return null;
          return (
            <Box key={idx} marginTop={idx > 0 ? 1 : 0}>
              <Message role={msg.role} content={msg.content} />
            </Box>
          );
        })}
        
        {isLoading && activeToolCalls.length === 0 && toolCalls.length === 0 && (
          <Box marginTop={messages.length > 0 ? 1 : 0}>
            <Text color="yellow"><Spinner type="dots" /></Text>
            <Text color="gray"> thinking</Text>
          </Box>
        )}

        {activeToolCalls.length > 0 && (
          <Box marginTop={messages.length > 0 ? 1 : 0} flexDirection="column">
            {activeToolCalls.map(tc => (
              <ToolCall
                key={tc.id}
                name={tc.name}
                input={tc.input}
                status={ToolCallStatus.RUNNING}
              />
            ))}
          </Box>
        )}

        {toolCalls.length > 0 && (
          <Box flexDirection="column" marginTop={messages.length > 0 && activeToolCalls.length === 0 ? 1 : 0}>
            {toolCalls.map((tc, idx) => (
              <ToolCall
                key={idx}
                name={tc.name}
                input={tc.input}
                status={tc.error ? ToolCallStatus.ERROR : ToolCallStatus.DONE}
                result={tc.result}
              />
            ))}
          </Box>
        )}
        
        {lastAssistantIdx >= 0 && toolCalls.length > 0 && (
          <Box marginTop={1}>
            <Message role={MessageRole.ASSISTANT} content={messages[lastAssistantIdx].content} />
          </Box>
        )}
        
        {error && (
          <Box marginTop={1}>
            <Text color="red">error: {error}</Text>
          </Box>
        )}
      </Box>

      <Box paddingX={2} paddingBottom={1}>
        <Input onSubmit={handleSubmit} disabled={isLoading} />
      </Box>
    </Box>
  );
}
