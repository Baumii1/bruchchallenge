
import type { Challenge, Game } from '@/types';

// Helper function to convert HH:MM:SS or HH:MM:SS.ms string to total seconds
const durationToSeconds = (durationStr?: string): number => {
  if (!durationStr) return 0;
  const cleanedDurationStr = durationStr.replace(',', '.'); // Replace comma with dot for decimal seconds
  const parts = cleanedDurationStr.split(/[:.]/); // Split by colon or dot

  let hours = 0, minutes = 0, seconds = 0;

  if (parts.length >= 3) { // HH:MM:SS.ms or HH:MM:SS
    hours = parseInt(parts[0], 10) || 0;
    minutes = parseInt(parts[1], 10) || 0;
    seconds = parseFloat(parts[2]) || 0; // Use parseFloat for seconds to handle decimals
    if (parts[3]) { // Handle milliseconds part if present
        seconds += parseFloat(`0.${parts[3]}`) || 0;
    }
  } else if (parts.length === 2) { // MM:SS or MM.SS
    minutes = parseInt(parts[0], 10) || 0;
    seconds = parseFloat(parts[1]) || 0;
  } else if (parts.length === 1 && parts[0]) { // SS or SSSS
    seconds = parseFloat(parts[0]) || 0;
  }
  return Math.round(hours * 3600 + minutes * 60 + seconds); // Round to nearest second
};

// Helper to format DD.MM.YYYY to YYYY-MM-DD
const formatDateString = (dateStr: string): string => {
  const parts = dateStr.split('.');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return dateStr; // Return as is if not in DD.MM.YYYY format
};


export const defaultGameFlags: Partial<Game> = {
  currentProgress: 0,
  status: 'pending' as Game['status'],
  accumulatedDuration: 0,
  isTimerActive: false,
  timerStartedAt: undefined,
  attempts: [] as string[],
  enableTryCounter: false,
  enableManualLog: false,
  tryCount: 0,
  result: undefined as string | undefined,
};


