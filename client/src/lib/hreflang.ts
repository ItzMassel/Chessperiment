// utils/hreflang.ts
export type Locale = 'de' | 'en'; // weitere Sprachen hier ergänzen

interface HreflangEntry {
    rel: 'alternate';
    hrefLang: string;
    href: string;
}

/**
 * Generiert hreflang-Tags für eine Seite.
 * @param path relative URL ohne /[locale], z.B. "/game" oder "/editor/board"
 * @param locales Array aller unterstützten Sprachen
 * @param defaultLocale Default-Locale für x-default
 * @param baseUrl Basis-URL, z.B. https://chessperiment.app
 */
export function generateHreflangs(
    path: string,
    locales: Locale[],
    defaultLocale: Locale,
    baseUrl: string
): HreflangEntry[] {
    const tags: HreflangEntry[] = [];

    locales.forEach((locale) => {
        tags.push({
            rel: 'alternate',
            hrefLang: locale,
            href: `${baseUrl}/${locale}${path}`,
        });
    });

    // x-default
    tags.push({
        rel: 'alternate',
        hrefLang: 'x-default',
        href: `${baseUrl}/${defaultLocale}${path}`,
    });

    return tags;
}
