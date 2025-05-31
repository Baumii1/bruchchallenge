
// This is now a Server Component - "use client" directive removed.

import { notFound } from 'next/navigation';
import { getDataChallenges, getDataChallengeById } from '@/lib/data'; // For generateStaticParams and direct data fetching
import type { Challenge } from '@/types';
import ChallengeDetailsClient from '@/components/ChallengeDetailsClient';
import { NotepadText, Users, ListChecks, Hourglass, Clock, CalendarDays, Zap, Trash2, Loader2, AlertTriangle, Gamepad2, Info } from 'lucide-react';

// Function to generate static paths for all challenges
export async function generateStaticParams() {
  const challenges = getDataChallenges(); // Fetch all challenges
  return challenges.map((challenge) => ({
    id: challenge.id,
  }));
}

// Removed async keyword from the page component
export default function ChallengeDetailsPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // Fetch data on the server
  const challengeId = params.id;
  // Call getDataChallengeById directly (it's synchronous)
  const initialChallenge = getDataChallengeById(challengeId);

  if (!initialChallenge) {
    notFound(); // If challenge not found, trigger 404
  }

  // Render the Client Component, passing the fetched data as a prop
  return <ChallengeDetailsClient initialChallenge={initialChallenge} />;
}
