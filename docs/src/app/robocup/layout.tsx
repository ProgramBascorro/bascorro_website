import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { BreadcrumbSchema } from '@/components/seo/StructuredData';

const BASE_URL =
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bascorro.undip.ac.id';

export const metadata: Metadata = {
    title: 'Competitions | EWS BASCORRO',
    description:
        'Explore EWS BASCORRO competition targets: RoboCup Humanoid League and KRI KRSBI-Humanoid. Learn about size classes, research focus, and our 2026 goals.',
    keywords: [
        'Competitions',
        'RoboCup',
        'KRI',
        'KRSBI-Humanoid',
        'Humanoid League',
        'Robot Soccer',
        'Autonomous Robots',
        'BASCORRO',
        'Robotics Competition',
        'KidSize',
        'AdultSize',
        '2026 Target',
    ],
    openGraph: {
        type: 'website',
        title: 'Competitions | EWS BASCORRO Robotics',
        description:
            'Discover RoboCup Humanoid League and KRI KRSBI-Humanoid. See our 2026 targets and competition focus.',
        url: `${BASE_URL}/competitions`,
        images: [
            {
                url: '/Logo_Bascorro.png',
                width: 512,
                height: 512,
                alt: 'EWS BASCORRO Competitions',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Competitions | EWS BASCORRO Robotics',
        description:
            'Discover RoboCup Humanoid League and KRI KRSBI-Humanoid. See our 2026 targets and competition focus.',
        images: ['/Logo_Bascorro.png'],
    },
    alternates: {
        canonical: `${BASE_URL}/competitions`,
    },
};

export default function RoboCupLayout({ children }: { children: ReactNode }) {
    return (
        <>
            <BreadcrumbSchema
                items={[
                    { name: 'Home', url: BASE_URL },
                    { name: 'Competitions', url: `${BASE_URL}/competitions` },
                ]}
            />
            {children}
        </>
    );
}
