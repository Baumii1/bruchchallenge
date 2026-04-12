"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, LogIn, ShieldAlert } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, authEnabled, authError } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const success = await login(email, password);

    if (success) {
      toast({
        title: 'Login successful',
        description: 'Admin session aktiv.',
        variant: 'default',
      });
      router.push('/challenges/live');
    } else {
      toast({
        title: 'Login failed',
        description: authError ?? 'Bitte prüfe E-Mail, Passwort und Admin-Freigabe.',
        variant: 'destructive',
      });
      setPassword('');
    }

    setIsSubmitting(false);
  };

  return (
    <div className="flex justify-center items-center py-12">
      <Card className="w-full max-w-sm shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <LogIn className="h-6 w-6 text-primary" />
            Admin Login
          </CardTitle>
          <CardDescription>
            Melde dich mit einem in Firebase freigeschalteten Admin-Konto an.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {!authEnabled && (
              <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-200">
                <div className="flex items-start gap-2">
                  <ShieldAlert className="h-4 w-4 mt-0.5" />
                  <span>Firebase Auth ist noch nicht konfiguriert. Trage zuerst die Variablen aus .env.example ein.</span>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="text-base py-2.5"
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="text-base py-2.5"
                autoComplete="current-password"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={!authEnabled || isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Login'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
