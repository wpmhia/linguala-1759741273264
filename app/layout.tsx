import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { SessionProvider } from '@/components/providers/session-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Linguala - Advanced AI Translation Platform',
  description: 'Professional translation platform with domain expertise, custom glossaries, and intelligent AI powered by Qwen. Translate with precision at Linguala.eu',
  keywords: 'translation, AI, professional, linguala, domain translation, glossary, languages',
  authors: [{ name: 'Linguala Team' }],
  creator: 'Linguala',
  publisher: 'Linguala',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://linguala.eu',
    title: 'Linguala - Advanced AI Translation Platform',
    description: 'Professional translation platform with domain expertise and custom glossaries',
    siteName: 'Linguala',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Linguala - Advanced AI Translation Platform',
    description: 'Professional translation platform with domain expertise and custom glossaries',
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
        <SessionProvider>
          {children}
        </SessionProvider>
        <Toaster />
        {/* TODO: Remove iframe-navigation.js in production, should never be removed by AI */}
        <script src="/scripts/iframe-navigation.js"></script>
      </body>
    </html>
  );
}
