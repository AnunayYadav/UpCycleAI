
import { UserProfile, Achievement, LEVELS } from '../types';

export const XP_RATES = {
  SCAN: 20,
  BUILD_EASY: 50,
  BUILD_MEDIUM: 100,
  BUILD_HARD: 200,
};

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_step',
    title: 'First Step',
    description: 'Complete your first upcycling project.',
    icon: 'first_step',
    unlocked: false,
  },
  {
    id: 'scavenger_king',
    title: 'Scavenger King',
    description: 'Scan 10 different items.',
    icon: 'scavenger_king',
    unlocked: false,
  },
  {
    id: 'streak_master',
    title: 'Consistency Is Key',
    description: 'Maintain a 3-day activity streak.',
    icon: 'streak_master',
    unlocked: false,
  },
  {
    id: 'expert_builder',
    title: 'Expert Builder',
    description: 'Complete a "Hard" difficulty project.',
    icon: 'expert_builder',
    unlocked: false,
  }
];

export const calculateXP = (type: 'scan' | 'build', difficulty: 'Easy' | 'Medium' | 'Hard' = 'Easy'): number => {
  if (type === 'scan') return XP_RATES.SCAN;
  
  switch(difficulty) {
    case 'Easy': return XP_RATES.BUILD_EASY;
    case 'Medium': return XP_RATES.BUILD_MEDIUM;
    case 'Hard': return XP_RATES.BUILD_HARD;
    default: return XP_RATES.BUILD_EASY;
  }
};

export const checkAchievements = (profile: UserProfile, context?: { difficulty?: string }): Achievement[] => {
  const newAchievements = [...profile.achievements];
  const now = new Date().toISOString();

  // First Step
  if (profile.buildsCount >= 1) {
    const idx = newAchievements.findIndex(a => a.id === 'first_step');
    if (idx !== -1 && !newAchievements[idx].unlocked) {
      newAchievements[idx] = { ...newAchievements[idx], unlocked: true, unlockedAt: now };
    }
  }

  // Scavenger King
  if (profile.scansCount >= 10) {
    const idx = newAchievements.findIndex(a => a.id === 'scavenger_king');
    if (idx !== -1 && !newAchievements[idx].unlocked) {
      newAchievements[idx] = { ...newAchievements[idx], unlocked: true, unlockedAt: now };
    }
  }

  // Streak Master
  if (profile.streak >= 3) {
    const idx = newAchievements.findIndex(a => a.id === 'streak_master');
    if (idx !== -1 && !newAchievements[idx].unlocked) {
      newAchievements[idx] = { ...newAchievements[idx], unlocked: true, unlockedAt: now };
    }
  }

  // Expert Builder
  if (context?.difficulty === 'Hard') {
    const idx = newAchievements.findIndex(a => a.id === 'expert_builder');
    if (idx !== -1 && !newAchievements[idx].unlocked) {
      newAchievements[idx] = { ...newAchievements[idx], unlocked: true, unlockedAt: now };
    }
  }

  return newAchievements;
};

export const updateStreak = (profile: UserProfile): { streak: number, lastActiveDate: string } => {
  const today = new Date();
  const lastActive = new Date(profile.lastActiveDate);
  
  // Normalize to midnight for comparison
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const lastMidnight = new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate()).getTime();
  const oneDay = 24 * 60 * 60 * 1000;

  if (todayMidnight === lastMidnight) {
    // Already active today, no change
    return { streak: profile.streak, lastActiveDate: profile.lastActiveDate };
  } else if (todayMidnight - lastMidnight === oneDay) {
    // Consecutive day
    return { streak: profile.streak + 1, lastActiveDate: today.toISOString() };
  } else {
    // Streak broken (or first time)
    return { streak: 1, lastActiveDate: today.toISOString() };
  }
};

export const ECO_QUOTES = [
  "The greatest threat to our planet is the belief that someone else will save it.",
  "There is no such thing as 'away'. When we throw anything away it must go somewhere.",
  "Refuse what you do not need; reduce what you do need; reuse what you consume; recycle what you cannot refuse.",
  "You are making a difference, one project at a time.",
  "Waste isn't waste until we waste it.",
  "Small acts, when multiplied by millions of people, can transform the world.",
  "Do something drastic, cut the plastic!",
  "Creativity is making marvelous out of the discarded."
];

export const getRandomQuote = () => {
  return ECO_QUOTES[Math.floor(Math.random() * ECO_QUOTES.length)];
};
