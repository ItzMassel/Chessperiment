
import type { Metadata } from 'next';
import { generateHreflangs } from '@/lib/hreflang';

const hreflangs = generateHreflangs('/game', ['de', 'en'], 'en', 'https://chessperiment.app');

export const metadata: Metadata = {
    title: 'chessperiment User Profiles',
    description: 'View and manage chessperiment user profiles.',
    openGraph: {
        title: 'chessperiment User Profiles',
        description: 'View and manage chessperiment user profiles.',
        url: 'https://chessperiment.app/en/profile',
        siteName: 'chessperiment',
        images: ['/images/seo/og-home.png'],
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'chessperiment User Profiles',
        description: 'View and manage chessperiment user profiles.',
        images: ['/images/seo/og-home.png'],
    },
    alternates: {
        canonical: "https://chessperiment.app/en/profile", // absolute URL
        languages: hreflangs.reduce((acc, tag) => {
            acc[tag.hrefLang] = tag.href;
            return acc;
        }, {} as Record<string, string>),
    },
};

export default function ProfileLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            {children}
        </>
    );
}
