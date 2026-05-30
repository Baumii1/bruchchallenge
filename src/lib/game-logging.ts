import type { Game, GameLogEntry, GameLogKind, GameTrackingType } from '@/types';
import { formatScoreValue } from '@/lib/game-presets';

export { formatScoreValue };

// Visual metadata per log kind. Components map `icon` to a lucide component.
export const LOG_KIND_META: Record<GameLogKind, { label: string; icon: string; tone: 'win' | 'loss' | 'draw' | 'neutral' }> = {
  win: { label: 'Sieg', icon: 'ChevronUp', tone: 'win' },
  loss: { label: 'Niederlage', icon: 'ChevronDown', tone: 'loss' },
  draw: { label: 'Remis', icon: 'Minus', tone: 'draw' },
  attempt: { label: 'Versuch', icon: 'Dot', tone: 'neutral' },
  info: { label: 'Notiz', icon: 'Dot', tone: 'neutral' },
};

export interface GameStats {
  wins: number;
  losses: number;
  draws: number;
  attempts: number; // explicit neutral attempt entries
  totalTries: number; // every "go": wins + losses + draws + attempts
  currentStreak: number;
  bestStreak: number;
  best?: number; // best score (score mode)
  target?: number;
  completed: boolean;
  winRate?: number; // wins / (wins + losses), undefined if no decisive games
}

let logCounter = 0;
export const makeLogEntry = (kind: GameLogKind, payload?: { score?: string; note?: string }): GameLogEntry => {
  logCounter += 1;
  return {
    id: `log-${Date.now()}-${logCounter}-${Math.random().toString(36).slice(2, 7)}`,
    kind,
    score: payload?.score?.trim() || undefined,
    note: payload?.note?.trim() || undefined,
    at: Date.now(),
  };
};

// A game without an explicit trackingType (legacy / custom) still needs to render
// sensible controls. Derive the closest matching mode.
export const getEffectiveTrackingType = (game: Game): GameTrackingType => {
  if (game.trackingType) return game.trackingType;
  if (game.targetProgress && game.targetProgress > 1) return 'winLossDraw';
  if (game.enableTryCounter) return 'attempts';
  if (game.targetProgress) return 'attempts';
  return 'completion';
};

const SCORE_NUMBER = /(-?\d[\d.,]*)/;
const parseScoreNumber = (value?: string): number | undefined => {
  if (!value) return undefined;
  const match = value.match(SCORE_NUMBER);
  if (!match) return undefined;
  const normalized = match[1].replace(/\.(?=\d{3}\b)/g, '').replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
};

// Best-effort conversion of an old free-text attempt string into a structured entry,
// purely so past challenges still render with sensible colours.
export const parseLegacyAttempt = (raw: string): GameLogEntry => {
  const cleaned = raw.replace(/^(WIN|TRY|NOTE):\s*/i, '').trim();
  const lower = cleaned.toLowerCase();
  let kind: GameLogKind = 'info';
  if (/(loss|lose|verloren|niederlage)/.test(lower)) kind = 'loss';
  else if (/(draw|remis|unentschieden)/.test(lower)) kind = 'draw';
  else if (/(win|sieg|geholt|geschafft|victory|first try|crown|1\.\s*platz)/.test(lower)) kind = 'win';

  const scoreMatch = cleaned.match(/\(([^)]*\d[^)]*)\)/);
  return {
    id: `legacy-${Math.random().toString(36).slice(2, 9)}`,
    kind,
    score: scoreMatch ? scoreMatch[1].trim() : undefined,
    note: cleaned,
    at: 0,
  };
};

// The structured log to display: the real log if present, otherwise parsed legacy text.
export const normalizeGameLog = (game: Game): GameLogEntry[] => {
  if (game.log && game.log.length > 0) return game.log;
  if (game.attempts && game.attempts.length > 0) return game.attempts.map(parseLegacyAttempt);
  return [];
};

interface LogTally {
  wins: number;
  losses: number;
  draws: number;
  attempts: number;
  currentStreak: number;
  bestStreak: number;
  bestScore?: number;
}

const tallyLog = (entries: GameLogEntry[]): LogTally => {
  let wins = 0;
  let losses = 0;
  let draws = 0;
  let attempts = 0;
  let currentStreak = 0;
  let bestStreak = 0;
  let bestScore: number | undefined;

  for (const entry of entries) {
    if (entry.kind === 'win') {
      wins += 1;
      currentStreak += 1;
      if (currentStreak > bestStreak) bestStreak = currentStreak;
    } else if (entry.kind === 'loss') {
      losses += 1;
      currentStreak = 0;
    } else if (entry.kind === 'draw') {
      draws += 1;
      currentStreak = 0;
    } else if (entry.kind === 'attempt') {
      attempts += 1;
    }
    const score = parseScoreNumber(entry.score);
    if (score !== undefined && (bestScore === undefined || score > bestScore)) {
      bestScore = score;
    }
  }

  return { wins, losses, draws, attempts, currentStreak, bestStreak, bestScore };
};

