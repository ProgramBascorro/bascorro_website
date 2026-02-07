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

// Determine the base URL for metadata
// Priority: NEXT_PUBLIC_SITE_URL > VERCEL_PROJECT_PRODUCTION_URL > VERCEL_URL > production default
const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  // VERCEL_PROJECT_PRODUCTION_URL is the production domain (set automatically by Vercel)
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  // VERCEL_URL is the deployment URL (preview or production)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  // Fallback to production domain
  return 'https://bascorro.com';
};

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
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
  icons: {
    icon: [{ url: '/Bascorro.png', type: 'image/png' }],
    shortcut: [{ url: '/Bascorro.png', type: 'image/png' }],
    apple: [{ url: '/Bascorro.png', type: 'image/png' }],
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
