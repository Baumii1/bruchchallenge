
import type { Game } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { GameIconFactory } from '@/components/icons/GameIconFactory';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, PlayCircle, CircleDashed, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GameLog } from '@/components/GameLog';
import { computeGameStats, getEffectiveTrackingType, formatScoreValue } from '@/lib/game-logging';

interface GameStatusDisplayProps {
  game: Game;
}

export function GameStatusDisplay({ game }: GameStatusDisplayProps) {
  const type = getEffectiveTrackingType(game);
  const stats = computeGameStats(game);

  const progressPercentage = (() => {
    if (!stats.target || stats.target <= 0) return undefined;
    if (type === 'score') return Math.min(100, ((stats.best ?? 0) / stats.target) * 100);
    if (game.backToBack) return stats.completed ? 100 : Math.min(100, (stats.currentStreak / stats.target) * 100);
    if (type === 'completion') return stats.completed ? 100 : 0;
    return Math.min(100, (stats.wins / stats.target) * 100);
  })();

  const progressLabel = (() => {
    if (!stats.target || stats.target <= 0) return null;
    if (type === 'score') return `${formatScoreValue(stats.best ?? 0, game.scoreUnit)} / ${formatScoreValue(stats.target, game.scoreUnit)}`;
    if (game.backToBack) return `${stats.completed ? stats.target : stats.currentStreak} / ${stats.target} in Folge`;
    return `${Math.min(stats.wins, stats.target)} / ${stats.target}`;
  })();

  let statusIcon: React.ReactNode = <CircleDashed className="h-4 w-4" />;
  let statusTextClass = "text-muted-foreground";
  let badgeVariant: "default" | "secondary" | "destructive" | "outline" = "secondary";
  let progressIndicatorClass = "bg-primary";

  switch (game.status) {
    case 'completed':
      statusIcon = <CheckCircle className="h-4 w-4 text-green-500" />;
      statusTextClass = "text-green-600 dark:text-green-400";
      badgeVariant = "default";
      progressIndicatorClass = "bg-green-500";
      break;
    case 'failed':
      statusIcon = <XCircle className="h-4 w-4 text-red-500" />;
      statusTextClass = "text-red-600 dark:text-red-400";
      badgeVariant = "destructive";
      progressIndicatorClass = "bg-red-500";
      break;
    case 'active':
      statusIcon = <PlayCircle className="h-4 w-4 text-blue-500 animate-pulse" />;
      statusTextClass = "text-blue-500 dark:text-blue-400";
      badgeVariant = "default";
      progressIndicatorClass = "bg-blue-500";
      break;
    case 'pending':
    default:
      badgeVariant = "outline";
      break;
  }

  const cardClass = cn(
    "shadow-lg rounded-xl flex flex-col h-full border hover:border-primary/30 transition-colors duration-200",
    game.status === 'completed' && 'border-green-500/50 bg-green-50/30 dark:bg-green-900/10',
    game.status === 'active' && 'border-blue-500/50 bg-blue-50/30 dark:bg-blue-900/10',
    game.status === 'failed' && 'border-red-500/50 bg-red-50/30 dark:bg-red-900/10'
  );

  const hasLog = (game.log && game.log.length > 0) || (game.attempts && game.attempts.length > 0);

  return (
    <Card className={cardClass}>
      <CardHeader className="flex flex-row items-start gap-3.5 pb-2 pt-4 px-4">
        <GameIconFactory
            iconName={game.iconName}
            className={cn("h-10 w-10 mt-0.5 shrink-0",
                game.status === 'completed' ? 'text-green-600' :
                game.status === 'active' ? 'text-blue-500' :
                game.status === 'failed' ? 'text-red-600' :
                'text-primary'
            )}
        />
        <div className="flex-grow">
          <CardTitle className={cn("text-lg font-semibold leading-tight", statusTextClass)}>{game.name}</CardTitle>
          <CardDescription className="text-xs mt-0.5 line-clamp-2">{game.objective}</CardDescription>
        </div>
        {game.status && (
          <Badge
            variant={badgeVariant}
            className="ml-auto text-xs px-2 py-0.5 self-start shrink-0"
          >
            {game.status.toUpperCase()}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="px-4 pb-3 pt-2 flex-grow space-y-2.5">
        {game.result && (
            <div className="flex items-center text-sm font-medium">
                {statusIcon}
                <p className={cn("ml-1.5", statusTextClass)}>{game.result}</p>
            </div>
        )}

        {progressPercentage !== undefined && (
          <div className="my-1">
            <div className="flex justify-between text-xs mb-0.5">
              <span className="text-muted-foreground flex items-center"><Target className="h-3 w-3 mr-1"/>{game.backToBack ? 'Serie' : type === 'score' ? 'Score' : 'Fortschritt'}</span>
              <span className={cn("font-medium", statusTextClass)}>{progressLabel}</span>
            </div>
            <Progress value={progressPercentage} className="w-full h-1.5 rounded-full" indicatorClassName={progressIndicatorClass} />
          </div>
        )}

        {game.timeTaken && <p className="text-xs text-muted-foreground">Time: {game.timeTaken}</p>}
      </CardContent>
      {hasLog && (
        <CardFooter className="px-4 pb-3 pt-1 border-t border-border/50 mt-auto">
          <GameLog game={game} className="w-full pt-2" />
        </CardFooter>
      )}
    </Card>
  );
}
