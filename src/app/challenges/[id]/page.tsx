
import type { FC } from 'react';
import { notFound } from 'next/navigation';
import { getDataChallenges, getDataChallengeById } from '@/lib/data';
import type { Challenge } from '@/types';
import ChallengeDetailsClient from '@/components/ChallengeDetailsClient';
import { NotepadText, Users, ListChecks, Hourglass, Clock, CalendarDays, Zap, Trash2, Loader2, AlertTriangle, Gamepad2, Info } from 'lucide-react';

export async function generateStaticParams(): Promise<{ id: string }[]> {
  const challenges = getDataChallenges();
  return challenges.map((challenge) => ({
    id: challenge.id,
  }));
}

interface ChallengeDetailsPageProps {
  params: { id: string };
  // searchParams: { [key: string]: string | string[] | undefined }; // We are not using searchParams here for now
}

const ChallengeDetailsPage: FC<ChallengeDetailsPageProps> = ({ params }) => {
  const challengeId = params.id;
  const initialChallenge = getDataChallengeById(challengeId);

  if (!initialChallenge) {
    notFound();
  }

  return <ChallengeDetailsClient initialChallenge={initialChallenge} />;
}

export default ChallengeDetailsPage;
