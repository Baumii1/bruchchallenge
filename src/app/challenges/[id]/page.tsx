
import { notFound } from 'next/navigation';
import { getDataChallenges, getDataChallengeById } from '@/lib/data';
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
  params: Promise<{ id: string }>;
}

const ChallengeDetailsPage = async ({ params }: ChallengeDetailsPageProps) => {
  const resolvedParams = await params;
  
  const challengeId = resolvedParams.id;
  const initialChallenge = getDataChallengeById(challengeId);

  if (!initialChallenge) {
    notFound();
  }

  return <ChallengeDetailsClient initialChallenge={initialChallenge} />;
}

export default ChallengeDetailsPage;
