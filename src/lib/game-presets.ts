import type { GameTrackingType } from '@/types';

// A selectable, pre-configured game for the "Create Challenge" flow.
// Picking one fills in name, icon, objective and the whole logging behaviour,
// so the admin never has to think about "what do I enter for a b2b win".
export interface GamePresetVariant {
  id: string;
  label: string; // chip label, e.g. "3 Crowns", "1 Million", "Back-to-Back"
  target?: number;
  backToBack?: boolean;
  nameOverride?: string; // full name override for this variant
  nameSuffix?: string; // appended to the base name, e.g. " 20"
  objective?: string; // explicit objective override
}

export interface GamePreset {
  id: string;
  name: string;
  iconName: string; // GameIconFactory key
  category: string; // grouping in the picker
  trackingType: GameTrackingType;
  target?: number; // default wins / target score / 1
  allowDraw?: boolean;
  backToBack?: boolean;
  scoreUnit?: string; // "", "k", "pts"
  scoreLabel?: string; // label for the score / placement field
  attemptLabel?: string; // neutral attempt button label
  winLabel?: string; // win button label
  objective: string; // default objective text
  blurb: string; // one-liner shown in the picker
  variants?: GamePresetVariant[];
}

export const CUSTOM_PRESET_ID = 'custom';

// Friendly, locale-aware number formatting for objectives ("500000" -> "500.000").
export const formatScoreValue = (value: number, unit?: string): string => {
  const formatted = new Intl.NumberFormat('de-DE').format(value);
  return unit ? `${formatted}${unit}` : formatted;
};

