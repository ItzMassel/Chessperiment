import Btn from "./Buttons"
import { getTranslations } from 'next-intl/server';
import { HelpArticlesAll } from "@/components/help/HelpArticles";
import { auth } from "@/auth";
import LandingPage from "@/components/landing/LandingPage";

const siteUrl = "https://chessperiment.app";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'SEO.Home' });

  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: `${siteUrl}/${locale}`,
      languages: {
        'en': `${siteUrl}/en`,
        'de': `${siteUrl}/de`
      },
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: `${siteUrl}/${locale}`,
      type: "website",
      images: [
        {
          url: "/images/seo/og-home.png",
          width: 1200,
          height: 630,
          type: "image/png"
        }
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t('title'),
      description: t('description'),
      images: ["/images/seo/twitter-image.png"],
    },
  };
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await auth();
  const t = await getTranslations({ locale, namespace: 'SEO.Home' });

  if (!session) {
    return <LandingPage />;
  }

  const jsonLd_home = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/${locale}/#website`,
        "url": `${siteUrl}/${locale}`,
        "name": "Chessperiment",
        "description": t('description'),
        "inLanguage": locale
      },
      {
        "@type": "Organization",
        "@id": `${siteUrl}/${locale}/#organization`,
        "name": "Chessperiment",
        "url": `${siteUrl}/${locale}`,
        "logo": {
          "@type": "ImageObject",
          "url": `${siteUrl}/icon.png`
        },
        "sameAs": []
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${siteUrl}/#software`,
        "name": "Chessperiment",
        "url": siteUrl,
        "applicationCategory": "GameApplication",
        "applicationSubCategory": "Board Game Design Tool",
        "operatingSystem": "Web Browser",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "EUR"
        },
        "description": "Free browser-based game design engine for creating custom chess variants and abstract strategy games. Not presets — actual customizability. Design pieces with a visual Scratch-style logic editor — define leapers, riders, and fairy pieces with conditional triggers. Create hexagonal boards, custom-shaped playing fields, and per-square rule overrides. Playtest instantly via multiplayer room codes. Powered by Stockfish engine analysis.",
        "featureList": [
          "Visual block-based piece logic editor — no coding required",
          "Leaper and rider movement definition",
          "Conditional trigger and state-based piece behaviour",
          "Hexagonal board support",
          "Custom board shapes via per-square active/inactive toggles",
          "Square-level rule overrides",
          "Stockfish integration for arbitrary rule sets",
          "Browser-based multiplayer via room codes",
          "Community Marketplace for sharing and downloading variants",
          "Free to use — no paywall"
        ],
        "screenshot": `${siteUrl}/images/seo/og-home.png`
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd_home).replace(/</g, '\\u003c') }}
      />
      {/* Hidden H1 for SEO */}
      <h1 className="sr-only">{t('h1')}</h1>
      <p className="sr-only">{t('p')}</p>

      <Btn />

      <HelpArticlesAll />
    </>
  );
}
