import { useState } from 'react';
import { useInput } from 'ink';
import { Text, Box } from 'ink';
import Spinner from 'ink-spinner';

type Props = {
  onSubmit: (text: string) => void;
  disabled?: boolean;
};

export type InputKey = {
  return: boolean;
  backspace: boolean;
  delete: boolean;
  ctrl: boolean;
  meta: boolean;
};

export function applyInputEvent(
  prevValue: string,
  input: string,
  key: InputKey
): { nextValue: string; submitted: string | null } {
  if (key.return) {
    const trimmed = prevValue.trim();
    if (trimmed) return { nextValue: '', submitted: trimmed };
    return { nextValue: prevValue, submitted: null };
  }

  if (key.backspace || key.delete) {
    return { nextValue: prevValue.slice(0, -1), submitted: null };
  }

  if (!key.ctrl && !key.meta && input) {
    return { nextValue: prevValue + input, submitted: null };
  }

  return { nextValue: prevValue, submitted: null };
}

export function Input({ onSubmit, disabled = false }: Props) {
  const [value, setValue] = useState('');

  useInput((input, key) => {
    if (disabled) return;

    let submitted: string | null = null;
    setValue((prev) => {
      const result = applyInputEvent(prev, input, key);
      submitted = result.submitted;
      return result.nextValue;
    });
    if (submitted) onSubmit(submitted);
  });

  if (disabled) {
    return (
      <Box>
        <Text color="yellow">
          <Spinner type="dots" />
        </Text>
      </Box>
    );
  }

  return (
    <Box>
      <Text color="cyan" bold>
        ›
      </Text>
      <Text> </Text>
      {value.length > 0 ? (
        <Text color="white">{value}</Text>
      ) : (
        <Text color="gray" dimColor>
          ask anything...
        </Text>
      )}
      <Text color="cyan">▎</Text>
    </Box>
  );
}
