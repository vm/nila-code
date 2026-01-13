import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

export type CommandResult = {
  kind: 'command' | 'skill';
  name: string;
  content: string;
  files?: string[];
};

export type ExpandResult =
  | { kind: 'agent'; userText: string; prompt: string }
  | { kind: 'local'; userText: string; outputText: string; error?: boolean };

export function parseSlashCommand(input: string): { name: string; rest: string } | null {
  const trimmed = input.trim();
  if (!trimmed.startsWith('/')) {
    return null;
  }

  const afterSlash = trimmed.slice(1);
  const firstSpaceIndex = afterSlash.search(/\s/);
  
  if (firstSpaceIndex === -1) {
    const name = afterSlash.toLowerCase();
    if (!name) {
      return null;
    }
    return { name, rest: '' };
  }

  const name = afterSlash.slice(0, firstSpaceIndex).toLowerCase();
  const restWithLeadingSpace = afterSlash.slice(firstSpaceIndex);
  const rest = restWithLeadingSpace.replace(/^\s+/, '');

  if (!name) {
    return null;
  }

  return { name, rest };
}

function findProjectCommand(name: string, workingDir: string): CommandResult | null {
  const commandPath = join(workingDir, '.code', 'commands', `${name}.md`);
  if (existsSync(commandPath)) {
    try {
      const content = readFileSync(commandPath, 'utf-8');
      return {
        kind: 'command',
        name,
        content: content.trim(),
      };
    } catch {
      return null;
    }
  }
  return null;
}

function findProjectSkill(name: string, workingDir: string): CommandResult | null {
  const skillDir = join(workingDir, '.code', 'skills', name);
  const skillMdPath = join(skillDir, 'SKILL.md');
  
  if (existsSync(skillMdPath)) {
    try {
      let content = readFileSync(skillMdPath, 'utf-8');
      const skillPath = resolve(skillDir);
      content = content.replace(/\{\{skill_path\}\}/g, skillPath);

      const files: string[] = [];
      if (existsSync(skillDir)) {
        const entries = readdirSync(skillDir);
        for (const entry of entries) {
          if (entry !== 'SKILL.md') {
            const entryPath = join(skillDir, entry);
            const stat = statSync(entryPath);
            if (stat.isFile()) {
              files.push(entry);
            }
          }
        }
      }

      return {
        kind: 'skill',
        name,
        content: content.trim(),
        files: files.length > 0 ? files : undefined,
      };
    } catch {
      return null;
    }
  }
  return null;
}

export function findCommand(name: string, workingDir?: string): CommandResult | null {
  const dir = workingDir || process.cwd();
  const normalizedName = name.toLowerCase();

  const command = findProjectCommand(normalizedName, dir);
  if (command) {
    return command;
  }

  const skill = findProjectSkill(normalizedName, dir);
  if (skill) {
    return skill;
  }

  return null;
}

export function listCommands(workingDir?: string): string[] {
  const dir = workingDir || process.cwd();
  const commands: string[] = [];

  const commandsDir = join(dir, '.code', 'commands');
  if (existsSync(commandsDir)) {
    try {
      const entries = readdirSync(commandsDir);
      for (const entry of entries) {
        if (entry.endsWith('.md')) {
          const name = entry.slice(0, -3);
          commands.push(name);
        }
      }
    } catch {
    }
  }

  const skillsDir = join(dir, '.code', 'skills');
  if (existsSync(skillsDir)) {
    try {
      const entries = readdirSync(skillsDir);
      for (const entry of entries) {
        const skillPath = join(skillsDir, entry);
        const skillMdPath = join(skillPath, 'SKILL.md');
        if (existsSync(skillMdPath)) {
          commands.push(entry);
        }
      }
    } catch {
    }
  }

  return [...new Set(commands)].sort();
}

export function expandInput(input: string, workingDir?: string): ExpandResult {
  const parsed = parseSlashCommand(input);
  
  if (!parsed) {
    return {
      kind: 'agent',
      userText: input,
      prompt: input,
    };
  }

  const { name, rest } = parsed;

  if (name === 'help') {
    const commands = listCommands(workingDir);
    let outputText = 'Available commands:\n\n';
    
    if (commands.length === 0) {
      outputText += 'No commands or skills found.\n';
      outputText += 'Create commands in `.code/commands/<name>.md` or skills in `.code/skills/<name>/SKILL.md`\n';
    } else {
      for (const cmd of commands) {
        outputText += `  /${cmd}\n`;
      }
    }
    
    return {
      kind: 'local',
      userText: input,
      outputText: outputText.trim(),
    };
  }

  const command = findCommand(name, workingDir);
  
  if (!command) {
    return {
      kind: 'local',
      userText: input,
      outputText: `Unknown command: /${name}\nType /help to see available commands.`,
      error: true,
    };
  }

  let prompt = command.content;

  if (command.kind === 'skill' && command.files && command.files.length > 0) {
    prompt += '\n\nFiles in skill:\n';
    for (const file of command.files) {
      prompt += `  ${file}\n`;
    }
  }

  if (rest) {
    prompt += `\n\n${rest}`;
  }

  return {
    kind: 'agent',
    userText: input,
    prompt,
  };
}

