export type Command = {
  name: string;
  description: string;
  path: string;
  content: string;
};

export type CommandInvocation = {
  name: string;
  args: string;
};

export type ParsedInput =
  | { type: 'command'; invocation: CommandInvocation }
  | { type: 'message'; text: string };