export let challenges: Challenge[] = [
  // --- Past Challenge 1 (18.08.2022) ---
  {
    id: 'past-challenge-1',
    title: '5 Games 11 Wins - Challenge 18.08.2022',
    date: formatDateString('18.08.2022'),
    scheduledDateTime: new Date(formatDateString('18.08.2022') + 'T13:59:00Z').toISOString(),
    status: 'past',
    startTime: '13:59',
    endTime: '05:21',
    totalDuration: '15:21:37',
    challengeAccumulatedDuration: durationToSeconds('15:21:37'),
    games: [
      { ...defaultGameFlags, id: 'pc1-g1', name: 'CS:GO', iconName: 'csgo', objective: '3/3 wins', result: '3/3', status: 'completed', attempts:[] },
      { ...defaultGameFlags, id: 'pc1-g2', name: 'Fall Guys', iconName: 'fallguys', objective: '3/3 wins', result: '3/3', status: 'completed', attempts:[] },
      { ...defaultGameFlags, id: 'pc1-g3', name: 'Valorant', iconName: 'valorant', objective: '3/3 wins', result: '3/3', status: 'completed', attempts:[] },
      { ...defaultGameFlags, id: 'pc1-g4', name: 'Crab Game', iconName: 'crabgame', objective: '1/1 win', result: '1/1', status: 'completed', attempts:[] },
      { ...defaultGameFlags, id: 'pc1-g5', name: 'WWM', iconName: 'wwm', objective: '500k score', result: '500k', status: 'completed', attempts:[] },
    ],
    image: 'https://i.postimg.cc/Vk9VzyFX/Chat-GPT-Image-27-Mai-2025-17-43-20.png', // Updated from original prompt, was https://postimg.cc/hXjr056G
    dataAihint: 'gaming challenge retro',
    isChallengeTimerActive: false,
    overallNotes: [],
    playerIssues:[],
    detailedGameAttempts:[],
  },
  // --- Past Challenge 2 (29.12.2022) ---
  {
    id: 'past-challenge-2',
    title: '6 Games 14 Wins - Challenge 29.12.2022',
    date: formatDateString('29.12.2022'),
    scheduledDateTime: new Date(formatDateString('29.12.2022') + 'T13:01:00Z').toISOString(),
    status: 'past',
    startTime: '13:01',
    endTime: '04:21',
    totalDuration: '15:19:16',
    challengeAccumulatedDuration: durationToSeconds('15:19:16'),
    games: [
      { ...defaultGameFlags, id: 'pc2-g1', name: 'CS:GO', iconName: 'csgo', objective: '3/3 wins', result: '3/3', status: 'completed', attempts:[] },
      { ...defaultGameFlags, id: 'pc2-g2', name: 'Fall Guys', iconName: 'fallguys', objective: '3/3 wins', result: '3/3', status: 'completed', attempts:[] },
      { ...defaultGameFlags, id: 'pc2-g3', name: 'Valorant', iconName: 'valorant', objective: '3/3 wins', result: '3/3', status: 'completed', attempts:[] },
      { ...defaultGameFlags, id: 'pc2-g4', name: 'Fortnite', iconName: 'fortnite', objective: '1/1 win', result: '1/1', status: 'completed', attempts:[] },
      { ...defaultGameFlags, id: 'pc2-g5', name: 'WWM 1Mio', iconName: 'wwm', objective: '1/1 win (1 Million Score)', result: '1/1', status: 'completed', attempts:[] },
      { ...defaultGameFlags, id: 'pc2-g6', name: 'Minecraft | Bedwars', iconName: 'bedwars', objective: '3/3 wins', result: '3/3', status: 'completed', attempts:[] },
    ],
    image: 'https://i.postimg.cc/q7mWzjJm/Chat-GPT-Image-27-Mai-2025-18-12-31.png', // Updated from original prompt, was https://postimg.cc/cKnFz78Y
    dataAihint: 'esports gaming event',
    isChallengeTimerActive: false,
    overallNotes: [],
    playerIssues:[],
    detailedGameAttempts:[],
  },
  // --- Past Challenge 3 (11.04.2023) ---
  {
    id: 'past-challenge-3',
    title: '7 Games 14 Wins - Challenge 11.04.2023',
    date: formatDateString('11.04.2023'),
    scheduledDateTime: new Date(formatDateString('11.04.2023') + 'T13:00:00Z').toISOString(),
    status: 'past',
    startTime: '13:00',
    endTime: '09:39',
    totalDuration: '20:39:26.82', 
    challengeAccumulatedDuration: durationToSeconds('20:39:26.82'),
    games: [
      { ...defaultGameFlags, id: 'pc3-g1', name: 'CS:GO', iconName: 'csgo', objective: '3/3 wins', result: '3/3', status: 'completed', attempts: ["3 Wins", "2 Draws", "6 Losses (Loss Nr. 1 nur, weil die Mates die letzten inkompetenten Hurensöhne waren)"] },
      { ...defaultGameFlags, id: 'pc3-g2', name: 'CS:GO Dangerzone', iconName: 'csgodz', objective: '3/3 wins', result: '3/3', status: 'completed', attempts: ["9. Platz", "8. Platz", "9. Platz", "8. Platz", "3. Platz", "2. Platz", "1. Platz", "1. Platz", "6.-7. Platz", "2. Platz", "1. Platz"] },
      { ...defaultGameFlags, id: 'pc3-g3', name: 'Fall Guys', iconName: 'fallguys', objective: '3/3 wins', result: '3/3', status: 'completed', attempts: ["ca. 14 Losses", "3 Wins (1. & 2. b2b)"] },
      { ...defaultGameFlags, id: 'pc3-g4', name: 'Valorant b2b', iconName: 'valorant', objective: '1/1 win (back-to-back)', result: '1/1', status: 'completed', attempts: ["3 Wins", "4 Losses"] },
      { ...defaultGameFlags, id: 'pc3-g5', name: 'Fortnite', iconName: 'fortnite', objective: '1/1 win', result: '1/1', status: 'completed', attempts: ["1 Win"] },
      { ...defaultGameFlags, id: 'pc3-g6', name: 'Higher Lower 15', iconName: 'higherlower', objective: 'Score 15', result: '1/1', status: 'completed', attempts: ["easy geholt"] }, // User data says "Higher Lower 20: easy geholt" but objective is 15. Kept obj. as 15.
      { ...defaultGameFlags, id: 'pc3-g7', name: 'Minecraft | Bedwars', iconName: 'bedwars', objective: '1/1 win', result: '1/1', status: 'completed', attempts: ["2. (letzter Gegner 1/2 Herz)", "3.", "2. (letzter Gegner 1 Herz)", "2.", "4.", "1."] },
    ],
    playerIssues: [
      { playerName: 'Patrick', gameCrashes: 12 },
      { playerName: 'Merlin', gameCrashes: 2, soundCrashes: 8, pcInternetCrashes: 2 },
    ],
    image: 'https://i.postimg.cc/fR0BRGj8/Chat-GPT-Image-27-Mai-2025-18-07-50.png', // Updated from original prompt, was https://postimg.cc/rDMShYH4
    dataAihint: 'gaming tournament crashes',
    isChallengeTimerActive: false,
    // detailedGameAttempts is now incorporated into individual game.attempts
    overallNotes: [],
  },
    // --- Past Challenge 4 (04.01.2024) ---
  {
    id: 'past-challenge-4',
    title: '7 Games 11 Wins - Challenge 04.01.2024',
    date: formatDateString('04.01.2024'),
    scheduledDateTime: new Date(formatDateString('04.01.2024') + 'T14:01:00Z').toISOString(),
    status: 'past',
    startTime: '14:01',
    endTime: '05:53',
    totalDuration: '15:50:12',
    challengeAccumulatedDuration: durationToSeconds('15:50:12'),
    games: [
      { ...defaultGameFlags, id: 'pc4-g1', name: 'CS2 b2b', iconName: 'cs2', objective: '1/1 win (back-to-back)', result: '1/1', status: 'completed', attempts: ["Win (13:6)", "Loss(12:16)", "Win(13:11)", "Loss(11:13)", "Loss(1:0), Mate bricht vor der ersten Runde ab?!?!!?", "Win(13:11)", "Win(13:7)"] },
      { ...defaultGameFlags, id: 'pc4-g2', name: 'Valorant b2b', iconName: 'valorant', objective: '1/1 win (back-to-back)', result: '1/1', status: 'completed', attempts: ["Loss(6:13)", "Win(13:12)", "Loss(4:13)", "Win(13:7)", "Win(13:3)"] },
      { ...defaultGameFlags, id: 'pc4-g3', name: 'Fall Guys', iconName: 'fallguys', objective: '3/3 wins', result: '3/3', status: 'completed', attempts: ["6 Losses", "5 Finale", "3 Wins"] },
      { ...defaultGameFlags, id: 'pc4-g4', name: 'Minecraft | Bedwars', iconName: 'bedwars', objective: '1/1 win', result: '1/1', status: 'completed', attempts: ["5. Platz", "2. Platz", "5. Platz", "7. Platz", "—-Trios—-", "4. Platz (waren iwie in zwei verschiedenen Teams??)", "4. Platz", "3. Platz", "4. Platz", "2. Platz", "4. Platz", "3. Platz", "4. Platz", "3. Platz", "3. Platz", "2. Platz", "1. Platz"] },
      { ...defaultGameFlags, id: 'pc4-g5', name: 'Higher Lower 20', iconName: 'higherlower', objective: 'Score 20', result: '1/1', status: 'completed', attempts: ["ca. 30 Tries"] },
      { ...defaultGameFlags, id: 'pc4-g6', name: 'LOL', iconName: 'lol', objective: '1/1 win', result: '1/1', status: 'completed', attempts: ["First Try"] },
      { ...defaultGameFlags, id: 'pc4-g7', name: 'Rocket League Duo', iconName: 'rocketleague', objective: '1/1 win', result: '1/1', status: 'completed', attempts: ["Loss (1:4)", "Win (6:1)"] },
    ],
    playerIssues: [
      { playerName: 'Patrick', gameCrashes: 1 },
      { playerName: 'Merlin', gameCrashes: 6 },
    ],
    image: 'https://placehold.co/600x400.png?text=Challenge+04.01.2024', // No specific image link provided by user for this one
    dataAihint: 'esports contest new year',
    isChallengeTimerActive: false,
    overallNotes: [],
  },
  // --- Past Challenge 5 (24.03.2024) ---
  {
    id: 'past-challenge-5',
    title: '8 Games 12 Wins - Challenge 24.03.2024',
    date: formatDateString('24.03.2024'),
    scheduledDateTime: new Date(formatDateString('24.03.2024') + 'T13:19:00Z').toISOString(),
    status: 'past',
    startTime: '13:19',
    endTime: '09:01',
    totalDuration: '19:42:48',
    challengeAccumulatedDuration: durationToSeconds('19:42:48'),
    games: [
      { ...defaultGameFlags, id: 'pc5-g1', name: 'CS2 Faceit b2b', iconName: 'cs2', objective: '1/1 win (back-to-back)', result: '1/1', status: 'completed', attempts: ["Win (13-8)", "Win (13-10)"] },
      { ...defaultGameFlags, id: 'pc5-g2', name: 'Valorant b2b', iconName: 'valorant', objective: '1/1 win (back-to-back)', result: '1/1', status: 'completed', attempts: ["Loss (6-13)", "Loss (6-13)", "Win (13-4)", "Draw (14-14)", "Loss (10-13)", "Loss (1-5)", "Draw (15-15)", "Loss (5-13)", "Loss (5-13)", "Loss (3-13)", "Loss (5-13)", "Win (13-1)", "Win (13-9)"] },
      { ...defaultGameFlags, id: 'pc5-g3', name: 'Fall Guys', iconName: 'fallguys', objective: '3/3 wins', result: '3/3', status: 'completed', attempts: ["3 Win", "8 Finale", "8 Losses"] },
      { ...defaultGameFlags, id: 'pc5-g4', name: 'Minecraft Bedwars', iconName: 'bedwars', objective: '1/1 win', result: '1/1', status: 'completed', attempts: ["1 Win", "4 Losses"] },
      { ...defaultGameFlags, id: 'pc5-g5', name: 'Brawlstars 10er Win Streak', iconName: 'brawlstars', objective: '1/1 win', result: '1/1', status: 'completed', attempts: ["12 Wins", "5 Losses"] },
      { ...defaultGameFlags, id: 'pc5-g6', name: 'Fortnite', iconName: 'fortnite', objective: '1/1 win', result: '1/1', status: 'completed', attempts: ["1 Win", "3 Losses"] },
      { ...defaultGameFlags, id: 'pc5-g7', name: 'WWM Die Mio wird geknackt', iconName: 'wwm', objective: '1 Million Score', result: '1/1', status: 'completed', attempts: ["ZU VIELE VERSUCHE"] },
      { ...defaultGameFlags, id: 'pc5-g8', name: 'Higher Lower 20', iconName: 'higherlower', objective: 'Score 20', result: '1/1', status: 'completed', attempts: ["Einige Versuche aber easy 29"] },
    ],
    playerIssues: [
      { playerName: 'Patrick', pcInternetCrashes: 1 }, // Changed from "PC Crashes"
      { playerName: 'Merlin', pcInternetCrashes: 0 }, // Changed from "PC Crashes"
    ],
    image: 'https://placehold.co/600x400.png?text=Challenge+24.03.2024', // No specific image link provided
    dataAihint: 'esports marathon gaming',
    isChallengeTimerActive: false,
    overallNotes: [],
  },
  // --- Past Challenge 6 (17.04.2025) ---
  {
    id: 'past-challenge-6',
    title: '9 Games 15 Wins - Challenge 17.04.2025',
    date: formatDateString('17.04.2025'),
    scheduledDateTime: new Date(formatDateString('17.04.2025') + 'T11:03:00Z').toISOString(),
    status: 'past', 
    startTime: '11:03',
    endTime: '23:05',
    totalDuration: '12:02:31',
    challengeAccumulatedDuration: durationToSeconds('12:02:31'),
    games: [
      { ...defaultGameFlags, id: 'pc6-g1', name: 'CS2 b2b', iconName: 'cs2', objective: '1/1 win (back-to-back)', result: '1/1', status: 'completed', attempts: ["Win (13-3)", "Win (13-2)"] },
      { ...defaultGameFlags, id: 'pc6-g2', name: 'Valorant', iconName: 'valorant', objective: '2/2 wins', result: '2/2', status: 'completed', attempts: ["Win (13:6)", "Win (13:11)"] },
      { ...defaultGameFlags, id: 'pc6-g3', name: 'Minecraft Bedwars', iconName: 'bedwars', objective: '3/3 wins', result: '3/3', status: 'completed', attempts: ["Losses: 9", "Wins: 3"] },
      { ...defaultGameFlags, id: 'pc6-g4', name: 'WWM Mio', iconName: 'wwm', objective: '1/1 win (1 Million Score)', result: '1/1', status: 'completed', attempts: ["2h 2min"] },
      { ...defaultGameFlags, id: 'pc6-g5', name: 'Fall Guys', iconName: 'fallguys', objective: '3/3 wins', result: '3/3', status: 'completed', attempts: ["6 Losses", "3 Wins"] },
      { ...defaultGameFlags, id: 'pc6-g6', name: 'Minecraft durchspielen 1.21.3', iconName: 'minecraft', objective: '1/1 win (complete playthrough)', result: '1/1', status: 'completed', attempts: ["1h 32min"] },
      { ...defaultGameFlags, id: 'pc6-g7', name: 'Assoziationsspiel 5er Streak', iconName: 'assoziationsspiel', objective: '5 streak', result: '1/1', status: 'completed', attempts: ["35min"] },
      { ...defaultGameFlags, id: 'pc6-g8', name: 'Fortnite Battle Royale Win', iconName: 'fortnite', objective: '1/1 win', result: '1/1', status: 'completed', attempts: ["First Try"] },
      { ...defaultGameFlags, id: 'pc6-g9', name: 'Slither.io 10k', iconName: 'slitherio', objective: '10k score', result: '1/1', status: 'completed', attempts: ["ca 20min"] },
      { ...defaultGameFlags, id: 'pc6-g10', name: 'CS Higher Lower 10er', iconName: 'higherlower', objective: 'Score 10', result: '1/1', status: 'completed', attempts: ["4 Tries"] },
    ],
    image: 'https://placehold.co/600x400.png?text=Challenge+17.04.2025', // No specific image link provided
    dataAihint: 'future past gaming',
    isChallengeTimerActive: false,
    overallNotes: [],
    playerIssues:[],
  },
  // --- Initial Upcoming/Default Challenge ---
  {
    id: 'next-challenge',
    title: 'The Ultimate Bruch Future Challenge',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Initial schedule: 7 days from now
    scheduledDateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'upcoming',
    games: [
      { ...defaultGameFlags, id: 'g1-next-default', name: 'CS2 Showdown', iconName: 'cs2', objective: '5 wins', targetProgress: 5, enableTryCounter: true, enableManualLog: true },
      { ...defaultGameFlags, id: 'g2-next-default', name: 'Valorant Supremacy', iconName: 'valorant', objective: '3 wins b2b', targetProgress: 3, enableTryCounter: true, enableManualLog: false },
      { ...defaultGameFlags, id: 'g3-next-default', name: 'Fall Guys Champion', iconName: 'fallguys', objective: 'Win 1 Crown', targetProgress: 1, enableTryCounter: false, enableManualLog: true },
      { ...defaultGameFlags, id: 'g4-next-default', name: 'Speedrun Game (No Target)', iconName: 'default', objective: 'Complete as fast as possible', enableTryCounter: true, enableManualLog: true, targetProgress: undefined },
    ],
    challengeStartedAt: undefined,
    challengeAccumulatedDuration: 0,
    isChallengeTimerActive: false,
    activeGameId: null,
    image: `https://placehold.co/600x400.png?text=Future+Bruch+Challenge`,
    dataAihint: 'esports trophy future',
    overallNotes: [],
    playerIssues:[],
    detailedGameAttempts:[],
  },
];

