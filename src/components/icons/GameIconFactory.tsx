
import type { LucideProps } from 'lucide-react';
import {
  Swords,
  Crown,
  Shield,
  Gamepad2,
  DollarSign,
  Castle,
  BedDouble,
  LocateFixed,
  TrendingUp,
  Car,
  Star,
  Brain,
  ToyBrick,
  Trophy,
  Target,
  CalendarDays
} from 'lucide-react';

interface GameIconProps extends LucideProps {
  iconName: string;
}

const iconMap: Record<string, React.ElementType> = {
  csgo: Swords,
  cs2: Swords,
  fallguys: Crown,
  valorant: Shield,
  crabgame: Gamepad2,
  wwm: DollarSign, // Wer wird Millionär
  fortnite: Castle,
  bedwars: BedDouble,
  csgodz: LocateFixed, // CSGO Danger Zone
  higherlower: TrendingUp,
  lol: Swords, // League of Legends
  rocketleague: Car,
  brawlstars: Star,
  slitherio: Gamepad2, // Changed from Snake to Gamepad2
  assoziationsspiel: Brain,
  minecraft: ToyBrick,
  default: Gamepad2,
  trophy: Trophy,
  target: Target,
  calendar: CalendarDays
};

export function GameIconFactory({ iconName, ...props }: GameIconProps) {
  const IconComponent = iconMap[iconName.toLowerCase()] || iconMap.default;
  return <IconComponent {...props} />;
}
