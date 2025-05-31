
import type { FC } from 'react';
import { notFound } from 'next/navigation';
import { getDataChallenges, getDataChallengeById } from '@/lib/data';
import type { Challenge } from '@/types';
import ChallengeDetailsClient from '@/components/ChallengeDetailsClient';
// Removed unused Lucide icons here as they are used in ChallengeDetailsClient

// Make generateStaticParams synchronous
export function generateStaticParams(): { id: string }[] {
  const challenges = getDataChallenges();
  return challenges.map((challenge) => ({
    id: challenge.id,
  }));
}

interface ChallengeDetailsPageProps {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined }; // Include searchParams
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
