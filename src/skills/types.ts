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
