import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Linguala - European AI Translation Platform',
  description: 'The European translation platform built for European languages and culture. Professional domain expertise, custom glossaries, and intelligent AI. Based in Europe, for Europe.',
  keywords: 'european translation, EU languages, european translator, linguala, multilingual europe, professional translation, domain expertise',
  authors: [{ name: 'Linguala Europe' }],
  creator: 'Linguala',
  publisher: 'Linguala Europe',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_EU',
    url: 'https://linguala.eu',
    title: 'Linguala - European AI Translation Platform',
    description: 'The European translation platform built for European languages and culture',
    siteName: 'Linguala',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Linguala - European AI Translation Platform',
    description: 'European translation platform built for European languages and culture',
    creator: '@linguala',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#3B82F6',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster />
        {/* TODO: Remove iframe-navigation.js in production, should never be removed by AI */}
        <script src="/scripts/iframe-navigation.js"></script>
      </body>
    </html>
  );
}
