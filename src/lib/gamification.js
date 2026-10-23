export const MAX_LEVEL = 100;
export const MAX_XP = 100_000;

export const RANKS = [
  { minLevel: 1, maxLevel: 9, name: 'Çaylak Okur' },
  { minLevel: 10, maxLevel: 24, name: 'Maceracı' },
  { minLevel: 25, maxLevel: 49, name: 'Kıdemli Avcı' },
  { minLevel: 50, maxLevel: 74, name: 'Üstün Şövalye' },
  { minLevel: 75, maxLevel: 99, name: 'Hükümdar Muhafızı' },
  { minLevel: 100, maxLevel: 100, name: 'Mahora Hükümdarı' },
];

// Retain the site's existing XP pacing, with a clean 100,000 XP cap.
const LEVEL_BANDS = [
  { fromLevel: 1, toLevel: 11, fromXP: 0, toXP: 500 },
  { fromLevel: 11, toLevel: 26, fromXP: 500, toXP: 2_000 },
  { fromLevel: 26, toLevel: 41, fromXP: 2_000, toXP: 5_000 },
  { fromLevel: 41, toLevel: 56, fromXP: 5_000, toXP: 10_000 },
  { fromLevel: 56, toLevel: 71, fromXP: 10_000, toXP: 25_000 },
  { fromLevel: 71, toLevel: 86, fromXP: 25_000, toXP: 50_000 },
  { fromLevel: 86, toLevel: 100, fromXP: 50_000, toXP: MAX_XP },
];

const LEVEL_THRESHOLDS = Array(MAX_LEVEL + 1).fill(0);
for (const band of LEVEL_BANDS) {
  const levelSpan = band.toLevel - band.fromLevel;
  const xpSpan = band.toXP - band.fromXP;
  for (let level = band.fromLevel; level <= band.toLevel; level += 1) {
    LEVEL_THRESHOLDS[level] = band.fromXP + Math.round((xpSpan * (level - band.fromLevel)) / levelSpan);
  }
}

export function getLevelInfo(xp, isElite = false, activePlanId = null) {
  const totalXP = Math.max(0, Math.floor(Number(xp) || 0));
  let level = MAX_LEVEL;

  for (let candidate = 1; candidate <= MAX_LEVEL; candidate += 1) {
    if (totalXP < LEVEL_THRESHOLDS[candidate]) {
      level = candidate - 1;
      break;
    }
  }

  const currentThreshold = LEVEL_THRESHOLDS[level];
  const nextThreshold = level >= MAX_LEVEL ? totalXP : LEVEL_THRESHOLDS[level + 1];
  const xpForNext = Math.max(1, nextThreshold - currentThreshold);
  const elite = Boolean(isElite || activePlanId);
  const baseRank = RANKS.find((rank) => level >= rank.minLevel && level <= rank.maxLevel)?.name || RANKS[0].name;
  const rank = elite ? `Elite ${baseRank}` : baseRank;

  return {
    level,
    rank,
    baseRank,
    totalXP,
    xpInLevel: level >= MAX_LEVEL ? 0 : totalXP - currentThreshold,
    xpForNext,
    nextLevelXP: nextThreshold,
    progress: level >= MAX_LEVEL ? 100 : ((totalXP - currentThreshold) / xpForNext) * 100,
    fullLabel: `Lv. ${level} ${rank}`,
    rankStyle: elite ? 'elite-gold-glow' : 'normal-rank',
  };
}

export function calculateRank(xp, isElite = false, activePlanId = null) {
  return getLevelInfo(xp, isElite, activePlanId).rank;
}

export function getXpToNextLevel(xp) {
  const levelInfo = getLevelInfo(xp);
  return Math.max(0, levelInfo.nextLevelXP - levelInfo.totalXP);
}

export function getXPForLevel(level) {
  const safeLevel = Math.min(MAX_LEVEL, Math.max(1, Math.floor(Number(level) || 1)));
  return LEVEL_THRESHOLDS[safeLevel];
}
