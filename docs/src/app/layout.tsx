import { RootProvider } from 'fumadocs-ui/provider/next';
import './global.css';
import { Inter, Space_Grotesk, Cinzel } from 'next/font/google';
import type { Metadata } from 'next';
import {
  OrganizationSchema,
  WebSiteSchema,
} from '@/components/seo/StructuredData';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '700'],
});

const cinzel = Cinzel({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: ['400', '700'],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  ),
  title: {
    default: 'BASCORRO',
    template: '%s | BASCORRO',
  },
  description: 'BASCORRO Humanoid Robosoccer Team documentation.',
  openGraph: {
    type: 'website',
    siteName: 'BASCORRO',
    title: 'BASCORRO',
    description: 'BASCORRO Humanoid Robosoccer Team documentation.',
    images: [
      {
        url: '/Banner.png',
        width: 1536,
        height: 1024,
        alt: 'BASCORRO',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BASCORRO',
    description: 'BASCORRO Humanoid Robosoccer Team documentation.',
    images: ['/Banner.png'],
  },
  icons: {
    icon: [{ url: '/favicon1.png', type: 'image/png' }],
    apple: [{ url: '/favicon1.png', type: 'image/png' }],
  },
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} ${cinzel.variable}`}
      suppressHydrationWarning
    >
      <head>
        <OrganizationSchema />
        <WebSiteSchema />
      </head>
      <body className="flex flex-col min-h-screen font-sans">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
