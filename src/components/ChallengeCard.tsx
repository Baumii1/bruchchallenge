
import Link from 'next/link';
import type { Challenge } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GameIconFactory } from '@/components/icons/GameIconFactory';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { CalendarDays, Gamepad2, Info, Zap } from 'lucide-react';

interface ChallengeCardProps {
  challenge: Challenge;
  isUpcomingHero?: boolean;
}

export function ChallengeCard({ challenge, isUpcomingHero = false }: ChallengeCardProps) {
  const displayDate = challenge.scheduledDateTime
    ? new Date(challenge.scheduledDateTime).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date(challenge.date).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' });

  const statusConfig = {
    past: { text: 'Concluded', variant: 'secondary', icon: <CalendarDays className="h-3 w-3 mr-1" /> },
    upcoming: { text: 'Upcoming', variant: 'default', icon: <Zap className="h-3 w-3 mr-1 text-yellow-400" /> },
    live: { text: 'LIVE NOW!', variant: 'destructive', icon: <Zap className="h-3 w-3 mr-1 animate-pulse" /> },
  } as const;

  const currentStatus = statusConfig[challenge.status] || statusConfig.past;

  const cardClasses = cn(
    "flex flex-col overflow-hidden shadow-lg hover:shadow-xl dark:hover:shadow-primary/20 transition-all duration-300 rounded-xl border group",
    isUpcomingHero ? "border-2 border-accent bg-card" : "bg-card border-border",
    challenge.status === 'live' && "border-2 border-destructive shadow-destructive/30"
  );

  return (
    <Card className={cardClasses}>
      {challenge.image && (
         <div className="relative w-full h-48 sm:h-52 overflow-hidden"> {/* Fixed height */}
            <Image 
                src={challenge.image} 
                alt={challenge.title} 
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out"
                data-ai-hint={challenge.dataAihint || "gaming challenge"}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></div>
            <Badge 
                variant={currentStatus.variant}
                className="absolute top-3 right-3 text-xs px-2.5 py-1 shadow-md flex items-center"
            >
                {currentStatus.icon}
                {currentStatus.text}
            </Badge>
         </div>
      )}
      <CardHeader className="pb-2 pt-4 px-4 md:px-5">
        <CardTitle className={cn("text-lg md:text-xl font-semibold leading-tight group-hover:text-primary transition-colors", isUpcomingHero && "text-2xl text-accent")}>
          {challenge.title}
        </CardTitle>
        {!challenge.image && ( // Show status badge here if no image
            <Badge 
                variant={currentStatus.variant}
                className="text-xs px-2 py-0.5 mt-1 w-fit flex items-center"
            >
                 {currentStatus.icon}
                {currentStatus.text}
            </Badge>
        )}
        <CardDescription className="flex items-center text-xs text-muted-foreground pt-1.5">
          <CalendarDays className="h-3.5 w-3.5 mr-1.5 shrink-0" />
          {displayDate}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow px-4 md:px-5 pb-3 space-y-2.5">
        <div className="flex items-center text-sm text-muted-foreground">
          <Gamepad2 className="h-4 w-4 mr-1.5 shrink-0 text-primary/80" />
          <span>{challenge.games.length} Game{challenge.games.length === 1 ? '' : 's'}</span>
          {challenge.totalDuration && <span className="ml-auto text-xs font-mono">~{challenge.totalDuration}</span>}
        </div>
        
        <div className="flex flex-wrap gap-1.5">
          {challenge.games.slice(0, isUpcomingHero ? 4 : 3).map(game => (
            <Badge key={game.id} variant="outline" className="flex items-center gap-1 text-xs py-0.5 px-1.5 font-normal border-border hover:border-primary/50 hover:bg-primary/10 transition-colors">
              <GameIconFactory iconName={game.iconName} className="h-3 w-3" />
              {game.name}
            </Badge>
          ))}
          {challenge.games.length > (isUpcomingHero ? 4 : 3) && <Badge variant="outline" className="text-xs py-0.5 px-1.5 font-normal border-border">...</Badge>}
        </div>
      </CardContent>
      <CardFooter className="px-4 md:px-5 pb-4 pt-2">
        <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm hover:shadow-md transition-all">
          <Link href={`/challenges/${challenge.id}`}>
            <Info className="mr-2 h-4 w-4" /> View Details
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
