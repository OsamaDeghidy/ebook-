// Gamification, Streaks & Student Retention Service

export interface GamificationState {
  xp: number;
  level: number;
  levelTitle: string;
  nextLevelXp: number;
  currentLevelBaseXp: number;
  streakDays: number;
  lastActiveDate: string; // YYYY-MM-DD
  totalQuizzesSolved: number;
  totalReelsWatched: number;
  badges: string[];
}

export interface SavedReelNote {
  id: string;
  bookId?: string;
  chapterTitle: string;
  conceptTitle?: string;
  quote: string;
  timestamp: number;
  tags?: string[];
}

const STORAGE_KEY_GAMIFICATION = 'edureels_gamification_state';
const STORAGE_KEY_NOTES = 'saved_reel_notes';

const LEVELS = [
  { level: 1, title: 'مستكشف مبتدئ', minXp: 0, maxXp: 100 },
  { level: 2, title: 'طالب متقدّم', minXp: 100, maxXp: 250 },
  { level: 3, title: 'باحث ذكي', minXp: 250, maxXp: 500 },
  { level: 4, title: 'متقن المفاهيم', minXp: 500, maxXp: 1000 },
  { level: 5, title: 'خبير الذكاء التعليمي', minXp: 1000, maxXp: 2000 },
  { level: 6, title: 'عبقري المعرفة 🚀', minXp: 2000, maxXp: 5000 }
];


export const getLevelInfo = (xp: number) => {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXp) {
      return {
        level: LEVELS[i].level,
        levelTitle: LEVELS[i].title,
        currentLevelBaseXp: LEVELS[i].minXp,
        nextLevelXp: LEVELS[i].maxXp
      };
    }
  }
  return {
    level: 1,
    levelTitle: LEVELS[0].title,
    currentLevelBaseXp: 0,
    nextLevelXp: 100
  };
};

const getTodayDateStr = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const getYesterdayDateStr = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const getGamificationState = (): GamificationState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_GAMIFICATION);
    const today = getTodayDateStr();
    const yesterday = getYesterdayDateStr();

    let state: GamificationState;

    if (raw) {
      state = JSON.parse(raw);
    } else {
      state = {
        xp: 60,
        level: 1,
        levelTitle: 'مستكشف مبتدئ',
        nextLevelXp: 100,
        currentLevelBaseXp: 0,
        streakDays: 1,
        lastActiveDate: today,
        totalQuizzesSolved: 0,
        totalReelsWatched: 0,
        badges: ['first_step']
      };
    }

    // Evaluate Streak
    if (state.lastActiveDate === yesterday) {
      // Maintained streak
    } else if (state.lastActiveDate !== today) {
      // Missed more than 1 day -> reset streak to 1
      state.streakDays = 1;
    }

    const lvl = getLevelInfo(state.xp);
    state.level = lvl.level;
    state.levelTitle = lvl.levelTitle;
    state.currentLevelBaseXp = lvl.currentLevelBaseXp;
    state.nextLevelXp = lvl.nextLevelXp;

    return state;
  } catch (e) {
    return {
      xp: 0,
      level: 1,
      levelTitle: 'مستكشف مبتدئ',
      nextLevelXp: 100,
      currentLevelBaseXp: 0,
      streakDays: 1,
      lastActiveDate: getTodayDateStr(),
      totalQuizzesSolved: 0,
      totalReelsWatched: 0,
      badges: []
    };
  }
};

export const saveGamificationState = (state: GamificationState) => {
  try {
    localStorage.setItem(STORAGE_KEY_GAMIFICATION, JSON.stringify(state));
  } catch (e) {}
};

export const recordReelWatched = (): { state: GamificationState; gainedXp: number; leveledUp: boolean } => {
  const state = getGamificationState();
  const prevLevel = state.level;
  const today = getTodayDateStr();
  const yesterday = getYesterdayDateStr();

  // Streak update
  if (state.lastActiveDate === yesterday) {
    state.streakDays += 1;
  } else if (state.lastActiveDate !== today) {
    state.streakDays = 1;
  }
  state.lastActiveDate = today;

  const gainedXp = 15;
  state.xp += gainedXp;
  state.totalReelsWatched += 1;

  const lvl = getLevelInfo(state.xp);
  state.level = lvl.level;
  state.levelTitle = lvl.levelTitle;
  state.currentLevelBaseXp = lvl.currentLevelBaseXp;
  state.nextLevelXp = lvl.nextLevelXp;

  saveGamificationState(state);
  return { state, gainedXp, leveledUp: state.level > prevLevel };
};

export const recordQuizCorrectAnswer = (): { state: GamificationState; gainedXp: number; leveledUp: boolean } => {
  const state = getGamificationState();
  const prevLevel = state.level;

  const gainedXp = 25;
  state.xp += gainedXp;
  state.totalQuizzesSolved += 1;

  const lvl = getLevelInfo(state.xp);
  state.level = lvl.level;
  state.levelTitle = lvl.levelTitle;
  state.currentLevelBaseXp = lvl.currentLevelBaseXp;
  state.nextLevelXp = lvl.nextLevelXp;

  saveGamificationState(state);
  return { state, gainedXp, leveledUp: state.level > prevLevel };
};

// Saved Notes API
export const getSavedNotes = (): SavedReelNote[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_NOTES) || '[]');
  } catch (e) {
    return [];
  }
};

export const saveReelNote = (note: Omit<SavedReelNote, 'id' | 'timestamp'>): SavedReelNote => {
  const notes = getSavedNotes();
  const newNote: SavedReelNote = {
    ...note,
    id: `note_${Date.now()}`,
    timestamp: Date.now()
  };
  const updated = [newNote, ...notes];
  try {
    localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(updated));
  } catch (e) {}
  return newNote;
};

export const deleteSavedNote = (noteId: string): SavedReelNote[] => {
  const notes = getSavedNotes().filter(n => n.id !== noteId);
  try {
    localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(notes));
  } catch (e) {}
  return notes;
};
