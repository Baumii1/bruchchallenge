
import type {Metadata} from 'next';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from '@/context/AuthContext'; // Import AuthProvider

export const metadata: Metadata = {
  title: 'Bruch Challenge Hub',
  description: 'Track and participate in Bruch Challenges!',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased flex flex-col min-h-screen bg-background text-foreground">
        <AuthProvider> {/* Wrap ThemeProvider (and thus everything else) with AuthProvider */}
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Header />
            <main className="flex-grow container py-8"> 
              {children}
            </main>
            <Footer />
            <Toaster />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
