
// This is now a Server Component - "use client" directive removed.

import { notFound } from 'next/navigation';
import { getDataChallenges } from '@/lib/data'; // For generateStaticParams
import { fetchChallengeDetailsAction } from '@/app/actions'; // Server Action
import type { Challenge } from '@/types';
import ChallengeDetailsClient from '@/components/ChallengeDetailsClient'; // New Client Component

// Function to generate static paths for all challenges
export async function generateStaticParams() {
  const challenges = getDataChallenges(); // Fetch all challenges
  return challenges.map((challenge) => ({
    id: challenge.id,
  }));
}

// Removed ChallengeDetailsPageProps interface

export default async function ChallengeDetailsPage({
  params,
  searchParams, // Added for completeness, though not used in this component
}: {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // Fetch data on the server
  const challengeId = params.id;
  const initialChallenge = await fetchChallengeDetailsAction(challengeId);

  if (!initialChallenge) {
    notFound(); // If challenge not found, trigger 404
  }

  // Render the Client Component, passing the fetched data as a prop
  return <ChallengeDetailsClient initialChallenge={initialChallenge} />;
}