const deepCopy = <T>(data: T): T => {
    if (data === undefined || data === null) return data;
    try {
        if (typeof structuredClone === 'function') {
            return structuredClone(data);
        }
        return JSON.parse(JSON.stringify(data));
    } catch (error) {
        console.error("Deep copy failed:", error, data);
        return data; 
    }
};

export const setDataCreateNewChallenge = (newChallengeData: Omit<Challenge, 'id' | 'status' | 'games'> & { games: Omit<Game, 'id'>[] }): Challenge => {
  const newChallengeId = `challenge-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const processedGames: Game[] = newChallengeData.games.map((game, index) => ({
    ...defaultGameFlags, 
    ...game,             
    id: `${newChallengeId}-g${index + 1}`, 
    targetProgress: game.targetProgress === null ? undefined : game.targetProgress, 
    currentProgress: 0,
    status: 'pending', 
    accumulatedDuration: 0,
    isTimerActive: false,
    timerStartedAt: undefined,
    attempts: [],
    tryCount: 0,
  }));

  const challengeToAdd: Challenge = {
    ...newChallengeData,
    id: newChallengeId,
    status: 'upcoming', 
    games: processedGames,
    date: new Date(newChallengeData.scheduledDateTime!).toISOString().split('T')[0], 
    scheduledDateTime: new Date(newChallengeData.scheduledDateTime!).toISOString(),
    challengeStartedAt: undefined,
    challengeAccumulatedDuration: 0,
    isChallengeTimerActive: false,
    activeGameId: null,
    overallNotes: [],
    playerIssues: [],
    detailedGameAttempts: [],
    image: newChallengeData.image || undefined, 
    dataAihint: newChallengeData.image ? 'custom challenge banner' : 'gaming challenge generic',
  };

  challenges.push(challengeToAdd);
  // ensureUpcomingChallenge(); // No longer automatically creating default challenges
  return deepCopy(challengeToAdd);
};


export const setDataChallengeStatus = (id: string, newStatus: 'upcoming' | 'live' | 'past'): Challenge | null => {
  const challengeIndex = challenges.findIndex(c => c.id === id);
  if (challengeIndex !== -1) {
    const chal = challenges[challengeIndex];
    const previousStatus = chal.status;
    chal.status = newStatus;

    if (newStatus === 'live') {
      if (previousStatus === 'upcoming' || chal.challengeAccumulatedDuration === undefined ) {
        chal.challengeAccumulatedDuration = 0;
        chal.activeGameId = null;
        chal.games.forEach(game => {
          game.currentProgress = 0;
          game.accumulatedDuration = 0;
          game.status = 'pending';
          game.isTimerActive = false;
          game.timerStartedAt = undefined;
          game.result = undefined;
          game.attempts = []; 
          game.tryCount = 0;
        });
      }
      chal.challengeStartedAt = Date.now();
      chal.isChallengeTimerActive = true;
      
    } else { 
      if (chal.isChallengeTimerActive && chal.challengeStartedAt) {
        const elapsed = (Date.now() - chal.challengeStartedAt) / 1000;
        chal.challengeAccumulatedDuration = (chal.challengeAccumulatedDuration || 0) + elapsed;
      }
      chal.isChallengeTimerActive = false;
      chal.challengeStartedAt = undefined;

      chal.games.forEach(game => {
        if (game.isTimerActive && game.timerStartedAt) {
          const gameElapsed = (Date.now() - game.timerStartedAt) / 1000;
          game.accumulatedDuration = (game.accumulatedDuration || 0) + gameElapsed;
        }
        game.isTimerActive = false;
        game.timerStartedAt = undefined;
        
        if (newStatus === 'past') {
            if (game.targetProgress !== undefined && game.targetProgress !== null) {
              if (game.status !== 'completed' && game.status !== 'failed') { // Only update if not already explicitly set
                game.status = (game.currentProgress || 0) >= game.targetProgress ? 'completed' : 'failed';
                game.result = game.status === 'completed' ? `${game.currentProgress || 0}/${game.targetProgress}` : `Failed (${game.currentProgress || 0}/${game.targetProgress})`;
              }
            } else if (game.status !== 'completed' && game.status !== 'failed' && ((game.accumulatedDuration || 0) > 0 || (game.tryCount || 0) > 0 || (game.currentProgress || 0) > 0)) {
                game.status = 'completed'; 
                game.result = game.result || 'Activity Logged';
            } else if (game.status === 'pending' && game.result === undefined) { // Only set to not attempted if no result and still pending
                game.status = 'pending'; // Or 'not_attempted' if you add such a status
                game.result = 'Not Attempted';
            }
        } else if (newStatus === 'upcoming') { 
          game.status = 'pending';
          game.currentProgress = 0;
          game.accumulatedDuration = 0;
          game.result = undefined;
          game.attempts = [];
          game.tryCount = 0;
        }
      });
      chal.activeGameId = null;
    }
    // ensureUpcomingChallenge(); // No longer automatically managing 'next-challenge' rescheduling here
    return deepCopy(chal);
  }
  return null;
};

export const setDataToggleOverallChallengeTimer = (id: string): Challenge | null => {
  const challengeIndex = challenges.findIndex(c => c.id === id);
  if (challengeIndex !== -1 && challenges[challengeIndex].status === 'live') {
    const chal = challenges[challengeIndex];
    if (chal.isChallengeTimerActive) {
      if (chal.challengeStartedAt) {
        const elapsed = (Date.now() - chal.challengeStartedAt) / 1000;
        chal.challengeAccumulatedDuration = (chal.challengeAccumulatedDuration || 0) + elapsed;
      }
      chal.isChallengeTimerActive = false;
      chal.challengeStartedAt = undefined;
    } else {
      chal.challengeStartedAt = Date.now();
      chal.isChallengeTimerActive = true;
    }
    return deepCopy(chal);
  }
  return null;
};

export const setDataActiveGameAndToggleTimer = (challengeId: string, gameId: string): Challenge | null => {
  const challengeIndex = challenges.findIndex(c => c.id === challengeId);
  if (challengeIndex === -1 || challenges[challengeIndex].status !== 'live') return null;

  const chal = challenges[challengeIndex];
  const gameIndex = chal.games.findIndex(g => g.id === gameId);
  if (gameIndex === -1) return null;

  const targetGame = chal.games[gameIndex];

  if (!chal.isChallengeTimerActive) { // If main challenge timer is paused, no game timers can run
    chal.games.forEach(g => {
        if (g.isTimerActive && g.timerStartedAt) { // Pause any running game timer
            const elapsed = (Date.now() - g.timerStartedAt) / 1000;
            g.accumulatedDuration = (g.accumulatedDuration || 0) + elapsed;
        }
        g.isTimerActive = false;
        g.timerStartedAt = undefined;
        if (g.status === 'active' && !(g.currentProgress || 0 > 0) && !(g.tryCount || 0 > 0) && !(g.accumulatedDuration || 0 > 0)) {
            g.status = 'pending';
        }
    });
    chal.activeGameId = null; 
    return deepCopy(chal); 
  }

  // Pause any other game that might be active
  chal.games.forEach((g) => {
    if (g.id !== gameId && g.isTimerActive) {
      if (g.timerStartedAt) {
        const elapsed = (Date.now() - g.timerStartedAt) / 1000;
        g.accumulatedDuration = (g.accumulatedDuration || 0) + elapsed;
      }
      g.isTimerActive = false;
      g.timerStartedAt = undefined;
       if (g.status === 'active' && !(g.currentProgress || 0 > 0) && !(g.tryCount || 0 > 0) && !(g.accumulatedDuration || 0 > 0)) {
           g.status = 'pending';
        }
    }
  });
  
  // Toggle the target game
  if (targetGame.isTimerActive) { 
    if (targetGame.timerStartedAt) {
      const elapsed = (Date.now() - targetGame.timerStartedAt) / 1000;
      targetGame.accumulatedDuration = (targetGame.accumulatedDuration || 0) + elapsed;
    }
    targetGame.isTimerActive = false;
    targetGame.timerStartedAt = undefined;
    if (targetGame.status === 'active' && !(targetGame.currentProgress || 0 > 0) && !(targetGame.tryCount || 0 > 0) && !(targetGame.accumulatedDuration || 0 > 0) ) {
        targetGame.status = 'pending';
    }
    chal.activeGameId = null;
  } else { 
      targetGame.timerStartedAt = Date.now();
      targetGame.isTimerActive = true;
      if (targetGame.status === 'pending') targetGame.status = 'active';
      chal.activeGameId = gameId;
  }
  
  return deepCopy(chal);
};

export const setDataUpdateGameProgress = (challengeId: string, gameId: string, progressChange: number, note?: string): Challenge | null => {
  const challengeIndex = challenges.findIndex(c => c.id === challengeId);
  if (challengeIndex === -1 || challenges[challengeIndex].status !== 'live') return null;

  const chal = challenges[challengeIndex];
  const gameIndex = chal.games.findIndex(g => g.id === gameId);
  if (gameIndex === -1) return null;

  const game = chal.games[gameIndex];
  
  if (game.status === 'completed' && progressChange < 0) {
      game.status = 'active'; // Allow reopening a completed game if progress is decremented
  }

  game.currentProgress = Math.max(0, (game.currentProgress || 0) + progressChange);

  if (note && progressChange > 0) { 
    game.attempts = [...(game.attempts || []), `WIN: ${note}`];
  } else if (note) { 
    game.attempts = [...(game.attempts || []), `NOTE: ${note}`];
  }
  
  if (progressChange > 0) { // Increment tryCount only on positive progress (wins)
      game.tryCount = (game.tryCount || 0) + 1;
  }

  if (game.targetProgress !== undefined && game.targetProgress !== null && game.currentProgress >= game.targetProgress) {
    game.status = 'completed';
    game.result = `${game.currentProgress}/${game.targetProgress}`;
    if (game.isTimerActive && game.timerStartedAt) { // If game completes while timer is active, stop its timer
      const elapsed = (Date.now() - game.timerStartedAt) / 1000;
      game.accumulatedDuration = (game.accumulatedDuration || 0) + elapsed;
      game.isTimerActive = false;
      game.timerStartedAt = undefined;
      if (chal.activeGameId === game.id) { // If this was the active game, clear activeGameId
        chal.activeGameId = null;
      }
    }
  } else if (game.status === 'completed' && game.targetProgress && game.currentProgress < game.targetProgress) {
    // If status was completed but progress is now below target, revert to active (or pending if no activity)
    game.status = (game.isTimerActive || (game.accumulatedDuration || 0) > 0 || (game.tryCount || 0) > 0 || (game.currentProgress || 0) > 0) ? 'active' : 'pending';
  } else if (game.status !== 'completed' && (game.isTimerActive || (game.accumulatedDuration || 0) > 0 || (game.tryCount || 0) > 0 || (game.currentProgress || 0) > 0)) {
    game.status = 'active'; // Ensure it's active if there's any form of interaction
  }
  return deepCopy(chal);
};

export const setDataLogGameTry = (challengeId: string, gameId: string, note?: string): Challenge | null => {
  const challengeIndex = challenges.findIndex(c => c.id === challengeId);
  if (challengeIndex === -1 || challenges[challengeIndex].status !== 'live') return null;

  const chal = challenges[challengeIndex];
  const gameIndex = chal.games.findIndex(g => g.id === gameId);
  if (gameIndex === -1) return null;

  const game = chal.games[gameIndex];
  game.tryCount = (game.tryCount || 0) + 1;
  if (note) {
    game.attempts = [...(game.attempts || []), `TRY: ${note}`];
  }
  if (game.status === 'pending' && (chal.isChallengeTimerActive || game.isTimerActive || (game.tryCount || 0) > 0 )) {
    game.status = 'active';
  }
  return deepCopy(chal);
};

export const setDataAddOverallNote = (challengeId: string, note: string): Challenge | null => {
    const challengeIndex = challenges.findIndex(c => c.id === challengeId);
    if (challengeIndex !== -1) {
        const chal = challenges[challengeIndex];
        if (!chal.overallNotes) {
            chal.overallNotes = [];
        }
        chal.overallNotes.push(note);
        return deepCopy(chal);
    }
    return null;
};

export const setDataEditOverallNote = (challengeId: string, noteIndex: number, newNoteText: string): Challenge | null => {
    const challengeIndex = challenges.findIndex(c => c.id === challengeId);
    if (challengeIndex !== -1) {
        const chal = challenges[challengeIndex];
        if (chal.overallNotes && chal.overallNotes[noteIndex] !== undefined) {
            chal.overallNotes[noteIndex] = newNoteText;
            return deepCopy(chal);
        }
    }
    return null;
};

export const setDataDeleteOverallNote = (challengeId: string, noteIndex: number): Challenge | null => {
    const challengeIndex = challenges.findIndex(c => c.id === challengeId);
    if (challengeIndex !== -1) {
        const chal = challenges[challengeIndex];
        if (chal.overallNotes && chal.overallNotes[noteIndex] !== undefined) {
            chal.overallNotes.splice(noteIndex, 1);
            return deepCopy(chal);
        }
    }
    return null;
};


// GETTER functions
export const getDataChallenges = (): Challenge[] => {
  return deepCopy(challenges).sort((a, b) => {
    const dateA = a.scheduledDateTime ? new Date(a.scheduledDateTime) : new Date(a.date);
    const dateB = b.scheduledDateTime ? new Date(b.scheduledDateTime) : new Date(b.date);
    return dateB.getTime() - dateA.getTime(); 
  });
};

export const getDataChallengeById = (id: string): Challenge | null => {
  const challenge = challenges.find(challenge => challenge.id === id);
  return challenge ? deepCopy(challenge) : null;
};

export const getDataUpcomingChallenge = (): Challenge | null => {
  const now = new Date();
  const upcomingAndFuture = challenges
      .filter(c => c.status === 'upcoming' && c.scheduledDateTime && new Date(c.scheduledDateTime) > now)
      .sort((a,b) => new Date(a.scheduledDateTime!).getTime() - new Date(b.scheduledDateTime!).getTime()); 
  return upcomingAndFuture.length > 0 ? deepCopy(upcomingAndFuture[0]) : null;
};

export const getDataLiveChallengeDetails = (): Challenge | null => {
  const liveChallenge = challenges.find(c => c.status === 'live');
  return liveChallenge ? deepCopy(liveChallenge) : null;
}

// Other SETTER functions
export const setDataResetChallengeToUpcoming = (id: string, futureDate: Date): Challenge | null => {
    const challengeIndex = challenges.findIndex(c => c.id === id);
    if (challengeIndex !== -1) {
        const chalRef = challenges[challengeIndex]; 
        
        chalRef.status = 'upcoming'; 
        chalRef.scheduledDateTime = futureDate.toISOString();
        chalRef.date = futureDate.toISOString().split('T')[0]; 
        chalRef.challengeAccumulatedDuration = 0;
        chalRef.challengeStartedAt = undefined;
        chalRef.isChallengeTimerActive = false;
        chalRef.activeGameId = null;
        chalRef.startTime = undefined; 
        chalRef.endTime = undefined;
        chalRef.totalDuration = undefined; 
        chalRef.overallNotes = [];
       
        chalRef.games.forEach(game => {
            game.currentProgress = 0;
            game.accumulatedDuration = 0;
            game.status = 'pending';
            game.isTimerActive = false;
            game.timerStartedAt = undefined;
            game.result = undefined;
            game.attempts = [];
            game.tryCount = 0;
        });
        
        // ensureUpcomingChallenge(); // No longer automatically creating default challenges after admin action
        return deepCopy(chalRef);
    }
    return null;
}

export const setDataDeleteChallengeById = (id: string): boolean => {
  const initialLength = challenges.length;
  challenges = challenges.filter(c => c.id !== id);
  const deleted = challenges.length < initialLength;
  // ensureUpcomingChallenge(); // No longer automatically creating default challenges
  return deleted;
};

// This function is now a NO-OP as requested.
// It will not automatically create or reschedule any default 'next-challenge'.
const ensureUpcomingChallenge = () => {
    // console.log("ensureUpcomingChallenge called - NO-OP as per user request.");
    // The initial 'next-challenge' is set in the hardcoded data.
    // No further automatic creation/resetting of a default challenge.
};


// On module load, ensure the initial 'next-challenge' (if defined in the hardcoded array)
// has its game states properly initialized with defaultGameFlags.
// This is a one-time setup for the initial data.
(() => {
    const nextChallengeTemplate = challenges.find(c => c.id === 'next-challenge');
    if (nextChallengeTemplate && nextChallengeTemplate.games) {
        nextChallengeTemplate.games = nextChallengeTemplate.games.map(game => {
            const gameWithDefaults: Game = {
                ...defaultGameFlags, // Apply defaults first
                ...game,             // Then apply specific game properties from the template
                id: game.id || `g${Math.random().toString(36).substr(2, 9)}`, // Ensure ID
            };
            // Ensure optional numeric fields that might be null from form are undefined if empty
            if (gameWithDefaults.targetProgress === null) gameWithDefaults.targetProgress = undefined;
            return gameWithDefaults;
        });
    }
})();
    
