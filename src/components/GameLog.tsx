"use client";

import type { Game, GameLogEntry, GameLogKind } from '@/types';
import { cn } from '@/lib/utils';
import { computeGameStats, getEffectiveTrackingType, normalizeGameLog, formatScoreValue } from '@/lib/game-logging';
import { ChevronUp, ChevronDown, Minus, Dot, Flame, Trophy, Trash2, History, Repeat } from 'lucide-react';

interface GameLogProps {
  game: Game;
  className?: string;
  /** When provided, an admin delete button is shown per entry. */
  onDeleteEntry?: (entryId: string) => void;
  disabled?: boolean;
}

const toneClasses: Record<'win' | 'loss' | 'draw' | 'neutral', { dot: string; border: string; text: string; bg: string }> = {
  win: { dot: 'text-green-600', border: 'border-l-green-500', text: 'text-green-700 dark:text-green-300', bg: 'bg-green-500/10' },
  loss: { dot: 'text-red-600', border: 'border-l-red-500', text: 'text-red-700 dark:text-red-300', bg: 'bg-red-500/10' },
  draw: { dot: 'text-amber-600', border: 'border-l-amber-500', text: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-500/10' },
  neutral: { dot: 'text-muted-foreground', border: 'border-l-border', text: 'text-foreground', bg: 'bg-muted/40' },
};

const kindTone = (kind: GameLogKind): 'win' | 'loss' | 'draw' | 'neutral' => {
  if (kind === 'win') return 'win';
  if (kind === 'loss') return 'loss';
  if (kind === 'draw') return 'draw';
  return 'neutral';
};

const KindIcon = ({ kind, className }: { kind: GameLogKind; className?: string }) => {
  if (kind === 'win') return <ChevronUp className={className} />;
  if (kind === 'loss') return <ChevronDown className={className} />;
  if (kind === 'draw') return <Minus className={className} />;
  return <Dot className={className} />;
};

const StatPill = ({ label, value, tone = 'neutral', icon }: { label: string; value: React.ReactNode; tone?: 'win' | 'loss' | 'draw' | 'neutral' | 'accent'; icon?: React.ReactNode }) => {
  const toneClass =
    tone === 'win' ? 'bg-green-500/10 text-green-700 dark:text-green-300' :
    tone === 'loss' ? 'bg-red-500/10 text-red-700 dark:text-red-300' :
    tone === 'draw' ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300' :
    tone === 'accent' ? 'bg-accent/15 text-accent' :
    'bg-muted text-foreground';
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold tabular-nums', toneClass)}>
      {icon}
      <span className="opacity-70 font-medium">{label}</span>
      <span>{value}</span>
    </span>
  );
};

function Scoreboard({ game }: { game: Game }) {
  const type = getEffectiveTrackingType(game);
  const stats = computeGameStats(game);

  if (type === 'score') {
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        <StatPill label="Best" value={stats.best !== undefined ? formatScoreValue(stats.best, game.scoreUnit) : '—'} tone="accent" icon={<Trophy className="h-3.5 w-3.5" />} />
        {stats.target ? <StatPill label="Ziel" value={formatScoreValue(stats.target, game.scoreUnit)} /> : null}
        <StatPill label="Versuche" value={stats.totalTries} />
      </div>
    );
  }

  if (type === 'completion') {
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        <StatPill label="Status" value={stats.completed ? 'Geschafft' : 'offen'} tone={stats.completed ? 'win' : 'neutral'} icon={stats.completed ? <Trophy className="h-3.5 w-3.5" /> : undefined} />
        {stats.totalTries > 0 ? <StatPill label="Versuche" value={stats.totalTries} /> : null}
      </div>
    );
  }

  // winLossDraw + attempts
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <StatPill label="S" value={stats.wins} tone="win" />
      <StatPill label="N" value={stats.losses} tone="loss" />
      {(game.allowDraw || stats.draws > 0) && <StatPill label="U" value={stats.draws} tone="draw" />}
      {type === 'attempts' && stats.attempts > 0 && <StatPill label="Versuche" value={stats.attempts} />}
      {game.backToBack ? (
        <StatPill label="Serie" value={`${stats.currentStreak}${stats.bestStreak ? ` (best ${stats.bestStreak})` : ''}`} tone="accent" icon={<Flame className="h-3.5 w-3.5" />} />
      ) : (
        stats.winRate !== undefined && <StatPill label="WR" value={`${Math.round(stats.winRate * 100)}%`} />
      )}
    </div>
  );
}

function EntryRow({ entry, onDelete, disabled }: { entry: GameLogEntry; onDelete?: () => void; disabled?: boolean }) {
  const tone = kindTone(entry.kind);
  const tc = toneClasses[tone];
  const hasNote = entry.note && entry.note !== entry.score;
  return (
    <li className={cn('group flex items-center gap-2 rounded-md border border-l-4 bg-background/80 px-2 py-1.5 text-sm', tc.border)}>
      <KindIcon kind={entry.kind} className={cn('h-4 w-4 shrink-0', tc.dot)} />
      <div className="min-w-0 flex-grow">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className={cn('font-medium', tc.text)}>
            {entry.kind === 'win' ? 'Sieg' : entry.kind === 'loss' ? 'Niederlage' : entry.kind === 'draw' ? 'Remis' : 'Versuch'}
          </span>
          {entry.score && <span className="font-semibold tabular-nums text-foreground">{entry.score}</span>}
        </div>
        {hasNote && <p className="truncate text-xs text-muted-foreground" title={entry.note}>{entry.note}</p>}
      </div>
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          disabled={disabled}
          className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive focus:opacity-100 group-hover:opacity-100 disabled:opacity-40"
          aria-label="Eintrag löschen"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </li>
  );
}

export function GameLog({ game, className, onDeleteEntry, disabled }: GameLogProps) {
  const entries = normalizeGameLog(game);
  const ordered = [...entries].reverse(); // newest first

  return (
    <div className={cn('space-y-2.5', className)}>
      <Scoreboard game={game} />
      {ordered.length > 0 ? (
        <details className="rounded-md border bg-muted/30 px-3 py-2 text-sm" open={ordered.length <= 6}>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 font-medium text-foreground">
            <span className="flex items-center gap-1.5"><History className="h-4 w-4 text-muted-foreground" /> Verlauf ({entries.length})</span>
            <Repeat className="h-3.5 w-3.5 text-muted-foreground" />
          </summary>
          <ul className="mt-3 space-y-1.5">
            {ordered.map((entry) => (
              <EntryRow
                key={entry.id}
                entry={entry}
                disabled={disabled}
                onDelete={onDeleteEntry ? () => onDeleteEntry(entry.id) : undefined}
              />
            ))}
          </ul>
        </details>
      ) : (
        <p className="text-xs text-muted-foreground">Noch nichts geloggt.</p>
      )}
    </div>
  );
}
