"use client";

import { HeartPulse } from 'lucide-react';
import { PulsoidOAuthPanel } from '@/components/live/PulsoidOAuthPanel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function PulsoidConnectPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <HeartPulse className="h-6 w-6 text-destructive" />
            Pulsoid verbinden
          </CardTitle>
          <CardDescription>
            Verbinde deinen Pulsoid-Account per OAuth2. Danach kann die Bruch Challenge deine Herzfrequenz über den konfigurierten Pulsoid-Endpoint laden.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PulsoidOAuthPanel />
        </CardContent>
      </Card>
    </div>
  );
}
