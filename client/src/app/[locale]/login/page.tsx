import LoginPage from "./LoginPage"
import { bungee } from "@/lib/fonts";
import type { Metadata } from "next";
import { generateHreflangs } from '@/lib/hreflang';
import { getTranslations } from 'next-intl/server';
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'SEO.Login' });
    const hreflangs = generateHreflangs('/login', ['de', 'en'], 'en', 'https://chessperiment.app');

    return {
        title: t('title'),
        description: t('description'),
        alternates: {
            canonical: "https://chessperiment.app/en/login",
            languages: hreflangs.reduce((acc, tag) => {
                acc[tag.hrefLang] = tag.href;
                return acc;
            }, {} as Record<string, string>),
        },
        openGraph: {
            title: t('title'),
            description: t('description'),
            url: 'https://chessperiment.app/en/login',
            siteName: 'chessperiment',
            images: ['/images/seo/og-home.png'],
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: t('title'),
            description: t('description'),
            images: ['/images/seo/og-home.png'],
        },
        robots: {
            index: false,
            follow: true,
        },
    };
}

export default async function LoginPageServerSide({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;

    const session = await auth();
    if (session) {
        redirect(`/${locale}`);
    }

    const t = await getTranslations({ locale, namespace: 'SEO.Login' });

    return (
        <>
            <h1 className="sr-only">{t('h1')}</h1>
            <LoginPage bungee={bungee.className} />
        </>
    );
}