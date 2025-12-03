
export interface StepDetail {
  title: string;
  instruction: string;
  detailedDescription: string;
  tip: string;
  caution: string;
}

export interface GroundedMaterial {
  material: string;
  searchUrl: string;
  snippet: string;
}

export interface UpcycleProject {
  id: string; // Unique ID for saving
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  timeEstimate: string;
  materialsNeeded: string[];
  steps: StepDetail[] | string[]; // Union type for backward compatibility
  searchQuery: string;
  generatedImage?: string; // Optional base64 image of the result
  groundedMaterials?: GroundedMaterial[]; // For premium search results
}

export interface AnalysisResult {
  identifiedItem: string;
  projects: UpcycleProject[];
}

export type AppState = 'landing' | 'camera' | 'analyzing' | 'results' | 'saved' | 'tutorial' | 'profile' | 'error' | 'search';

export interface HistoryItem {
  id: string;
  projectId?: string;
  type: 'scan' | 'build';
  itemName: string; // The item scanned or project built
  date: string;
  xpGained: number;
  result?: AnalysisResult; // Cache the full result for instant re-opening
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: 'first_step' | 'streak_master' | 'expert_builder' | 'scavenger_king';
  unlocked: boolean;
  unlockedAt?: string;
}

export type Theme = 'light' | 'dark';

export type ProjectCategory = 'All' | 'Decor' | 'Organization' | 'Garden' | 'Fashion' | 'Kids' | 'Furniture';

export interface UserProfile {
  xp: number;
  level: number;
  scansCount: number;
  buildsCount: number;
  completedProjectIds: string[];
  history: HistoryItem[];
  streak: number;
  lastActiveDate: string; // ISO Date
  achievements: Achievement[];
  isPremium: boolean;
  settings: {
    theme: Theme;
  };
}

export interface LevelData {
  level: number;
  title: string;
  minXp: number;
}

export const LEVELS: LevelData[] = [
  { level: 1, title: "Scavenger", minXp: 0 },
  { level: 2, title: "Tinkerer", minXp: 100 },
  { level: 3, title: "Maker", minXp: 300 },
  { level: 4, title: "Upcycler", minXp: 600 },
  { level: 5, title: "Eco-Artisan", minXp: 1000 },
  { level: 6, title: "Planet Saver", minXp: 1500 },
  { level: 7, title: "Trash-to-Treasure Master", minXp: 2200 },
];