export const GAME_PRESETS: GamePreset[] = [
  // ---------------------------------------------------------------- Shooter ---
  {
    id: 'cs',
    name: 'Counter-Strike',
    iconName: 'cs2',
    category: 'Shooter',
    trackingType: 'winLossDraw',
    target: 2,
    allowDraw: true,
    scoreLabel: 'Score (z.B. 13:5)',
    objective: '2 Siege',
    blurb: 'Sieg / Niederlage / Remis pro Match, optional mit Score.',
    variants: [
      { id: 'bo1', label: '1 Sieg', target: 1, objective: '1 Sieg' },
      { id: 'wins2', label: '2 Siege', target: 2, objective: '2 Siege' },
      { id: 'wins3', label: '3 Siege', target: 3, objective: '3 Siege' },
      { id: 'b2b', label: 'Back-to-Back', target: 2, backToBack: true, nameSuffix: ' b2b', objective: '2 Siege in Folge (Back-to-Back)' },
    ],
  },
  {
    id: 'valorant',
    name: 'Valorant',
    iconName: 'valorant',
    category: 'Shooter',
    trackingType: 'winLossDraw',
    target: 2,
    allowDraw: true,
    scoreLabel: 'Score (z.B. 13:7)',
    objective: '2 Siege',
    blurb: 'Sieg / Niederlage / Remis pro Match, optional mit Score.',
    variants: [
      { id: 'wins1', label: '1 Sieg', target: 1, objective: '1 Sieg' },
      { id: 'wins2', label: '2 Siege', target: 2, objective: '2 Siege' },
      { id: 'wins3', label: '3 Siege', target: 3, objective: '3 Siege' },
      { id: 'b2b', label: 'Back-to-Back', target: 2, backToBack: true, nameSuffix: ' b2b', objective: '2 Siege in Folge (Back-to-Back)' },
    ],
  },
  {
    id: 'warzone',
    name: 'Warzone',
    iconName: 'warzone',
    category: 'Shooter',
    trackingType: 'attempts',
    target: 1,
    winLabel: 'Win',
    attemptLabel: 'Drop',
    scoreLabel: 'Platz (z.B. Top 5)',
    objective: '1× Win',
    blurb: 'Drops zählen, Win abhaken – Platzierung optional als Notiz.',
    variants: [
      { id: 'win1', label: '1 Win', target: 1, objective: '1× Win' },
      { id: 'win2', label: '2 Wins', target: 2, objective: '2× Win' },
    ],
  },
  // ----------------------------------------------------- Battle Royale & Co. ---
  {
    id: 'fall-guys',
    name: 'Fall Guys',
    iconName: 'fallguys',
    category: 'Battle Royale & Platzierung',
    trackingType: 'attempts',
    target: 1,
    winLabel: 'Crown',
    attemptLabel: 'Versuch',
    scoreLabel: 'Notiz (z.B. Finale, 2.)',
    objective: '1× Crown',
    blurb: 'Nur „Versuch" tappen; bei Crown oder knapper Platzierung Notiz dazu.',
    variants: [
      { id: 'crown1', label: '1 Crown', target: 1, objective: '1× Crown' },
      { id: 'crown3', label: '3 Crowns', target: 3, objective: '3× Crown' },
    ],
  },
  {
    id: 'fortnite',
    name: 'Fortnite',
    iconName: 'fortnite',
    category: 'Battle Royale & Platzierung',
    trackingType: 'attempts',
    target: 1,
    winLabel: 'Victory Royale',
    attemptLabel: 'Match',
    scoreLabel: 'Platz (z.B. Top 10)',
    objective: '1× Victory Royale',
    blurb: 'Matches zählen, Victory Royale abhaken – Platz optional.',
    variants: [
      { id: 'win1', label: '1 Win', target: 1, objective: '1× Victory Royale' },
      { id: 'win2', label: '2 Wins', target: 2, objective: '2× Victory Royale' },
    ],
  },
  {
    id: 'bedwars',
    name: 'Minecraft Bedwars',
    iconName: 'bedwars',
    category: 'Battle Royale & Platzierung',
    trackingType: 'attempts',
    target: 1,
    winLabel: 'Win',
    attemptLabel: 'Runde',
    scoreLabel: 'Platz (z.B. 2.)',
    objective: '1× Win',
    blurb: 'Runden zählen, Win abhaken – Platzierung optional als Notiz.',
    variants: [
      { id: 'win1', label: '1 Win', target: 1, objective: '1× Win' },
      { id: 'win3', label: '3 Wins', target: 3, objective: '3× Win' },
    ],
  },
  {
    id: 'mario-kart',
    name: 'Mario Kart',
    iconName: 'mariokart',
    category: 'Battle Royale & Platzierung',
    trackingType: 'attempts',
    target: 1,
    winLabel: '1. Platz',
    attemptLabel: 'Rennen',
    scoreLabel: 'Platz (z.B. 3.)',
    objective: '1× 1. Platz',
    blurb: 'Rennen zählen, 1. Platz abhaken – Platzierung optional.',
    variants: [
      { id: 'first1', label: '1× 1.', target: 1, objective: '1× 1. Platz' },
      { id: 'cup', label: 'Grand Prix Gold', target: 1, objective: 'Grand Prix mit Gold abschließen' },
    ],
  },
  {
    id: 'mario-party',
    name: 'Mario Party',
    iconName: 'marioparty',
    category: 'Battle Royale & Platzierung',
    trackingType: 'attempts',
    target: 1,
    winLabel: '1. Platz',
    attemptLabel: 'Partie',
    scoreLabel: 'Platz (z.B. 2.)',
    objective: '1× 1. Platz',
    blurb: 'Partien zählen, 1. Platz abhaken – Platzierung optional.',
  },
  // ------------------------------------------------------------- MOBA & Team ---
  {
    id: 'lol',
    name: 'League of Legends',
    iconName: 'lol',
    category: 'MOBA & Team',
    trackingType: 'winLossDraw',
    target: 1,
    allowDraw: false,
    scoreLabel: 'Notiz (z.B. KDA)',
    objective: '1 Sieg',
    blurb: 'Sieg / Niederlage pro Game, optional mit Notiz.',
    variants: [
      { id: 'win1', label: '1 Sieg', target: 1, objective: '1 Sieg' },
      { id: 'win2', label: '2 Siege', target: 2, objective: '2 Siege' },
      { id: 'b2b', label: 'Back-to-Back', target: 2, backToBack: true, nameSuffix: ' b2b', objective: '2 Siege in Folge (Back-to-Back)' },
    ],
  },
  {
    id: 'clash-royale',
    name: 'Clash Royale Duo',
    iconName: 'clashroyale',
    category: 'MOBA & Team',
    trackingType: 'winLossDraw',
    target: 2,
    allowDraw: true,
    scoreLabel: 'Kronen (z.B. 3:1)',
    objective: '2 Siege',
    blurb: 'Sieg / Niederlage / Remis pro Match, optional mit Kronen.',
    variants: [
      { id: 'win2', label: '2 Siege', target: 2, objective: '2 Siege' },
      { id: 'win3', label: '3 Siege', target: 3, objective: '3 Siege' },
      { id: 'b2b', label: 'Back-to-Back', target: 2, backToBack: true, nameSuffix: ' b2b', objective: '2 Siege in Folge (Back-to-Back)' },
    ],
  },
  {
    id: 'brawl-stars',
    name: 'Brawl Stars',
    iconName: 'brawlstars',
    category: 'MOBA & Team',
    trackingType: 'winLossDraw',
    target: 3,
    allowDraw: true,
    scoreLabel: 'Notiz',
    objective: '3 Siege',
    blurb: 'Sieg / Niederlage / Remis – ideal auch für Win-Streaks.',
    variants: [
      { id: 'win3', label: '3 Siege', target: 3, objective: '3 Siege' },
      { id: 'streak10', label: 'Win-Streak 10', target: 10, backToBack: true, nameSuffix: ' Win-Streak', objective: '10 Siege in Folge' },
    ],
  },
  {
    id: 'rocket-league',
    name: 'Rocket League',
    iconName: 'rocketleague',
    category: 'MOBA & Team',
    trackingType: 'winLossDraw',
    target: 1,
    allowDraw: false,
    scoreLabel: 'Score (z.B. 4:1)',
    objective: '1 Sieg',
    blurb: 'Sieg / Niederlage pro Match, optional mit Score.',
    variants: [
      { id: 'win1', label: '1 Sieg', target: 1, objective: '1 Sieg' },
      { id: 'b2b', label: 'Back-to-Back', target: 2, backToBack: true, nameSuffix: ' b2b', objective: '2 Siege in Folge (Back-to-Back)' },
    ],
  },
  // ------------------------------------------------------------ Party & Sport ---
  {
    id: 'switch-tennis',
    name: 'Switch Sports Tennis',
    iconName: 'tennis',
    category: 'Party & Sport',
    trackingType: 'winLossDraw',
    target: 2,
    allowDraw: false,
    scoreLabel: 'Satz (z.B. 4:2)',
    objective: '2 Siege',
    blurb: 'Sieg / Niederlage pro Match, optional mit Satz.',
    variants: [
      { id: 'win2', label: '2 Siege', target: 2, objective: '2 Siege' },
      { id: 'win3', label: '3 Siege', target: 3, objective: '3 Siege' },
    ],
  },
  {
    id: 'party-animals',
    name: 'Party Animals',
    iconName: 'partyanimals',
    category: 'Party & Sport',
    trackingType: 'winLossDraw',
    target: 3,
    allowDraw: false,
    scoreLabel: 'Notiz',
    objective: '3 Siege',
    blurb: 'Sieg / Niederlage pro Runde, optional mit Notiz.',
  },
  // -------------------------------------------------------------- Score-Jagd ---
  {
    id: 'higher-lower',
    name: 'Higher Lower',
    iconName: 'higherlower',
    category: 'Score-Jagd',
    trackingType: 'score',
    target: 20,
    scoreLabel: 'Score',
    attemptLabel: 'Versuch',
    objective: 'Score 20 erreichen',
    blurb: 'Viele schnelle Versuche – nur Bestwert & Versuchszahl zählen.',
    variants: [
      { id: 's20', label: 'Score 20', target: 20, nameSuffix: ' 20', objective: 'Score 20 erreichen' },
      { id: 's25', label: 'Score 25', target: 25, nameSuffix: ' 25', objective: 'Score 25 erreichen' },
      { id: 's35', label: 'Score 35', target: 35, nameSuffix: ' 35', objective: 'Score 35 erreichen' },
    ],
  },
  {
    id: 'wwm',
    name: 'Wer wird Millionär',
    iconName: 'wwm',
    category: 'Score-Jagd',
    trackingType: 'score',
    target: 500000,
    scoreLabel: 'Gewinn (€)',
    attemptLabel: 'Versuch',
    objective: '500.000 € knacken',
    blurb: 'Versuche zählen, höchsten Gewinn festhalten.',
    variants: [
      { id: 'k500', label: '500k', target: 500000, nameSuffix: ' 500k', objective: '500.000 € knacken' },
      { id: 'mio', label: '1 Million', target: 1000000, nameSuffix: ' 1 Mio', objective: '1.000.000 € knacken' },
    ],
  },
  {
    id: 'geoguessr',
    name: 'GeoGuessr',
    iconName: 'geoguessr',
    category: 'Score-Jagd',
    trackingType: 'score',
    target: 20000,
    scoreLabel: 'Punkte',
    attemptLabel: 'Runde',
    objective: '20.000 Punkte erreichen',
    blurb: 'Versuche zählen, höchste Punktzahl festhalten.',
    variants: [
      { id: 'p20', label: '20k Punkte', target: 20000, nameSuffix: ' 20k', objective: '20.000 Punkte erreichen' },
      { id: 'p25', label: 'Perfekt (25k)', target: 25000, nameSuffix: ' 25k', objective: '25.000 Punkte (perfekt)' },
    ],
  },
  {
    id: 'slither',
    name: 'Slither.io',
    iconName: 'slitherio',
    category: 'Score-Jagd',
    trackingType: 'score',
    target: 10000,
    scoreLabel: 'Score',
    attemptLabel: 'Versuch',
    objective: 'Score 10.000 erreichen',
    blurb: 'Versuche zählen, höchsten Score festhalten.',
    variants: [
      { id: 's10', label: '10k', target: 10000, nameSuffix: ' 10k', objective: 'Score 10.000 erreichen' },
      { id: 's25', label: '25k', target: 25000, nameSuffix: ' 25k', objective: 'Score 25.000 erreichen' },
    ],
  },
  // -------------------------------------------------------- Speedrun & Co-op ---
  {
    id: 'minecraft-speedrun',
    name: 'Minecraft Speedrun',
    iconName: 'minecraftspeedrun',
    category: 'Speedrun & Co-op',
    trackingType: 'completion',
    target: 1,
    winLabel: 'Geschafft',
    attemptLabel: 'Versuch',
    scoreLabel: 'Zeit / Notiz',
    objective: 'Speedrun abschließen',
    blurb: 'Ein Ziel, Zeit läuft mit – „Geschafft" übernimmt die Spielzeit.',
    variants: [
      { id: 'speedrun', label: 'Speedrun', nameOverride: 'Minecraft Speedrun', objective: 'Ender-Drache so schnell wie möglich' },
      { id: 'complete', label: 'Durchspielen', nameOverride: 'Minecraft Durchspielen', objective: 'Spiel komplett durchspielen' },
      { id: 'challenge', label: 'Challenge', nameOverride: 'Minecraft Challenge', objective: 'Challenge abschließen' },
    ],
  },
  {
    id: 'ktane',
    name: 'Keep Talking and Nobody Explodes',
    iconName: 'ktane',
    category: 'Speedrun & Co-op',
    trackingType: 'completion',
    target: 1,
    winLabel: 'Entschärft',
    attemptLabel: 'Bombe (Boom)',
    scoreLabel: 'Notiz',
    objective: 'Bombe entschärfen',
    blurb: 'Boom = Versuch, „Entschärft" schließt das Spiel ab.',
  },
];

