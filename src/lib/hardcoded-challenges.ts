import type { Challenge, Game, GameLogEntry, GameLogKind } from '@/types';

const legacyPastChallengeIds = new Set([
  'past-challenge-1',
  'past-challenge-2',
  'past-challenge-3',
  'past-challenge-4',
  'past-challenge-5',
  'past-challenge-6',
  'challenge-1776454312994-fbrxs',
]);

const durationToSeconds = (durationStr?: string): number => {
  if (!durationStr) return 0;
  const cleanedDurationStr = durationStr.replace(',', '.').replace(/h$/i, ':00');
  const parts = cleanedDurationStr.split(/[:.]/);

  let hours = 0;
  let minutes = 0;
  let seconds = 0;

  if (parts.length >= 3) {
    hours = parseInt(parts[0], 10) || 0;
    minutes = parseInt(parts[1], 10) || 0;
    seconds = parseFloat(parts[2]) || 0;
    if (parts[3]) {
      seconds += parseFloat(`0.${parts[3]}`) || 0;
    }
  } else if (parts.length === 2) {
    minutes = parseInt(parts[0], 10) || 0;
    seconds = parseFloat(parts[1]) || 0;
  } else if (parts.length === 1 && parts[0]) {
    seconds = parseFloat(parts[0]) || 0;
  }

  return Math.round(hours * 3600 + minutes * 60 + seconds);
};

const formatDateString = (dateStr: string): string => {
  const parts = dateStr.split('.');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return dateStr;
};

const completedGameDefaults = {
  status: 'completed' as const,
  accumulatedDuration: 0,
  isTimerActive: false,
  timerStartedAt: undefined,
  enableManualLog: true,
};

const logEntry = (id: string, kind: GameLogKind, payload: { score?: string; note?: string } = {}): GameLogEntry => ({
  id,
  kind,
  score: payload.score,
  note: payload.note,
  at: 0,
});

const repeatedLogs = (prefix: string, kind: GameLogKind, count: number): GameLogEntry[] => (
  Array.from({ length: count }, (_, index) => logEntry(`${prefix}-${kind}-${index + 1}`, kind))
);

const game = (data: Game): Game => data;

