
"use client";

import { useState, useEffect, useTransition } from 'react';
import { notFound, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { GameStatusDisplay } from '@/components/GameStatusDisplay';
import { GameIconFactory } from '@/components/icons/GameIconFactory';
import { CalendarDays, Clock, Hourglass, ListChecks, AlertTriangle, Users, Zap, Trash2, Loader2, NotepadText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { deleteChallengeAction } from '@/app/actions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import type { Challenge } from '@/types';
import { useAuth } from '@/context/AuthContext';

interface ChallengeDetailsClientProps {
  initialChallenge: Challenge; // Server component will ensure this is not null via notFound()
}

const formatTime = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const InfoItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string }) => (
  <div className="flex items-start gap-2.5 p-3 bg-muted/40 dark:bg-muted/20 rounded-md border border-border/50">
    <Icon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
    <div>
        <span className="block text-xs font-medium text-muted-foreground">{label}</span>
        <p className="font-semibold text-foreground leading-tight">{value}</p>
    </div>
  </div>
);

export default function ChallengeDetailsClient({ initialChallenge }: ChallengeDetailsClientProps) {
  const { isAdmin } = useAuth();
  const [challenge, setChallenge] = useState<Challenge>(initialChallenge);
  // isLoading is primarily for client-side initiated actions like delete, not initial load from server.
  const [isDeleting, startDeleteTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Effect to update local state if initialChallenge prop changes
  // This might happen if the parent Server Component re-renders with new data for the same ID.
  useEffect(() => {
    setChallenge(initialChallenge);
  }, [initialChallenge]);

  const handleDeleteChallenge = async () => {
    if (!challenge || !isAdmin || challenge.status !== 'past') {
      toast({ title: "Error", description: "Challenge cannot be deleted or you don't have permission.", variant: "destructive" });
      setShowDeleteConfirm(false);
      return;
    }
    startDeleteTransition(async () => {
      const result = await deleteChallengeAction(challenge.id);
      if (result.success) {
        toast({ title: "Challenge Deleted", description: `"${challenge.title}" has been successfully deleted.`, variant: "default" });
        router.push('/');
      } else {
        toast({ title: "Deletion Failed", description: "Could not delete the challenge. Please try again.", variant: "destructive" });
      }
      setShowDeleteConfirm(false);
    });
  };

  // Server ensures challenge exists. If for some reason client state becomes invalid, provide a fallback.
  if (!challenge) {
    return (
        <div className="text-center py-10">
            <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">Challenge Data Error</h1>
            <p className="mt-6 text-base leading-7 text-muted-foreground">Could not display challenge details.</p>
        </div>
    );
  }

  const displayDate = challenge.scheduledDateTime
    ? new Date(challenge.scheduledDateTime).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })
    : new Date(challenge.date).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' });

  const statusConfig = {
    past: { text: 'Concluded', variant: 'secondary', icon: <CalendarDays className="h-4 w-4 mr-1.5" />, bgColor: 'bg-secondary text-secondary-foreground' },
    upcoming: { text: 'Upcoming', variant: 'default', icon: <Zap className="h-4 w-4 mr-1.5 text-yellow-300" />, bgColor: 'bg-blue-500 text-blue-foreground' },
    live: { text: 'LIVE NOW!', variant: 'destructive', icon: <Zap className="h-4 w-4 mr-1.5 animate-ping" />, bgColor: 'bg-red-600 text-red-foreground' },
  } as const;

  const currentStatusInfo = statusConfig[challenge.status] || statusConfig.past;

  return (
    <div className="space-y-8 lg:space-y-12">
      <Card className="overflow-hidden shadow-xl rounded-xl border border-border">
        {challenge.image && (
          <div className="relative w-full h-60 md:h-80 lg:h-96">
            <Image
                src={challenge.image}
                alt={challenge.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 50vw"
                className="object-cover"
                priority
                data-ai-hint={challenge.dataAihint || "gaming competition large banner"}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6 md:p-8 w-full">
                <Badge
                    variant={currentStatusInfo.variant}
                    className={cn(
                        "text-sm md:text-base px-3 py-1.5 font-semibold shadow-lg flex items-center w-fit",
                        currentStatusInfo.bgColor
                    )}
                >
                    {currentStatusInfo.icon}
                    {currentStatusInfo.text}
                </Badge>
                <CardTitle className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mt-2 drop-shadow-lg">
                    {challenge.title}
                </CardTitle>
            </div>
          </div>
        )}

        {!challenge.image && (
             <CardHeader className="border-b bg-card p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <CardTitle className="text-3xl md:text-4xl font-extrabold">{challenge.title}</CardTitle>
                    <Badge
                         variant={currentStatusInfo.variant}
                         className={cn("text-sm px-3 py-1 font-semibold flex items-center", currentStatusInfo.bgColor)}
                    >
                        {currentStatusInfo.icon}
                        {currentStatusInfo.text}
                    </Badge>
                </div>
            </CardHeader>
        )}

        <CardContent className="p-6 md:p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
            <InfoItem icon={CalendarDays} label="Date" value={displayDate} />
            {challenge.startTime && <InfoItem icon={Clock} label="Start Time" value={challenge.startTime} />}
            {challenge.endTime && <InfoItem icon={Clock} label="End Time" value={challenge.endTime} />}
            {challenge.totalDuration && <InfoItem icon={Hourglass} label="Est. Duration" value={challenge.totalDuration} />}
             {challenge.challengeAccumulatedDuration !== undefined && challenge.status !== 'upcoming' && <InfoItem icon={Hourglass} label="Actual Duration" value={formatTime(challenge.challengeAccumulatedDuration)} />}
          </div>

          {challenge.status === 'live' && (
            <Button asChild size="lg" className="w-full md:w-auto bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-lg animate-pulse hover:animate-none">
              <Link href="/challenges/live">
                <GameIconFactory iconName="target" className="mr-2 h-5 w-5" />
                View Live Dashboard
              </Link>
            </Button>
          )}
        </CardContent>
         {isAdmin && challenge.status === 'past' && (
            <CardFooter className="p-4 border-t bg-muted/30">
                <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="w-full sm:w-auto" onClick={() => setShowDeleteConfirm(true)} disabled={isDeleting}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            {isDeleting ? "Deleting..." : "Admin: Delete This Past Challenge"}
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action will permanently delete the challenge "{challenge.title}". This cannot be undone.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteChallenge} disabled={isDeleting} className="bg-destructive hover:bg-destructive/80">
                            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Yes, delete it
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardFooter>
        )}
      </Card>

      <section>
        <h2 className="text-2xl md:text-3xl font-semibold mb-6 flex items-center gap-3">
          <ListChecks className="h-7 w-7 text-primary" />
          Games & Objectives
        </h2>
        {challenge.games.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {challenge.games.map((game) => (
                <GameStatusDisplay key={game.id} game={game} />
            ))}
            </div>
        ) : (
            <p className="text-muted-foreground">No games were part of this challenge.</p>
        )}
      </section>

      {(challenge.playerIssues && challenge.playerIssues.length > 0) ||
       (challenge.detailedGameAttempts && challenge.detailedGameAttempts.length > 0) || // This field is legacy
       (challenge.overallNotes && challenge.overallNotes.length > 0) ? (
        <>
          <Separator className="my-8 md:my-10" />
          <section className="space-y-6">
            <h2 className="text-2xl md:text-3xl font-semibold mb-6">Additional Details & Notes</h2>

            {challenge.playerIssues && challenge.playerIssues.length > 0 && (
              <Card className="shadow-md rounded-lg border">
                <CardHeader className="p-4 sm:p-5"><CardTitle className="flex items-center gap-2 text-xl"><Users className="h-5 w-5 text-primary" />Player Issues</CardTitle></CardHeader>
                <CardContent className="p-4 sm:p-5 pt-0">
                  <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground">
                    {challenge.playerIssues.map((issue, index) => (
                      <li key={index}>
                        <strong className="text-foreground">{issue.playerName}:</strong>
                        {issue.gameCrashes ? ` Game Crashes: ${issue.gameCrashes}` : ''}
                        {issue.soundCrashes ? ` Sound Crashes: ${issue.soundCrashes}` : ''}
                        {issue.pcInternetCrashes ? ` PC/Internet Crashes: ${issue.pcInternetCrashes}` : ''}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {challenge.overallNotes && challenge.overallNotes.length > 0 && (
              <Card className="shadow-md rounded-lg border">
                <CardHeader className="p-4 sm:p-5"><CardTitle className="flex items-center gap-2 text-xl"><NotepadText className="h-5 w-5 text-primary" />Overall Notes</CardTitle></CardHeader>
                <CardContent className="p-4 sm:p-5 pt-0">
                  <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground">
                    {challenge.overallNotes.map((note, index) => <li key={index} className="whitespace-pre-wrap break-words">{note}</li>)}
                  </ul>
                </CardContent>
              </Card>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