export const getPresetById = (id?: string): GamePreset | undefined =>
  id ? GAME_PRESETS.find((preset) => preset.id === id) : undefined;

export const getPresetCategories = (): string[] =>
  Array.from(new Set(GAME_PRESETS.map((preset) => preset.category)));

// The shape injected into the create/edit form when a preset (or "custom") is chosen.
export interface GameDraft {
  presetId: string;
  name: string;
  iconName: string;
  objective: string;
  targetProgress: number | null;
  trackingType: GameTrackingType;
  allowDraw: boolean;
  backToBack: boolean;
  scoreUnit: string;
  scoreLabel: string;
  attemptLabel: string;
  winLabel: string;
}

export const CUSTOM_GAME_DRAFT: GameDraft = {
  presetId: CUSTOM_PRESET_ID,
  name: '',
  iconName: 'default',
  objective: '',
  targetProgress: null,
  trackingType: 'attempts',
  allowDraw: false,
  backToBack: false,
  scoreUnit: '',
  scoreLabel: '',
  attemptLabel: '',
  winLabel: '',
};

export const buildGameDraft = (preset: GamePreset, variant?: GamePresetVariant): GameDraft => {
  const target = variant?.target ?? preset.target ?? null;
  const backToBack = variant?.backToBack ?? preset.backToBack ?? false;
  const name = variant?.nameOverride
    ? variant.nameOverride
    : `${preset.name}${variant?.nameSuffix ?? ''}`;
  const objective = variant?.objective ?? preset.objective;

  return {
    presetId: preset.id,
    name,
    iconName: preset.iconName,
    objective,
    targetProgress: target,
    trackingType: preset.trackingType,
    allowDraw: preset.allowDraw ?? false,
    backToBack,
    scoreUnit: preset.scoreUnit ?? '',
    scoreLabel: preset.scoreLabel ?? '',
    attemptLabel: preset.attemptLabel ?? '',
    winLabel: preset.winLabel ?? '',
  };
};
