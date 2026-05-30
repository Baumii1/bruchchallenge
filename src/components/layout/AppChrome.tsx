"use client";

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

interface AppChromeProps {
  children: ReactNode;
}

const OBS_ROUTE_PREFIXES = ['/obs'];

export function AppChrome({ children }: AppChromeProps) {
  const pathname = usePathname() ?? '';
  const isObsRoute = OBS_ROUTE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  if (isObsRoute) {
    return (
      <main className="min-h-screen bg-transparent p-0">
        {children}
      </main>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-grow container py-8">{children}</main>
      <Footer />
    </>
  );
}