export const hardcodedPastChallenges: Challenge[] = [
  {
    id: 'hardcoded-past-challenge-7',
    title: '11 Games 23 Wins - Challenge 18.12.2025',
    date: formatDateString('18.12.2025'),
    scheduledDateTime: new Date(`${formatDateString('18.12.2025')}T10:30:00Z`).toISOString(),
    status: 'past',
    startTime: '10:30',
    endTime: '00:21',
    totalDuration: '13:51h',
    challengeAccumulatedDuration: durationToSeconds('13:51:00'),
    games: [
      game({ ...completedGameDefaults, id: 'hpc7-g1', name: 'CS2 b2b', iconName: 'cs2', objective: 'CS2 b2b: 1/1', result: '1/1', targetProgress: 2, currentProgress: 2, wins: 2, losses: 0, draws: 0, requiredWinStreak: 2, currentWinStreak: 2, bestWinStreak: 2, presetId: 'cs', trackingType: 'winLossDraw', allowDraw: true, backToBack: true, scoreLabel: 'Score', attempts: ['Win (13-5)', 'Win (13-3)'], log: [logEntry('hpc7-g1-1', 'win', { score: '13-5' }), logEntry('hpc7-g1-2', 'win', { score: '13-3' })] }),
      game({ ...completedGameDefaults, id: 'hpc7-g2', name: 'Valorant', iconName: 'valorant', objective: 'Valorant: 1/1', result: '1/1', targetProgress: 1, currentProgress: 1, wins: 1, losses: 2, draws: 0, presetId: 'valorant', trackingType: 'winLossDraw', allowDraw: false, scoreLabel: 'Score', attempts: ['Loss (2:13)', 'Loss (5:13)', 'Win (15:13)'], log: [logEntry('hpc7-g2-1', 'loss', { score: '2:13' }), logEntry('hpc7-g2-2', 'loss', { score: '5:13' }), logEntry('hpc7-g2-3', 'win', { score: '15:13' })] }),
      game({ ...completedGameDefaults, id: 'hpc7-g3', name: 'Fall Guys', iconName: 'fallguys', objective: 'Fall Guys: 3/3', result: '3/3', targetProgress: 3, currentProgress: 3, wins: 3, losses: 10, tryCount: 13, presetId: 'fall-guys', trackingType: 'attempts', winLabel: 'Crown', attemptLabel: 'Versuch', scoreLabel: 'Notiz', enableTryCounter: true, attempts: ['10 Losses', '3 Wins'], log: [...repeatedLogs('hpc7-g3', 'loss', 10), ...repeatedLogs('hpc7-g3', 'win', 3)] }),
      game({ ...completedGameDefaults, id: 'hpc7-g4', name: 'Minecraft Bedwars', iconName: 'bedwars', objective: 'Minecraft Bedwars: 3/3', result: '3/3', targetProgress: 3, currentProgress: 3, wins: 3, losses: 13, tryCount: 16, presetId: 'bedwars', trackingType: 'attempts', winLabel: 'Win', attemptLabel: 'Runde', scoreLabel: 'Platzierung / Notiz', enableTryCounter: true, attempts: ['2.', '2.', '4.', '3.', '1.', 'wäre safe 1. aber Hypixel Kartoffel server abgeschmiert', '2. & 3. weil Hypixels kartoffel server uns in 2 versch. Teams geschickt haben', '2.', '3.', '2.', '3.', '3.', '2.', '1.', '3.', '1.'], log: [logEntry('hpc7-g4-1', 'loss', { note: '2.' }), logEntry('hpc7-g4-2', 'loss', { note: '2.' }), logEntry('hpc7-g4-3', 'loss', { note: '4.' }), logEntry('hpc7-g4-4', 'loss', { note: '3.' }), logEntry('hpc7-g4-5', 'win', { note: '1.' }), logEntry('hpc7-g4-6', 'loss', { note: 'wäre safe 1. aber Hypixel Kartoffel server abgeschmiert' }), logEntry('hpc7-g4-7', 'loss', { note: '2. & 3. weil Hypixels kartoffel server uns in 2 versch. Teams geschickt haben' }), logEntry('hpc7-g4-8', 'loss', { note: '2.' }), logEntry('hpc7-g4-9', 'loss', { note: '3.' }), logEntry('hpc7-g4-10', 'loss', { note: '2.' }), logEntry('hpc7-g4-11', 'loss', { note: '3.' }), logEntry('hpc7-g4-12', 'loss', { note: '3.' }), logEntry('hpc7-g4-13', 'loss', { note: '2.' }), logEntry('hpc7-g4-14', 'win', { note: '1.' }), logEntry('hpc7-g4-15', 'loss', { note: '3.' }), logEntry('hpc7-g4-16', 'win', { note: '1.' })] }),
      game({ ...completedGameDefaults, id: 'hpc7-g5', name: 'WWM Mio', iconName: 'wwm', objective: 'WWM Mio: 1/1', result: '1/1', targetProgress: 1000000, currentProgress: 1000000, bestScore: 1000000, tryCount: 1, presetId: 'wwm', trackingType: 'score', scoreLabel: 'Gewinn', attemptLabel: 'Versuch', enableTryCounter: true, attempts: ['ca. 20min'], log: [logEntry('hpc7-g5-1', 'attempt', { score: '1000000', note: 'ca. 20min' })] }),
      game({ ...completedGameDefaults, id: 'hpc7-g6', name: 'Minecraft 1.21.4 unter 1:30h', iconName: 'minecraft', objective: 'Minecraft 1.21.4 unter 1:30h: 1/1', result: '1/1', targetProgress: 1, currentProgress: 1, presetId: 'minecraft-speedrun', trackingType: 'completion', winLabel: 'Geschafft', scoreLabel: 'Zeit / Notiz', attempts: ['1h 20min 09sec'], log: [logEntry('hpc7-g6-1', 'win', { note: '1h 20min 09sec' })] }),
      game({ ...completedGameDefaults, id: 'hpc7-g7', name: 'Fortnite Battle Royale Win', iconName: 'fortnite', objective: 'Fortnite Battle Royale Win: 1/1', result: '1/1', targetProgress: 1, currentProgress: 1, wins: 1, tryCount: 1, presetId: 'fortnite', trackingType: 'attempts', winLabel: 'Victory Royale', attemptLabel: 'Match', scoreLabel: 'Platz / Notiz', enableTryCounter: true, attempts: ['First Try'], log: [logEntry('hpc7-g7-1', 'win', { note: 'First Try' })] }),
      game({ ...completedGameDefaults, id: 'hpc7-g8', name: 'Higher Lower 20', iconName: 'higherlower', objective: 'Higher Lower 20: 1/1', result: '1/1', targetProgress: 20, currentProgress: 36, bestScore: 36, tryCount: 1, presetId: 'higher-lower', trackingType: 'score', scoreLabel: 'Score', attemptLabel: 'Versuch', enableTryCounter: true, attempts: ['ca. 1h 20min aber easy 36'], log: [logEntry('hpc7-g8-1', 'attempt', { score: '36', note: 'ca. 1h 20min aber easy 36' })] }),
      game({ ...completedGameDefaults, id: 'hpc7-g9', name: 'Mario Kart 1. & 2. Platz', iconName: 'mariokart', objective: 'Mario Kart 1. & 2. Platz: 3/3', result: '3/3', targetProgress: 3, currentProgress: 3, wins: 3, losses: 1, tryCount: 4, presetId: 'mario-kart', trackingType: 'attempts', winLabel: 'Ziel erreicht', attemptLabel: 'Rennen', scoreLabel: 'Platzierung', enableTryCounter: true, attempts: ['1. und 3.', '1. und 2.', '1. und 1.', '1. und 2.'], log: [logEntry('hpc7-g9-1', 'loss', { note: '1. und 3.' }), logEntry('hpc7-g9-2', 'win', { note: '1. und 2.' }), logEntry('hpc7-g9-3', 'win', { note: '1. und 1.' }), logEntry('hpc7-g9-4', 'win', { note: '1. und 2.' })] }),
      game({ ...completedGameDefaults, id: 'hpc7-g10', name: 'Clash Royale Duo b5b', iconName: 'clashroyale', objective: 'Clash Royale Duo b5b: 1/1', result: '1/1', targetProgress: 5, currentProgress: 5, wins: 9, losses: 1, draws: 0, requiredWinStreak: 5, currentWinStreak: 9, bestWinStreak: 9, presetId: 'clash-royale', trackingType: 'winLossDraw', allowDraw: false, backToBack: true, scoreLabel: 'Kronen / Notiz', attempts: ['9 Wins', '1 Loss'], log: [logEntry('hpc7-g10-1', 'loss'), ...repeatedLogs('hpc7-g10', 'win', 9)] }),
      game({ ...completedGameDefaults, id: 'hpc7-g11', name: 'GeoGuessr b2b', iconName: 'geoguessr', objective: 'GeoGuessr b2b: 1/1', result: '1/1', targetProgress: 2, currentProgress: 2, wins: 2, requiredWinStreak: 2, currentWinStreak: 2, bestWinStreak: 2, presetId: 'geoguessr', trackingType: 'winLossDraw', backToBack: true, scoreLabel: 'Notiz', attempts: ['First Try'], log: [logEntry('hpc7-g11-1', 'win', { note: 'First Try' }), logEntry('hpc7-g11-2', 'win', { note: 'First Try' })] }),
    ],
    image: 'https://placehold.co/600x400.png?text=Challenge+18.12.2025',
    dataAihint: 'esports marathon challenge',
    isChallengeTimerActive: false,
    overallNotes: [],
    playerIssues: [],
    detailedGameAttempts: [],
  },
  {
    id: 'hardcoded-past-challenge-6',
    title: '9 Games 15 Wins - Challenge 17.04.2025',
    date: formatDateString('17.04.2025'),
    scheduledDateTime: new Date(`${formatDateString('17.04.2025')}T11:05:00Z`).toISOString(),
    status: 'past',
    startTime: '11:05',
    endTime: '23:05',
    totalDuration: '12:00:00',
    challengeAccumulatedDuration: durationToSeconds('12:00:00'),
    games: [
      game({ ...completedGameDefaults, id: 'hpc6-g1', name: 'CS2 b2b', iconName: 'cs2', objective: 'CS2 b2b: 1/1', result: '1/1', targetProgress: 2, currentProgress: 2, wins: 2, presetId: 'cs', trackingType: 'winLossDraw', allowDraw: true, backToBack: true, attempts: ['Win (13-3)', 'Win (13-2)'], log: [logEntry('hpc6-g1-1', 'win', { score: '13-3' }), logEntry('hpc6-g1-2', 'win', { score: '13-2' })] }),
      game({ ...completedGameDefaults, id: 'hpc6-g2', name: 'Valorant', iconName: 'valorant', objective: 'Valorant: 2/2', result: '2/2', targetProgress: 2, currentProgress: 2, wins: 2, presetId: 'valorant', trackingType: 'winLossDraw', attempts: ['Win (13:6)', 'Win (13:11)'], log: [logEntry('hpc6-g2-1', 'win', { score: '13:6' }), logEntry('hpc6-g2-2', 'win', { score: '13:11' })] }),
      game({ ...completedGameDefaults, id: 'hpc6-g3', name: 'Minecraft Bedwars', iconName: 'bedwars', objective: 'Minecraft Bedwars: 3/3', result: '3/3', targetProgress: 3, currentProgress: 3, wins: 3, losses: 9, tryCount: 12, presetId: 'bedwars', trackingType: 'attempts', enableTryCounter: true, attempts: ['Losses: 9', 'Wins: 3'], log: [...repeatedLogs('hpc6-g3', 'loss', 9), ...repeatedLogs('hpc6-g3', 'win', 3)] }),
      game({ ...completedGameDefaults, id: 'hpc6-g4', name: 'WWM Mio', iconName: 'wwm', objective: 'WWM Mio: 1/1', result: '1/1', targetProgress: 1000000, currentProgress: 1000000, bestScore: 1000000, tryCount: 1, presetId: 'wwm', trackingType: 'score', attempts: ['2h 2min'], log: [logEntry('hpc6-g4-1', 'attempt', { score: '1000000', note: '2h 2min' })] }),
      game({ ...completedGameDefaults, id: 'hpc6-g5', name: 'Fall Guys', iconName: 'fallguys', objective: 'Fall Guys: 3/3', result: '3/3', targetProgress: 3, currentProgress: 3, wins: 3, losses: 6, tryCount: 9, presetId: 'fall-guys', trackingType: 'attempts', enableTryCounter: true, attempts: ['6 Losses', '3 Wins'], log: [...repeatedLogs('hpc6-g5', 'loss', 6), ...repeatedLogs('hpc6-g5', 'win', 3)] }),
      game({ ...completedGameDefaults, id: 'hpc6-g6', name: 'Minecraft durchspielen 1.21.3', iconName: 'minecraft', objective: 'Minecraft durchspielen 1.21.3: 1/1', result: '1/1', targetProgress: 1, currentProgress: 1, presetId: 'minecraft-speedrun', trackingType: 'completion', attempts: ['1h 32min'], log: [logEntry('hpc6-g6-1', 'win', { note: '1h 32min' })] }),
      game({ ...completedGameDefaults, id: 'hpc6-g7', name: 'Assoziationsspiel 5er Streak', iconName: 'assoziationsspiel', objective: 'Assoziationsspiel 5er Streak: 1/1', result: '1/1', targetProgress: 1, currentProgress: 1, trackingType: 'completion', attempts: ['35min'], log: [logEntry('hpc6-g7-1', 'win', { note: '35min' })] }),
      game({ ...completedGameDefaults, id: 'hpc6-g8', name: 'Fortnite Battle Royale Win', iconName: 'fortnite', objective: 'Fortnite Battle Royale Win: 1/1', result: '1/1', targetProgress: 1, currentProgress: 1, wins: 1, tryCount: 1, presetId: 'fortnite', trackingType: 'attempts', enableTryCounter: true, attempts: ['First Try'], log: [logEntry('hpc6-g8-1', 'win', { note: 'First Try' })] }),
      game({ ...completedGameDefaults, id: 'hpc6-g9', name: 'Slither.io 10k', iconName: 'slitherio', objective: 'Slither.io 10k: 1/1', result: '1/1', targetProgress: 10000, currentProgress: 10000, bestScore: 10000, tryCount: 1, trackingType: 'score', attempts: ['ca 20min'], log: [logEntry('hpc6-g9-1', 'attempt', { score: '10000', note: 'ca 20min' })] }),
      game({ ...completedGameDefaults, id: 'hpc6-g10', name: 'CS Higher Lower 10er', iconName: 'higherlower', objective: 'CS Higher Lower 10er: 1/1', result: '1/1', targetProgress: 10, currentProgress: 10, bestScore: 10, tryCount: 4, presetId: 'higher-lower', trackingType: 'score', attempts: ['4 Tries'], log: [logEntry('hpc6-g10-1', 'attempt', { score: '10', note: '4 Tries' })] }),
    ],
    image: 'https://placehold.co/600x400.png?text=Challenge+17.04.2025',
    dataAihint: 'future past gaming',
    isChallengeTimerActive: false,
    overallNotes: [],
    playerIssues: [],
    detailedGameAttempts: [],
  },
  {
    id: 'hardcoded-past-challenge-5',
    title: '8 Games 12 Wins - Challenge 24.03.2024',
    date: formatDateString('24.03.2024'),
    scheduledDateTime: new Date(`${formatDateString('24.03.2024')}T13:19:00Z`).toISOString(),
    status: 'past',
    startTime: '13:19',
    endTime: '09:01',
    totalDuration: '19:42:48',
    challengeAccumulatedDuration: durationToSeconds('19:42:48'),
    games: [
      game({ ...completedGameDefaults, id: 'hpc5-g1', name: 'CS2 Faceit b2b', iconName: 'cs2', objective: 'CS2 Faceit b2b: 1/1', result: '1/1', targetProgress: 2, currentProgress: 2, wins: 2, presetId: 'cs', trackingType: 'winLossDraw', backToBack: true, attempts: ['Win (13-8)', 'Win (13-10)'], log: [logEntry('hpc5-g1-1', 'win', { score: '13-8' }), logEntry('hpc5-g1-2', 'win', { score: '13-10' })] }),
      game({ ...completedGameDefaults, id: 'hpc5-g2', name: 'Valorant b2b', iconName: 'valorant', objective: 'Valorant b2b: 1/1', result: '1/1', targetProgress: 2, currentProgress: 2, wins: 4, losses: 7, draws: 2, presetId: 'valorant', trackingType: 'winLossDraw', allowDraw: true, backToBack: true, attempts: ['Loss (6-13)', 'Loss (6-13)', 'Win (13-4)', 'Draw (14-14)', 'Loss (10-13)', 'Loss (1-5)', 'Draw (15-15)', 'Loss (5-13)', 'Loss (5-13)', 'Loss (3-13)', 'Loss (5-13)', 'Win (13-1)', 'Win (13-9)'], log: [logEntry('hpc5-g2-1', 'loss', { score: '6-13' }), logEntry('hpc5-g2-2', 'loss', { score: '6-13' }), logEntry('hpc5-g2-3', 'win', { score: '13-4' }), logEntry('hpc5-g2-4', 'draw', { score: '14-14' }), logEntry('hpc5-g2-5', 'loss', { score: '10-13' }), logEntry('hpc5-g2-6', 'loss', { score: '1-5' }), logEntry('hpc5-g2-7', 'draw', { score: '15-15' }), logEntry('hpc5-g2-8', 'loss', { score: '5-13' }), logEntry('hpc5-g2-9', 'loss', { score: '5-13' }), logEntry('hpc5-g2-10', 'loss', { score: '3-13' }), logEntry('hpc5-g2-11', 'loss', { score: '5-13' }), logEntry('hpc5-g2-12', 'win', { score: '13-1' }), logEntry('hpc5-g2-13', 'win', { score: '13-9' })] }),
      game({ ...completedGameDefaults, id: 'hpc5-g3', name: 'Fall Guys', iconName: 'fallguys', objective: 'Fall Guys: 3/3', result: '3/3', targetProgress: 3, currentProgress: 3, wins: 3, losses: 8, tryCount: 11, presetId: 'fall-guys', trackingType: 'attempts', enableTryCounter: true, attempts: ['3 Win', '8 Finale', '8 Losses'], log: [...repeatedLogs('hpc5-g3', 'win', 3), ...repeatedLogs('hpc5-g3', 'loss', 8)] }),
      game({ ...completedGameDefaults, id: 'hpc5-g4', name: 'Minecraft Bedwars', iconName: 'bedwars', objective: 'Minecraft Bedwars: 1/1', result: '1/1', targetProgress: 1, currentProgress: 1, wins: 1, losses: 4, tryCount: 5, presetId: 'bedwars', trackingType: 'attempts', enableTryCounter: true, attempts: ['1 Win', '4 Losses'], log: [logEntry('hpc5-g4-1', 'win'), ...repeatedLogs('hpc5-g4', 'loss', 4)] }),
      game({ ...completedGameDefaults, id: 'hpc5-g5', name: 'Brawlstars 10er Win Streak', iconName: 'brawlstars', objective: 'Brawlstars 10er Win Streak: 1/1', result: '1/1', targetProgress: 10, currentProgress: 10, wins: 12, losses: 5, trackingType: 'winLossDraw', backToBack: true, attempts: ['12 Wins', '5 Losses'], log: [...repeatedLogs('hpc5-g5', 'win', 12), ...repeatedLogs('hpc5-g5', 'loss', 5)] }),
      game({ ...completedGameDefaults, id: 'hpc5-g6', name: 'Fortnite', iconName: 'fortnite', objective: 'Fortnite: 1/1', result: '1/1', targetProgress: 1, currentProgress: 1, wins: 1, losses: 3, tryCount: 4, presetId: 'fortnite', trackingType: 'attempts', enableTryCounter: true, attempts: ['1 Win', '3 Losses'], log: [logEntry('hpc5-g6-1', 'win'), ...repeatedLogs('hpc5-g6', 'loss', 3)] }),
      game({ ...completedGameDefaults, id: 'hpc5-g7', name: 'WWM Die Mio wird geknackt', iconName: 'wwm', objective: 'WWM Die Mio wird geknackt: 1/1', result: '1/1', targetProgress: 1000000, currentProgress: 1000000, bestScore: 1000000, presetId: 'wwm', trackingType: 'score', attempts: ['ZU VIELE VERSUCHE'], log: [logEntry('hpc5-g7-1', 'attempt', { score: '1000000', note: 'ZU VIELE VERSUCHE' })] }),
      game({ ...completedGameDefaults, id: 'hpc5-g8', name: 'Higher Lower 20', iconName: 'higherlower', objective: 'Higher Lower 20: 1/1', result: '1/1', targetProgress: 20, currentProgress: 29, bestScore: 29, presetId: 'higher-lower', trackingType: 'score', attempts: ['Einige Versuche aber easy 29'], log: [logEntry('hpc5-g8-1', 'attempt', { score: '29', note: 'Einige Versuche aber easy 29' })] }),
    ],
    playerIssues: [
      { playerName: 'Patrick', pcInternetCrashes: 1 },
      { playerName: 'Merlin', pcInternetCrashes: 0 },
    ],
    image: 'https://placehold.co/600x400.png?text=Challenge+24.03.2024',
    dataAihint: 'esports marathon gaming',
    isChallengeTimerActive: false,
    overallNotes: [],
  },
  {
    id: 'hardcoded-past-challenge-4',
    title: '7 Games 11 Wins - Challenge 04.01.2024',
    date: formatDateString('04.01.2024'),
    scheduledDateTime: new Date(`${formatDateString('04.01.2024')}T14:01:00Z`).toISOString(),
    status: 'past',
    startTime: '14:01',
    endTime: '05:53',
    totalDuration: '15:50:12',
    challengeAccumulatedDuration: durationToSeconds('15:50:12'),
    games: [
      game({ ...completedGameDefaults, id: 'hpc4-g1', name: 'CS2 b2b', iconName: 'cs2', objective: 'CS2 b2b: 1/1', result: '1/1', targetProgress: 2, currentProgress: 2, wins: 4, losses: 3, presetId: 'cs', trackingType: 'winLossDraw', allowDraw: true, backToBack: true, attempts: ['Win (13:6)', 'Loss(12:16)', 'Win(13:11)', 'Loss(11:13)', 'Loss(1:0), Mate bricht vor der ersten Runde ab?!?!!?', 'Win(13:11)', 'Win(13:7)'], log: [logEntry('hpc4-g1-1', 'win', { score: '13:6' }), logEntry('hpc4-g1-2', 'loss', { score: '12:16' }), logEntry('hpc4-g1-3', 'win', { score: '13:11' }), logEntry('hpc4-g1-4', 'loss', { score: '11:13' }), logEntry('hpc4-g1-5', 'loss', { score: '1:0', note: 'Mate bricht vor der ersten Runde ab?!?!!?' }), logEntry('hpc4-g1-6', 'win', { score: '13:11' }), logEntry('hpc4-g1-7', 'win', { score: '13:7' })] }),
      game({ ...completedGameDefaults, id: 'hpc4-g2', name: 'Valorant b2b', iconName: 'valorant', objective: 'Valorant b2b: 1/1', result: '1/1', targetProgress: 2, currentProgress: 2, wins: 3, losses: 2, presetId: 'valorant', trackingType: 'winLossDraw', backToBack: true, attempts: ['Loss(6:13)', 'Win(13:12)', 'Loss(4:13)', 'Win(13:7)', 'Win(13:3)'], log: [logEntry('hpc4-g2-1', 'loss', { score: '6:13' }), logEntry('hpc4-g2-2', 'win', { score: '13:12' }), logEntry('hpc4-g2-3', 'loss', { score: '4:13' }), logEntry('hpc4-g2-4', 'win', { score: '13:7' }), logEntry('hpc4-g2-5', 'win', { score: '13:3' })] }),
      game({ ...completedGameDefaults, id: 'hpc4-g3', name: 'Fall Guys', iconName: 'fallguys', objective: 'Fall Guys: 3/3', result: '3/3', targetProgress: 3, currentProgress: 3, wins: 3, losses: 6, tryCount: 9, presetId: 'fall-guys', trackingType: 'attempts', enableTryCounter: true, attempts: ['6 Losses', '5 Finale', '3 Wins'], log: [...repeatedLogs('hpc4-g3', 'loss', 6), ...repeatedLogs('hpc4-g3', 'win', 3)] }),
      game({ ...completedGameDefaults, id: 'hpc4-g4', name: 'Minecraft | Bedwars', iconName: 'bedwars', objective: 'Minecraft | Bedwars: 1/1', result: '1/1', targetProgress: 1, currentProgress: 1, wins: 1, losses: 16, tryCount: 17, presetId: 'bedwars', trackingType: 'attempts', enableTryCounter: true, attempts: ['5. Platz', '2. Platz', '5. Platz', '7. Platz', '—-Trios—-', '4. Platz (waren iwie in zwei verschiedenen Teams??)', '4. Platz', '3. Platz', '4. Platz', '2. Platz', '4. Platz', '3. Platz', '4. Platz', '3. Platz', '3. Platz', '2. Platz', '1. Platz'], log: [logEntry('hpc4-g4-1', 'loss', { note: '5. Platz' }), logEntry('hpc4-g4-2', 'loss', { note: '2. Platz' }), logEntry('hpc4-g4-3', 'loss', { note: '5. Platz' }), logEntry('hpc4-g4-4', 'loss', { note: '7. Platz' }), logEntry('hpc4-g4-5', 'loss', { note: '—-Trios—-' }), logEntry('hpc4-g4-6', 'loss', { note: '4. Platz (waren iwie in zwei verschiedenen Teams??)' }), logEntry('hpc4-g4-7', 'loss', { note: '4. Platz' }), logEntry('hpc4-g4-8', 'loss', { note: '3. Platz' }), logEntry('hpc4-g4-9', 'loss', { note: '4. Platz' }), logEntry('hpc4-g4-10', 'loss', { note: '2. Platz' }), logEntry('hpc4-g4-11', 'loss', { note: '4. Platz' }), logEntry('hpc4-g4-12', 'loss', { note: '3. Platz' }), logEntry('hpc4-g4-13', 'loss', { note: '4. Platz' }), logEntry('hpc4-g4-14', 'loss', { note: '3. Platz' }), logEntry('hpc4-g4-15', 'loss', { note: '3. Platz' }), logEntry('hpc4-g4-16', 'loss', { note: '2. Platz' }), logEntry('hpc4-g4-17', 'win', { note: '1. Platz' })] }),
      game({ ...completedGameDefaults, id: 'hpc4-g5', name: 'Higher Lower 20', iconName: 'higherlower', objective: 'Higher Lower 20: 1/1', result: '1/1', targetProgress: 20, currentProgress: 20, bestScore: 20, presetId: 'higher-lower', trackingType: 'score', attempts: ['ca. 30 Tries'], log: [logEntry('hpc4-g5-1', 'attempt', { score: '20', note: 'ca. 30 Tries' })] }),
      game({ ...completedGameDefaults, id: 'hpc4-g6', name: 'LOL', iconName: 'lol', objective: 'LOL: 1/1', result: '1/1', targetProgress: 1, currentProgress: 1, wins: 1, presetId: 'lol', trackingType: 'winLossDraw', attempts: ['First Try'], log: [logEntry('hpc4-g6-1', 'win', { note: 'First Try' })] }),
      game({ ...completedGameDefaults, id: 'hpc4-g7', name: 'Rocket League Duo', iconName: 'rocketleague', objective: 'Rocket League Duo: 1/1', result: '1/1', targetProgress: 1, currentProgress: 1, wins: 1, losses: 1, presetId: 'rocket-league', trackingType: 'winLossDraw', attempts: ['Loss (1:4)', 'Win (6:1)'], log: [logEntry('hpc4-g7-1', 'loss', { score: '1:4' }), logEntry('hpc4-g7-2', 'win', { score: '6:1' })] }),
    ],
    playerIssues: [
      { playerName: 'Patrick', gameCrashes: 1 },
      { playerName: 'Merlin', gameCrashes: 6 },
    ],
    image: 'https://placehold.co/600x400.png?text=Challenge+04.01.2024',
    dataAihint: 'esports contest new year',
    isChallengeTimerActive: false,
    overallNotes: [],
  },
  {
    id: 'hardcoded-past-challenge-3',
    title: '7 Games 14 Wins - Challenge 11.04.2023',
    date: formatDateString('11.04.2023'),
    scheduledDateTime: new Date(`${formatDateString('11.04.2023')}T13:00:00Z`).toISOString(),
    status: 'past',
    startTime: '13:00',
    endTime: '09:39',
    totalDuration: '20:39:26,82',
    challengeAccumulatedDuration: durationToSeconds('20:39:26,82'),
    games: [
      game({ ...completedGameDefaults, id: 'hpc3-g1', name: 'CS:GO', iconName: 'csgo', objective: 'CS:GO: 3/3', result: '3/3', targetProgress: 3, currentProgress: 3, wins: 3, losses: 6, draws: 2, presetId: 'cs', trackingType: 'winLossDraw', allowDraw: true, attempts: ['3 Wins', '2 Draws', '6 Losses (Loss Nr. 1 nur, weil die Mates die letzten inkompetenten Hurensöhne waren)'], log: [...repeatedLogs('hpc3-g1', 'win', 3), ...repeatedLogs('hpc3-g1', 'draw', 2), ...repeatedLogs('hpc3-g1', 'loss', 6)] }),
      game({ ...completedGameDefaults, id: 'hpc3-g2', name: 'CS:GO Dangerzone', iconName: 'csgodz', objective: 'CS:GO Dangerzone: 3/3', result: '3/3', targetProgress: 3, currentProgress: 3, wins: 3, losses: 8, presetId: 'csgo-dangerzone', trackingType: 'attempts', attempts: ['9. Platz', '8. Platz', '9. Platz', '8. Platz', '3. Platz', '2. Platz', '1. Platz', '1. Platz', '6.-7. Platz', '2. Platz', '1. Platz'], log: [logEntry('hpc3-g2-1', 'loss', { note: '9. Platz' }), logEntry('hpc3-g2-2', 'loss', { note: '8. Platz' }), logEntry('hpc3-g2-3', 'loss', { note: '9. Platz' }), logEntry('hpc3-g2-4', 'loss', { note: '8. Platz' }), logEntry('hpc3-g2-5', 'loss', { note: '3. Platz' }), logEntry('hpc3-g2-6', 'loss', { note: '2. Platz' }), logEntry('hpc3-g2-7', 'win', { note: '1. Platz' }), logEntry('hpc3-g2-8', 'win', { note: '1. Platz' }), logEntry('hpc3-g2-9', 'loss', { note: '6.-7. Platz' }), logEntry('hpc3-g2-10', 'loss', { note: '2. Platz' }), logEntry('hpc3-g2-11', 'win', { note: '1. Platz' })] }),
      game({ ...completedGameDefaults, id: 'hpc3-g3', name: 'Fall Guys', iconName: 'fallguys', objective: 'Fall Guys: 3/3', result: '3/3', targetProgress: 3, currentProgress: 3, wins: 3, losses: 14, tryCount: 17, presetId: 'fall-guys', trackingType: 'attempts', enableTryCounter: true, attempts: ['ca. 14 Losses', '3 Wins (1. & 2. b2b)'], log: [...repeatedLogs('hpc3-g3', 'loss', 14), ...repeatedLogs('hpc3-g3', 'win', 3)] }),
      game({ ...completedGameDefaults, id: 'hpc3-g4', name: 'Valorant b2b', iconName: 'valorant', objective: 'Valorant b2b: 1/1', result: '1/1', targetProgress: 2, currentProgress: 2, wins: 3, losses: 4, presetId: 'valorant', trackingType: 'winLossDraw', backToBack: true, attempts: ['3 Wins', '4 Losses'], log: [...repeatedLogs('hpc3-g4', 'win', 3), ...repeatedLogs('hpc3-g4', 'loss', 4)] }),
      game({ ...completedGameDefaults, id: 'hpc3-g5', name: 'Fortnite', iconName: 'fortnite', objective: 'Fortnite: 1/1', result: '1/1', targetProgress: 1, currentProgress: 1, wins: 1, presetId: 'fortnite', trackingType: 'attempts', attempts: ['1 Win'], log: [logEntry('hpc3-g5-1', 'win')] }),
      game({ ...completedGameDefaults, id: 'hpc3-g6', name: 'Higher Lower 15', iconName: 'higherlower', objective: 'Higher Lower 15: 1/1', result: '1/1', targetProgress: 15, currentProgress: 15, bestScore: 15, presetId: 'higher-lower', trackingType: 'score', attempts: ['easy geholt'], log: [logEntry('hpc3-g6-1', 'attempt', { score: '15', note: 'easy geholt' })] }),
      game({ ...completedGameDefaults, id: 'hpc3-g7', name: 'Minecraft | Bedwars', iconName: 'bedwars', objective: 'Minecraft | Bedwars: 1/1', result: '1/1', targetProgress: 1, currentProgress: 1, wins: 1, losses: 5, tryCount: 6, presetId: 'bedwars', trackingType: 'attempts', enableTryCounter: true, attempts: ['2. (letzter Gegner 1/2 Herz)', '3.', '2. (letzter Gegner 1 Herz)', '2.', '4.', '1.'], log: [logEntry('hpc3-g7-1', 'loss', { note: '2. (letzter Gegner 1/2 Herz)' }), logEntry('hpc3-g7-2', 'loss', { note: '3.' }), logEntry('hpc3-g7-3', 'loss', { note: '2. (letzter Gegner 1 Herz)' }), logEntry('hpc3-g7-4', 'loss', { note: '2.' }), logEntry('hpc3-g7-5', 'loss', { note: '4.' }), logEntry('hpc3-g7-6', 'win', { note: '1.' })] }),
    ],
    playerIssues: [
      { playerName: 'Patrick', gameCrashes: 12 },
      { playerName: 'Merlin', gameCrashes: 2, soundCrashes: 8, pcInternetCrashes: 2 },
    ],
    image: 'https://i.postimg.cc/fR0BRGj8/Chat-GPT-Image-27-Mai-2025-18-07-50.png',
    dataAihint: 'gaming tournament crashes',
    isChallengeTimerActive: false,
    overallNotes: [],
  },
  {
    id: 'hardcoded-past-challenge-2',
    title: '6 Games 14 Wins - Challenge 29.12.2022',
    date: formatDateString('29.12.2022'),
    scheduledDateTime: new Date(`${formatDateString('29.12.2022')}T13:01:00Z`).toISOString(),
    status: 'past',
    startTime: '13:01',
    endTime: '04:21',
    totalDuration: '15:19:16',
    challengeAccumulatedDuration: durationToSeconds('15:19:16'),
    games: [
      game({ ...completedGameDefaults, id: 'hpc2-g1', name: 'CS:GO', iconName: 'csgo', objective: 'CS:GO: 3/3', result: '3/3', targetProgress: 3, currentProgress: 3, wins: 3, presetId: 'cs', trackingType: 'winLossDraw', attempts: ['3 Wins'], log: repeatedLogs('hpc2-g1', 'win', 3) }),
      game({ ...completedGameDefaults, id: 'hpc2-g2', name: 'Fall Guys', iconName: 'fallguys', objective: 'Fall Guys: 3/3', result: '3/3', targetProgress: 3, currentProgress: 3, wins: 3, presetId: 'fall-guys', trackingType: 'attempts', attempts: ['3 Wins'], log: repeatedLogs('hpc2-g2', 'win', 3) }),
      game({ ...completedGameDefaults, id: 'hpc2-g3', name: 'Valorant', iconName: 'valorant', objective: 'Valorant: 3/3', result: '3/3', targetProgress: 3, currentProgress: 3, wins: 3, presetId: 'valorant', trackingType: 'winLossDraw', attempts: ['3 Wins'], log: repeatedLogs('hpc2-g3', 'win', 3) }),
      game({ ...completedGameDefaults, id: 'hpc2-g4', name: 'Fortnite', iconName: 'fortnite', objective: 'Fortnite: 1/1', result: '1/1', targetProgress: 1, currentProgress: 1, wins: 1, presetId: 'fortnite', trackingType: 'attempts', attempts: ['1 Win'], log: [logEntry('hpc2-g4-1', 'win')] }),
      game({ ...completedGameDefaults, id: 'hpc2-g5', name: 'WWM 1Mio', iconName: 'wwm', objective: 'WWM 1Mio: 1/1', result: '1/1', targetProgress: 1000000, currentProgress: 1000000, bestScore: 1000000, presetId: 'wwm', trackingType: 'score', attempts: ['1 Mio'], log: [logEntry('hpc2-g5-1', 'attempt', { score: '1000000', note: '1 Mio' })] }),
      game({ ...completedGameDefaults, id: 'hpc2-g6', name: 'Minecraft | Bedwars', iconName: 'bedwars', objective: 'Minecraft | Bedwars: 3/3', result: '3/3', targetProgress: 3, currentProgress: 3, wins: 3, presetId: 'bedwars', trackingType: 'attempts', attempts: ['3 Wins'], log: repeatedLogs('hpc2-g6', 'win', 3) }),
    ],
    image: 'https://i.postimg.cc/q7mWzjJm/Chat-GPT-Image-27-Mai-2025-18-12-31.png',
    dataAihint: 'esports gaming event',
    isChallengeTimerActive: false,
    overallNotes: [],
    playerIssues: [],
    detailedGameAttempts: [],
  },
  {
    id: 'hardcoded-past-challenge-1',
    title: '5 Games 11 Wins - Challenge 18.08.2022',
    date: formatDateString('18.08.2022'),
    scheduledDateTime: new Date(`${formatDateString('18.08.2022')}T13:59:00Z`).toISOString(),
    status: 'past',
    startTime: '13:59',
    endTime: '05:21',
    totalDuration: '15:21:37',
    challengeAccumulatedDuration: durationToSeconds('15:21:37'),
    games: [
      game({ ...completedGameDefaults, id: 'hpc1-g1', name: 'CS:GO', iconName: 'csgo', objective: 'CS:GO: 3/3', result: '3/3', targetProgress: 3, currentProgress: 3, wins: 3, presetId: 'cs', trackingType: 'winLossDraw', attempts: ['3 Wins'], log: repeatedLogs('hpc1-g1', 'win', 3) }),
      game({ ...completedGameDefaults, id: 'hpc1-g2', name: 'Fall Guys', iconName: 'fallguys', objective: 'Fall Guys: 3/3', result: '3/3', targetProgress: 3, currentProgress: 3, wins: 3, presetId: 'fall-guys', trackingType: 'attempts', attempts: ['3 Wins'], log: repeatedLogs('hpc1-g2', 'win', 3) }),
      game({ ...completedGameDefaults, id: 'hpc1-g3', name: 'Valorant', iconName: 'valorant', objective: 'Valorant: 3/3', result: '3/3', targetProgress: 3, currentProgress: 3, wins: 3, presetId: 'valorant', trackingType: 'winLossDraw', attempts: ['3 Wins'], log: repeatedLogs('hpc1-g3', 'win', 3) }),
      game({ ...completedGameDefaults, id: 'hpc1-g4', name: 'Crab Game', iconName: 'crabgame', objective: 'Crab Game: 1/1', result: '1/1', targetProgress: 1, currentProgress: 1, wins: 1, trackingType: 'attempts', attempts: ['1 Win'], log: [logEntry('hpc1-g4-1', 'win')] }),
      game({ ...completedGameDefaults, id: 'hpc1-g5', name: 'WWM', iconName: 'wwm', objective: 'WWM: 500k', result: '500k', targetProgress: 500000, currentProgress: 500000, bestScore: 500000, presetId: 'wwm', trackingType: 'score', attempts: ['500k'], log: [logEntry('hpc1-g5-1', 'attempt', { score: '500000', note: '500k' })] }),
    ],
    image: 'https://i.postimg.cc/Vk9VzyFX/Chat-GPT-Image-27-Mai-2025-17-43-20.png',
    dataAihint: 'gaming challenge retro',
    isChallengeTimerActive: false,
    overallNotes: [],
    playerIssues: [],
    detailedGameAttempts: [],
  },
];

const hardcodedPastChallengeIds = new Set(hardcodedPastChallenges.map((challenge) => challenge.id));

export const withHardcodedChallenges = (challenges: Challenge[]): Challenge[] => {
  const withoutReplacedPastChallenges = challenges.filter((challenge) => (
    !legacyPastChallengeIds.has(challenge.id) && !hardcodedPastChallengeIds.has(challenge.id)
  ));

  return [...hardcodedPastChallenges, ...withoutReplacedPastChallenges];
};

export const getHardcodedChallengeById = (id: string): Challenge | null => (
  hardcodedPastChallenges.find((challenge) => challenge.id === id) ?? null
);
