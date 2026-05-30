
import type { LucideProps } from 'lucide-react';
import {
  Swords,
  Crown,
  Shield,
  Gamepad2,
  Coins,
  Castle,
  BedDouble,
  LocateFixed,
  TrendingUp,
  Car,
  CarFront,
  Star,
  Brain,
  ToyBrick,
  Trophy,
  Target,
  CalendarDays,
  Crosshair,
  Plane,
  Bus,
  Dices,
  PawPrint,
  Bomb,
  Globe2,
  Worm,
  Pickaxe,
} from 'lucide-react';

interface GameIconProps extends LucideProps {
  iconName: string;
}

// Custom tennis racket (lucide is missing one) – follows the same 24x24 stroke style.
const TennisRacket = ({ className, ...props }: LucideProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className as string}
    {...props}
  >
    <ellipse cx="9" cy="9" rx="6.5" ry="7.5" transform="rotate(45 9 9)" />
    <path d="M9 4.5v9M4.5 9h9" />
    <path d="m13.2 13.2 6 6" />
    <path d="m17.5 17.5 3 3" />
  </svg>
);

const iconMap: Record<string, React.ElementType> = {
  // Shooter
  csgo: Crosshair,
  cs2: Crosshair,
  cs: Crosshair,
  valorant: Target,
  warzone: Plane,
  csgodz: LocateFixed, // CSGO Danger Zone
  crabgame: Gamepad2,

  // Battle Royale & Platzierung
  fallguys: Crown,
  fortnite: Bus, // battle bus
  bedwars: BedDouble,
  mariokart: CarFront,
  marioparty: Dices,

  // MOBA & Team
  lol: Swords,
  clashroyale: Castle,
  brawlstars: Star,
  rocketleague: Car,

  // Party & Sport
  tennis: TennisRacket,
  partyanimals: PawPrint,

  // Score-Jagd
  higherlower: TrendingUp,
  wwm: Coins, // Wer wird Millionär
  geoguessr: Globe2,
  slitherio: Worm,

  // Speedrun & Co-op
  minecraft: ToyBrick,
  minecraftspeedrun: Pickaxe,
  ktane: Bomb, // Keep Talking and Nobody Explodes
  assoziationsspiel: Brain,

  // Generic / UI
  default: Gamepad2,
  trophy: Trophy,
  target: Target,
  calendar: CalendarDays,
};

export function GameIconFactory({ iconName, ...props }: GameIconProps) {
  const IconComponent = iconMap[(iconName || '').toLowerCase()] || iconMap.default;
  return <IconComponent {...props} />;
}
