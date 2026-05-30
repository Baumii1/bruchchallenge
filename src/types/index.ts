
// How a game records attempts / wins. Drives which log buttons appear and how
// progress + completion are computed.
//  - winLossDraw : round games (CS, Valorant, LoL). Tap Win / Loss / Draw, optional score.
//  - attempts    : battle-royale / placement (Fall Guys, Fortnite, Bedwars). Tap Win or just Attempt, optional placement note.
//  - score       : reach a target score over many quick tries (Higher Lower, WWM, geoGuessr, Slither.io).
//  - completion  : single time-based objective (Minecraft Speedrun, KTANE).
export type GameTrackingType = 'winLossDraw' | 'attempts' | 'score' | 'completion';

export type GameLogKind = 'win' | 'loss' | 'draw' | 'attempt' | 'info';

export interface GameLogEntry {
  id: string;
  kind: GameLogKind;
  score?: string; // freeform: "13:5", "27", "2. Platz"
  note?: string;
  at: number; // Date.now()
}

export interface Game {
  id: string;
  name: string;
  iconName: string; // Key for GameIconFactory
  objective: string; // e.g., "3/3 wins", "500k score"
  status?: 'pending' | 'active' | 'completed' | 'failed';
  currentProgress?: number;
  targetProgress?: number; // This should be optional if not a progress-based game
  result?: string; // e.g., "3/3", "1 Mio", "Completed"
  attempts?: string[]; // Detailed attempts or notes for this game (legacy + human-readable mirror)
  timeTaken?: string; // For individual game timer (legacy, will be replaced by dynamic timing)
  wins?: number;
  losses?: number;
  draws?: number;

  // New fields for persistent timer state
  timerStartedAt?: number; // Timestamp (Date.now()) when this game's timer was last started/resumed
  accumulatedDuration?: number; // Total seconds this game has been active (excluding current run)
  isTimerActive?: boolean; // Is this game's timer currently running?

  // New feature flags from create challenge form
  enableTryCounter?: boolean;
  enableManualLog?: boolean;
  tryCount?: number;

  // --- Smart logging model (game presets) ---
  presetId?: string; // which catalog preset this game was created from ('custom' for manual)
  trackingType?: GameTrackingType; // how attempts/wins are recorded
  allowDraw?: boolean; // winLossDraw: show a Draw button
  backToBack?: boolean; // winLossDraw: objective is N consecutive wins (streak)
  scoreUnit?: string; // score mode: "", "k", "pts"
  scoreLabel?: string; // label for the score/placement input ("Score", "Punkte", "Platz")
  attemptLabel?: string; // label for the neutral attempt button ("Versuch", "Runde", "Tod")
  winLabel?: string; // label for the win button ("Sieg", "Victory Royale", "1. Platz")
  bestScore?: number; // score mode: best score reached so far
  log?: GameLogEntry[]; // structured per-attempt log (source of truth for live games)
}

export interface PlayerIssue {
  playerName: string;
  gameCrashes?: number;
  soundCrashes?: number;
  pcInternetCrashes?: number;
}

export interface DetailedAttemptEntry {
  gameName: string;
  attempts: string[];
}

export interface Challenge {
  id: string;
  title: string;
  date: string; // Date of the challenge, e.g., "2022-08-18"
  scheduledDateTime?: string; // ISO string for future challenges, e.g., "2025-04-17T11:05:00Z"
  games: Game[];
  startTime?: string; // e.g., "13:59" (legacy, for display of past)
  endTime?: string; // e.g., "05:21" (legacy, for display of past)
  totalDuration?: string; // e.g., "15:21:37" (legacy, for display of past, will be replaced by dynamic timing)
  status: 'past' | 'upcoming' | 'live';
  playerIssues?: PlayerIssue[];
  detailedGameAttempts?: DetailedAttemptEntry[];
  overallNotes?: string[];
  image?: string; // URL for challenge image
  dataAihint?: string; // AI hint for placeholder image generation

  // New fields for persistent timer state
  challengeStartedAt?: number; // Timestamp (Date.now()) when the overall challenge timer was last started/resumed
  challengeAccumulatedDuration?: number; // Total seconds this challenge has been active (excluding current run)
  isChallengeTimerActive?: boolean; // Is the overall challenge timer currently running?
  activeGameId?: string | null; // ID of the currently active game
}
