
"use client"; // Make this a client component to use useAuth

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { GameIconFactory } from '@/components/icons/GameIconFactory';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/AuthContext'; // Import useAuth

export function Header() {
  const { isAdmin, logout } = useAuth(); // Get isAdmin status and logout function

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 mr-4"> 
          <GameIconFactory iconName="trophy" className="h-7 w-7 sm:h-8 sm:w-8 text-primary transition-transform hover:scale-110" />
          <span className="text-lg sm:text-xl font-bold tracking-tight whitespace-nowrap">Bruch Challenge Hub</span>
        </Link>
        <div className="flex items-center gap-2">
          <nav className="hidden sm:flex items-center gap-1">
            <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground">
              <Link href="/">Home</Link>
            </Button>
            <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground">
              <Link href="/challenges/live">Live</Link>
            </Button>
            {isAdmin && ( // Conditionally render Create link
              <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground">
                <Link href="/admin/create-challenge">Create</Link>
              </Button>
            )}
          </nav>
          <Separator orientation="vertical" className="h-6 hidden sm:block mx-2"/>
          <ThemeToggle />
          {isAdmin ? (
            <Button variant="outline" size="sm" onClick={logout} className="ml-2">
              Logout
            </Button>
          ) : (
            <Button variant="outline" size="sm" asChild className="ml-2">
              <Link href="/admin/login">Login</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
