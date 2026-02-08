import { RootProvider } from 'fumadocs-ui/provider/next';
import './global.css';
import { Inter, Space_Grotesk, Cinzel } from 'next/font/google';
import type { Metadata } from 'next';
import {
  OrganizationSchema,
  WebSiteSchema,
} from '@/components/seo/StructuredData';
import { getSiteUrl } from '@/lib/site-url';

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
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: 'EWS BASCORRO Robotics',
    template: '%s | EWS BASCORRO Robotics',
  },
  description: 'EWS BASCORRO Humanoid Robosoccer Team documentation.',
  openGraph: {
    type: 'website',
    siteName: 'EWS BASCORRO Robotics',
    title: 'EWS BASCORRO Robotics',
    description: 'EWS BASCORRO Humanoid Robosoccer Team documentation.',
    images: [
      {
        url: '/Logo_Bascorro.png',
        width: 512,
        height: 512,
        alt: 'EWS BASCORRO',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EWS BASCORRO Robotics',
    description: 'EWS BASCORRO Humanoid Robosoccer Team documentation.',
    images: ['/Logo_Bascorro.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
    },
  },
  icons: {
    shortcut: [{ url: '/favicon.ico', type: 'image/x-icon' }],
    icon: [{ url: '/Bascorro.png', type: 'image/png' }],
    apple: [{ url: '/apple-touch-icon.png', type: 'image/png' }],
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
