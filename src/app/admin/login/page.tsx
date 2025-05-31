
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { LogIn } from 'lucide-react';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(password);
    if (success) {
      toast({
        title: "Login Successful",
        description: "Welcome, Admin!",
        variant: "default",
      });
      router.push('/challenges/live'); // Redirect to live page or admin dashboard
    } else {
      toast({
        title: "Login Failed",
        description: "Incorrect password. Please try again.",
        variant: "destructive",
      });
      setPassword('');
    }
  };

  return (
    <div className="flex justify-center items-center py-12">
      <Card className="w-full max-w-sm shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <LogIn className="h-6 w-6 text-primary" />
            Admin Login
          </CardTitle>
          <CardDescription>Enter the admin password to access restricted areas.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="text-base py-2.5"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">
              Login
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
