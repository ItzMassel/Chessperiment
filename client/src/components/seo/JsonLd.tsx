export default function JsonLd() {
    const siteInfo = {
        name: "Chessperiment",
        url: "https://chessperiment.app",
        logo: "https://chessperiment.app/logo.png",
        description: "The ultimate platform for custom chess. Describe your idea — AI builds the variant for you. Create, share, and play unique chess variants.",
        contactEmail: "contact.chessperiment@gmail.com",
        socialLinks: [
            "https://github.com/ItzMassel/Chessperiment",
            "https://discord.gg/2XrGZw9PMP",
            "https://twitter.com/chessperiment",
            "https://instagram.com/chessperiment",
            "https://youtube.com/@chessperiment"
        ]
    };

    const jsonLd =
    {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "WebSite",
                "@id": `${siteInfo.url}/#website`,
                "url": `${siteInfo.url}/`,
                "name": siteInfo.name,
                "description": siteInfo.description,
                "inLanguage": [
                    "en",
                    "de"
                ],
                "publisher": {
                    "@id": `${siteInfo.url}/#organization`
                }
            },
            {
                "@type": "Organization",
                "@id": `${siteInfo.url}/#organization`,
                "name": siteInfo.name,
                "url": `${siteInfo.url}/`,
                "logo": {
                    "@type": "ImageObject",
                    "url": siteInfo.logo
                },
                "sameAs": siteInfo.socialLinks
            },
            {
                "@type": "WebApplication",
                "@id": `${siteInfo.url}/#app`,
                "name": siteInfo.name,
                "url": `${siteInfo.url}/`,
                "applicationCategory": [
                    "GameApplication",
                    "DesignApplication"
                ],
                "operatingSystem": [
                    "Web",
                    "iOS",
                    "Android"
                ],
                "browserRequirements": "Requires modern browser with JavaScript enabled",
                "isAccessibleForFree": true,
                "offers": {
                    "@type": "Offer",
                    "price": "0",
                    "priceCurrency": "EUR"
                },
                "creator": {
                    "@id": `${siteInfo.url}/#organization`
                },
                "description": "Chessperiment is a creation-first game platform. Describe any game idea and the AI builds the variant for you — boards, pieces, and rules — instantly. Then fine-tune it yourself, play it, and share it with others.",
                "audience": {
                    "@type": "Audience",
                    "audienceType": "All ages"
                },
                "featureList": [
                    "AI variant generation — describe a game idea, AI builds it instantly",
                    "Custom board creation",
                    "Custom piece design",
                    "Rule and game mode creation",
                    "Playable user-created games",
                    "Optional account system",
                    "Device-synchronized statistics",
                    "Public visibility of creations",
                    "Marketplace for digital items",
                    "Social sharing and discovery"
                ],
                "interactionStatistic": [
                    {
                        "@type": "InteractionCounter",
                        "interactionType": "https://schema.org/CreateAction",
                        "userInteractionCount": 0
                    },
                    {
                        "@type": "InteractionCounter",
                        "interactionType": "https://schema.org/PlayAction",
                        "userInteractionCount": 0
                    },
                    {
                        "@type": "InteractionCounter",
                        "interactionType": "https://schema.org/ShareAction",
                        "userInteractionCount": 0
                    }
                ]
            },
            {
                "@type": "VideoGame",
                "@id": `${siteInfo.url}/#game`,
                "name": siteInfo.name,
                "gamePlatform": [
                    "Web",
                    "iOS",
                    "Android"
                ],
                "genre": [
                    "Strategy",
                    "Creative",
                    "Sandbox"
                ],
                "playMode": [
                    "SinglePlayer",
                    "Multiplayer"
                ],
                "description": "A strategy sandbox game where players create, customize, and play original board games.",
                "creator": {
                    "@id": `${siteInfo.url}/#organization`
                }
            },
            {
                "@type": "CreativeWork",
                "@id": `${siteInfo.url}/#ugc`,
                "name": "User Created Games and Boards",
                "description": "Publicly visible custom boards, pieces, and games created by users.",
                "creator": {
                    "@type": "Audience",
                    "audienceType": "Users"
                },
                "isAccessibleForFree": true
            }
        ]
    }
    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
                __html: JSON.stringify(jsonLd)
            }}
        />
    );
}
