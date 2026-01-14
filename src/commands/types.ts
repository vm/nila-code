export type CommandEntry = {
  name: string;
  description: string;
  path: string;
};

export type ParsedCommand = {
  command: string;
  args: string;
};

