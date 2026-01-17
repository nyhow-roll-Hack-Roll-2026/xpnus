export enum AchievementType {
  ROOT = 'ROOT',
  TASK = 'TASK',
  GOAL = 'GOAL',
  CHALLENGE = 'CHALLENGE'
}

export enum Category {
  GENERAL = 'General',
  ACADEMIC = 'Academic',
  SOCIAL = 'Social',
  EXPLORATION = 'Exploration'
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  iconName: string; // Mapping to Lucide icon name
  parentId?: string; // For tree structure
  type: AchievementType;
  category: Category;
  globalCompletionRate: number; // Percentage 0-100
  xp: number;
}

export interface UserProgress {
  unlockedIds: string[];
  totalXp: number;
}

export interface User {
  username: string;
  avatarUrl: string;
  createdAt: number;
}
