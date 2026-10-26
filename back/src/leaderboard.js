import { players } from './players.js';

export const PERIODS = ['season', 'today'];
export const MAX_ENTRIES = 100;

// Plus ancien d'abord ; une date absente (jamais d'XP) passe après toutes les autres.
function compareAchievedAt(a, b) {
  if (a === b) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return a < b ? -1 : 1;
}

export function buildLeaderboard(period, currentPlayerId) {
  const sorted = [...players].sort((a, b) =>
    b.xp[period] - a.xp[period] ||
    compareAchievedAt(a.achievedAt[period], b.achievedAt[period]) ||
    a.username.localeCompare(b.username, 'fr', { sensitivity: 'base' })
  );

  const items = sorted.slice(0, MAX_ENTRIES).map((p, i) => ({
    id: p.id,
    rank: i + 1,
    username: p.username,
    team: p.team,
    level: p.level,
    xp: p.xp[period],
    isCurrentPlayer: p.id === currentPlayerId,
  }));

  return { period, total: items.length, items };
}
