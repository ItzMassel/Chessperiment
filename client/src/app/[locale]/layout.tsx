import type { Metadata, Viewport } from "next";
import "@/app/globals.css"
import { lexend } from "@/lib/fonts";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { HeaderWrapper } from "@/components/HeaderWrapper";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SessionWrapper } from "@/components/auth/SessionWrapper";
import { UserPanel } from "@/components/auth/UserPanel";
import { generateBreadcrumbs } from "@/lib/breadcrumbs";
import { headers } from "next/headers";
import { Providers } from "../providers";
import { SEOFooter } from "@/components/SEOFooter";
import { ReferralSurvey } from "@/components/ReferralSurvey";
import { WarningSplashModal } from "@/components/WarningSplashModal";
import Script from "next/script";
import { AuthProvider } from "@/context/AuthContext";
import { BotIdClient } from "botid/client";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// Local font is now defined in @/lib/fonts

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0a09" },
  ],
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;

  // UPDATED: Use your new domain here
  const siteUrl = "https://chessperiment.app";
  const localeUrl = `${siteUrl}/${locale}`;

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: "Chessperiment | Custom Chess Logic Sandbox",
      template: "%s | Chessperiment",
    },
    description: "The most powerful sandbox for chess variants. Define custom piece logic, design irregular boards, and play online.",
    keywords: [
      "chessperiment", "chess variants", "chess logic engine", "custom chess pieces",
      "board game sandbox", "non-grid chess", "chess rules creator"
    ],
    authors: [{ name: "Lasse Thoroe" }],
    creator: "Lasse Thoroe",
    publisher: "Chessperiment",
    robots: "index, follow",

    // --- LLMS IMPLEMENTATION START ---
    icons: {
      icon: "/icon.png",
      shortcut: "/favicon.ico",
      apple: "/apple-icon.png",
      other: {
        rel: "llms",
        url: "/llms.txt",
      },
    },
    // --- LLMS IMPLEMENTATION END ---

    openGraph: {
      type: "website",
      locale: locale === "de" ? "de_DE" : "en_US",
      url: localeUrl,
      siteName: "Chessperiment",
      title: "Chessperiment | Custom Chess Logic Sandbox",
      description: "Design custom chess pieces, create unique boards, and play chess variants with friends.",
      images: [
        {
          url: "/images/seo/og-home.png",
          width: 1200,
          height: 630,
          alt: "Chessperiment - Custom Chess Platform",
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Chessperiment | Custom Chess Sandbox",
      description: "Create your own chess world. Design pieces, boards and play online.",
      images: ["/images/seo/twitter-image.png"],
    },
    // Note: individual pages should override canonical with their full URL.
    // This layout-level fallback points to the locale root.
    alternates: {
      canonical: localeUrl,
      languages: {
        "en": `${siteUrl}/en`,
        "de": `${siteUrl}/de`,
        "x-default": `${siteUrl}/en`,
      },
    },
  };
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  const messages = await getMessages();
  const headersList = await headers();
  const requestUrl = headersList.get("x-invoke-path") || "/";
  const pathname = requestUrl.startsWith("/") ? requestUrl : new URL(requestUrl, "http://example.com").pathname;

  return (
    <html
      lang={locale}
      className={`${lexend.className}`}
      suppressHydrationWarning={true}
    >
      <head>
        <Script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(generateBreadcrumbs(pathname)) }}
        />
        <Script
          defer
          src="https://api.kiprotect.com/v1/privacy-managers/0f7e53d052356593f21b86221d9b4966/klaro.js"
          strategy="afterInteractive"
        />
      </head>
      <body className="bg-bg transition-colors duration-300 dark:bg-stone-950 min-h-screen flex flex-col">
        {/* BotID Protection for API routes */}
        <BotIdClient protect={[{ path: '/api/auth/*', method: 'POST' }]} />

        <SessionWrapper>
          <NextIntlClientProvider messages={messages}>
            <AuthProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
              >
                <Providers>

                  <UserPanel />
                  <ThemeToggle />
                  <ReferralSurvey />
                  <WarningSplashModal />
                  <HeaderWrapper />
                  {children}
                  <SEOFooter />
                </Providers>
              </ThemeProvider>
            </AuthProvider>
          </NextIntlClientProvider>
        </SessionWrapper>
      </body>
    </html>
  );
}
