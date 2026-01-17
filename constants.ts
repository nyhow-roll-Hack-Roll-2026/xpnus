import { Achievement, AchievementType, Category } from './types';

export const AVATARS = [
    "https://api.dicebear.com/9.x/pixel-art/png?seed=Steve",
    "https://api.dicebear.com/9.x/pixel-art/png?seed=Alex",
    "https://api.dicebear.com/9.x/pixel-art/png?seed=Creeper",
    "https://api.dicebear.com/9.x/pixel-art/png?seed=NUS",
];

export const ACHIEVEMENTS: Achievement[] = [
  // --- ROOT ---
  {
    id: 'nus_start',
    title: 'New World Created',
    description: 'Matriculate into the National University of Singapore.',
    iconName: 'MapPin',
    type: AchievementType.ROOT,
    category: Category.GENERAL,
    globalCompletionRate: 100,
    xp: 0
  },

  // --- ACADEMIC BRANCH ---
  {
    id: 'first_lecture',
    parentId: 'nus_start',
    title: 'First Crafting Recipe',
    description: 'Attend your first lecture and learn the basics.',
    iconName: 'BookOpen',
    type: AchievementType.TASK,
    category: Category.ACADEMIC,
    globalCompletionRate: 95,
    xp: 10
  },
  {
    id: 'study_session',
    parentId: 'first_lecture',
    title: 'Enchanting Table',
    description: 'Complete a continuous 10-hour study session in the Central Library.',
    iconName: 'Zap',
    type: AchievementType.GOAL,
    category: Category.ACADEMIC,
    globalCompletionRate: 15,
    xp: 50
  },
  {
    id: 'deans_list',
    parentId: 'study_session',
    title: 'Hero of the Village',
    description: 'Get on the Dean\'s List for a semester.',
    iconName: 'Crown',
    type: AchievementType.CHALLENGE,
    category: Category.ACADEMIC,
    globalCompletionRate: 5,
    xp: 100
  },

  // --- EXPLORATION BRANCH ---
  {
    id: 'utown_visit',
    parentId: 'nus_start',
    title: 'Discover Stronghold',
    description: 'Visit University Town (UTown) for the first time.',
    iconName: 'Castle',
    type: AchievementType.TASK,
    category: Category.EXPLORATION,
    globalCompletionRate: 98,
    xp: 10
  },
  {
    id: 'all_faculties',
    parentId: 'utown_visit',
    title: 'Biomes O\' Plenty',
    description: 'Visit every single faculty campus biome (FASS, FOE, SOC, Science, etc.).',
    iconName: 'Compass',
    type: AchievementType.GOAL,
    category: Category.EXPLORATION,
    globalCompletionRate: 30,
    xp: 50
  },
  {
    id: 'bus_master',
    parentId: 'all_faculties',
    title: 'Minecart Master',
    description: 'Take every internal shuttle bus route (A1, A2, D1, D2, K, E, BTC) at least once.',
    iconName: 'TrainFront',
    type: AchievementType.GOAL,
    category: Category.EXPLORATION,
    globalCompletionRate: 12,
    xp: 75
  },
  {
    id: 'marathon',
    parentId: 'bus_master',
    title: 'Speedrunner',
    description: 'Run a full marathon distance accumulatively around the school server.',
    iconName: 'Footprints',
    type: AchievementType.CHALLENGE,
    category: Category.EXPLORATION,
    globalCompletionRate: 2,
    xp: 150
  },

  // --- SOCIAL BRANCH ---
  {
    id: 'orientation',
    parentId: 'nus_start',
    title: 'Spawn Point Party',
    description: 'Participate in a freshman orientation camp.',
    iconName: 'Tent',
    type: AchievementType.TASK,
    category: Category.SOCIAL,
    globalCompletionRate: 80,
    xp: 20
  },
  {
    id: 'cc_activity',
    parentId: 'orientation',
    title: 'Joined a Faction',
    description: 'Join a CCA, Student Club, or Guild.',
    iconName: 'Shield',
    type: AchievementType.TASK,
    category: Category.SOCIAL,
    globalCompletionRate: 60,
    xp: 30
  },
  {
    id: 'campus_event',
    parentId: 'cc_activity',
    title: 'Village Festival',
    description: 'Participate in a campus-wide event (e.g., Rag & Flag, Supernova, Career Fair).',
    iconName: 'Ticket',
    type: AchievementType.GOAL,
    category: Category.SOCIAL,
    globalCompletionRate: 40,
    xp: 50
  },
  {
    id: 'networker',
    parentId: 'campus_event',
    title: 'Diplomat of Realms',
    description: 'Make friends with at least one villager from every faculty biome.',
    iconName: 'Users',
    type: AchievementType.CHALLENGE,
    category: Category.SOCIAL,
    globalCompletionRate: 1,
    xp: 200
  }
];