export const computeGameStats = (game: Game): GameStats => {
  const entries = normalizeGameLog(game);
  const tally = tallyLog(entries);
  const type = getEffectiveTrackingType(game);

  const best = type === 'score'
    ? Math.max(game.bestScore ?? 0, tally.bestScore ?? 0) || (game.bestScore ?? tally.bestScore)
    : undefined;

  const decisive = tally.wins + tally.losses;
  const totalTries = tally.wins + tally.losses + tally.draws + tally.attempts;

  let completed = game.status === 'completed';
  if (game.targetProgress && game.targetProgress > 0) {
    if (type === 'score') completed = completed || (best ?? 0) >= game.targetProgress;
    else if (game.backToBack) completed = completed || tally.bestStreak >= game.targetProgress;
    else if (type === 'winLossDraw' || type === 'attempts') completed = completed || tally.wins >= game.targetProgress;
  }

  return {
    wins: tally.wins,
    losses: tally.losses,
    draws: tally.draws,
    attempts: tally.attempts,
    totalTries,
    currentStreak: tally.currentStreak,
    bestStreak: tally.bestStreak,
    best,
    target: game.targetProgress ?? undefined,
    completed,
    winRate: decisive > 0 ? tally.wins / decisive : undefined,
  };
};

// Recompute the derived numeric fields + status + result from a game's structured log.
// Called by the data layer after every log mutation so undo/delete stays consistent.
// Mutates and returns the game. Does NOT touch timers (the caller handles that).
export const recomputeGameDerived = (game: Game): Game => {
  const type = getEffectiveTrackingType(game);
  const entries = game.log ?? [];
  const tally = tallyLog(entries);
  const target = game.targetProgress ?? undefined;
  const activity = entries.length > 0 || Boolean(game.isTimerActive);

  game.wins = tally.wins;
  game.losses = tally.losses;
  game.draws = tally.draws;
  game.tryCount = tally.wins + tally.losses + tally.draws + tally.attempts;

  if (type === 'score') {
    const best = Math.max(game.bestScore ?? 0, tally.bestScore ?? 0);
    game.bestScore = best > 0 ? best : game.bestScore;
  }

  // Determine completion + status.
  let completed = false;
  if (type === 'completion') {
    // Completion is set explicitly by the caller ("Geschafft"), which also adds a
    // win entry. Deleting that entry (undo) re-opens the game.
    completed = game.status === 'completed' && entries.some((entry) => entry.kind === 'win');
  } else if (target && target > 0) {
    if (type === 'score') completed = (game.bestScore ?? 0) >= target;
    else if (game.backToBack) completed = tally.bestStreak >= target;
    else completed = tally.wins >= target;
  }

  game.status = completed ? 'completed' : activity ? 'active' : 'pending';

  if (type === 'score') game.currentProgress = game.bestScore ?? 0;
  else if (type === 'completion') game.currentProgress = completed ? 1 : 0;
  else if (game.backToBack) game.currentProgress = completed ? (target ?? tally.currentStreak) : tally.currentStreak;
  else game.currentProgress = tally.wins;

  // Human-readable result + legacy attempts[] mirror (keeps old views/exports working).
  game.result = buildResultString(game, tally, type);
  game.attempts = entries.map((entry) => mirrorLegacyString(entry));

  return game;
};

const buildResultString = (game: Game, tally: LogTally, type: GameTrackingType): string | undefined => {
  const target = game.targetProgress ?? undefined;
  if (type === 'score') {
    const best = game.bestScore ?? tally.bestScore;
    if (best === undefined && !target) return undefined;
    return `${formatScoreValue(best ?? 0, game.scoreUnit)}${target ? ` / ${formatScoreValue(target, game.scoreUnit)}` : ''}`;
  }
  if (type === 'completion') {
    return game.status === 'completed' ? 'Geschafft' : undefined;
  }
  if (game.backToBack) {
    if (game.status === 'completed') return `${target ?? tally.bestStreak}× in Folge`;
    return tally.currentStreak > 0 ? `Streak ${tally.currentStreak}` : `Beste Serie ${tally.bestStreak}`;
  }
  if (tally.wins + tally.losses + tally.draws + tally.attempts === 0) return undefined;
  return target ? `${tally.wins}/${target}` : `${tally.wins} W`;
};

const mirrorLegacyString = (entry: GameLogEntry): string => {
  const label = LOG_KIND_META[entry.kind].label;
  const parts = [label];
  if (entry.score) parts.push(`(${entry.score})`);
  if (entry.note && entry.note !== entry.score) parts.push(`– ${entry.note}`);
  return parts.join(' ');
};
