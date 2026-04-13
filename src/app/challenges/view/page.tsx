import { Suspense } from 'react';
import ChallengeDetailsViewClient from './view-client';

function LoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
      <span className="text-lg">Loading challenge details...</span>
    </div>
  );
}

export default function ChallengeDetailsViewPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ChallengeDetailsViewClient />
    </Suspense>
  );
}
