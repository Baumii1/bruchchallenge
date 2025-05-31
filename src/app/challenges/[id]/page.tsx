
import { notFound } from 'next/navigation';
import { getDataChallenges, getDataChallengeById } from '@/lib/data';
import type { Challenge } from '@/types';
import ChallengeDetailsClient from '@/components/ChallengeDetailsClient';
import type { ReactElement } from 'react';

// Ensure generateStaticParams is synchronous and returns the correct shape.
export function generateStaticParams(): Array<{ id: string }> {
  const challenges = getDataChallenges();
  return challenges.map((challenge) => ({
    id: challenge.id,
  }));
}

// Define props for the page component explicitly.
// Including searchParams as it's part of the standard PageProps structure,
// even if not directly used by this component's logic.
interface ChallengeDetailsPageProps {
  params: { id: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

// Define the page component as a default exported function
// with explicit prop types and an explicit return type.
export default function ChallengeDetailsPage({ params }: ChallengeDetailsPageProps): ReactElement {
  const challengeId = params.id;
  // Fetch data synchronously for static generation.
  const initialChallenge = getDataChallengeById(challengeId);

  if (!initialChallenge) {
    notFound(); // Trigger 404 if challenge data isn't found.
  }

  // Render the client component, passing the fetched data.
  return <ChallengeDetailsClient initialChallenge={initialChallenge} />;
}
