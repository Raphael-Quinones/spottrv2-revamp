import type { Metadata } from 'next';
import { Inter, Space_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/providers/theme-provider';
import { AutumnProvider } from '@/lib/autumn/provider';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-space-mono',
});

export const metadata: Metadata = {
  title: 'Spottr - AI-Powered Video Analysis',
  description: 'Find anything in your videos with AI-powered analysis',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceMono.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-bg text-fg font-sans antialiased">
        <ThemeProvider>
          <AutumnProvider>
            {children}
            <Toaster />
          </AutumnProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}