"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { GameIconFactory } from '@/components/icons/GameIconFactory';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, ClipboardList, DatabaseBackup, HeartPulse, Loader2, Menu, PlusCircle, RadioTower, ShieldCheck } from 'lucide-react';

const publicLinks = [
  { href: '/', label: 'Home' },
  { href: '/challenges/live', label: 'Live' },
];

const adminLinks = [
  { href: '/admin/create-challenge', label: 'Challenge erstellen', icon: PlusCircle },
  { href: '/admin/live-results', label: 'Live Results', icon: ClipboardList },
  { href: '/admin/backup', label: 'Backup & Repair', icon: DatabaseBackup },
  { href: '/admin/hyperate', label: 'HypeRate-Links', icon: HeartPulse },
  { href: '/admin/pulse-control', label: 'Pulse Control', icon: RadioTower },
];

export function Header() {
  const { isAdmin, logout, adminEmail, isAuthReady } = useAuth();
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin') && pathname !== '/admin/login';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 mr-4">
          <GameIconFactory iconName="trophy" className="h-7 w-7 sm:h-8 sm:w-8 text-primary transition-transform hover:scale-110" />
          <span className="text-lg sm:text-xl font-bold tracking-tight whitespace-nowrap">Bruch Challenge Hub</span>
        </Link>
        <div className="flex items-center gap-2">
          <nav className="hidden sm:flex items-center gap-1">
            {publicLinks.map((link) => (
              <Button
                key={link.href}
                variant="ghost"
                asChild
                className={cn(
                  'text-muted-foreground hover:text-foreground',
                  pathname === link.href && 'text-foreground bg-muted'
                )}
              >
                <Link href={link.href}>{link.label}</Link>
              </Button>
            ))}
            {isAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      'text-muted-foreground hover:text-foreground gap-1',
                      isAdminRoute && 'text-foreground bg-muted'
                    )}
                  >
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    Admin
                    <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="text-xs text-muted-foreground">Admin-Werkzeuge</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {adminLinks.map((link) => (
                    <DropdownMenuItem key={link.href} asChild>
                      <Link href={link.href} className={cn('flex items-center gap-2 w-full', pathname === link.href && 'bg-muted')}>
                        <link.icon className="h-4 w-4 text-primary" />
                        {link.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </nav>
          <Separator orientation="vertical" className="h-6 hidden sm:block mx-2" />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="sm:hidden" aria-label="Menü öffnen">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-2">
                {publicLinks.map((link) => (
                  <Button
                    key={link.href}
                    variant={pathname === link.href ? 'default' : 'ghost'}
                    asChild
                    className="justify-start"
                  >
                    <Link href={link.href}>{link.label}</Link>
                  </Button>
                ))}
                {isAdmin && (
                  <>
                    <Separator className="my-2" />
                    <p className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Admin
                    </p>
                    {adminLinks.map((link) => (
                      <Button
                        key={link.href}
                        variant={pathname === link.href ? 'default' : 'ghost'}
                        asChild
                        className="justify-start"
                      >
                        <Link href={link.href}>
                          <link.icon className="mr-2 h-4 w-4" />
                          {link.label}
                        </Link>
                      </Button>
                    ))}
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
          <ThemeToggle />
          {isAuthReady ? (
            isAdmin ? (
              <div className="ml-2 flex items-center gap-2">
                {adminEmail && <span className="hidden md:inline text-xs text-muted-foreground">{adminEmail}</span>}
                <Button variant="outline" size="sm" onClick={() => void logout()}>
                  Logout
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" asChild className="ml-2">
                <Link href="/admin/login">Login</Link>
              </Button>
            )
          ) : (
            <Button variant="outline" size="sm" className="ml-2" disabled>
              <Loader2 className="h-4 w-4 animate-spin" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
