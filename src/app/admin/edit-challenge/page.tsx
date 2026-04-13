import { Suspense } from 'react';
import EditChallengeClientPage from './edit-client';

function LoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
      <span className="text-lg">Challenge editor wird geladen...</span>
    </div>
  );
}

export default function EditChallengePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <EditChallengeClientPage />
    </Suspense>
  );
}
