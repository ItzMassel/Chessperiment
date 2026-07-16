const baseUrl = "https://chessperiment.app";

export function generateBreadcrumbs(pathname: string) {
    const allSegments = pathname.split("/").filter(Boolean);
    // Skip locale segment if present
    const locales = ['en', 'de'];
    const segments = locales.includes(allSegments[0]) ? allSegments.slice(1) : allSegments;

    const items = [
        {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: baseUrl,
        },
    ];

    segments.forEach((segment, index) => {
        const name = segment.charAt(0).toUpperCase() + segment.slice(1).replace("-", " ");
        // Ensure itemUrl also skips/handles locale correctly if you want it to point to localized versions
        // Since we are in a localized layout, maybe we SHOULD include the locale in the URL
        const localePrefix = locales.includes(allSegments[0]) ? `/${allSegments[0]}` : '';
        const itemUrl = `${baseUrl}${localePrefix}/${segments.slice(0, index + 1).join("/")}`;
        
        items.push({
            "@type": "ListItem",
            position: index + 2,
            name,
            item: itemUrl,
        });
    });

    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items,
    };
}
