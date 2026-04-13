"use client";

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { completePulsoidOAuthCallback } from '@/lib/pulse';

export default function PulsoidCallbackPage() {
  const [message, setMessage] = useState('Pulsoid connection is being completed...');

  useEffect(() => {
    const result = completePulsoidOAuthCallback(window.location.hash);
    setMessage(result.message);

    window.setTimeout(() => {
      window.location.replace('/challenges/live');
    }, result.ok ? 800 : 1800);
  }, []);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center text-muted-foreground">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <div>
        <p className="text-lg font-medium text-foreground">Pulsoid OAuth Callback</p>
        <p className="mt-2 text-sm">{message}</p>
      </div>
    </div>
  );
}
