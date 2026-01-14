import type { CommandInvocation } from '../commands/types';

export type SkillScript = {
  name: string;
  path: string;
  language: string;
};

export type Skill = {
  name: string;
  description: string;
  path: string;
  prompt: string;
  scripts: SkillScript[];
};

export type SkillInvocation = CommandInvocation & {
  skill: Skill;
  script?: SkillScript;
};

