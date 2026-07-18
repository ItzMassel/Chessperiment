import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://chessperiment.app';
  const locales = ['en', 'de'];
  
  // List of known static routes (public, indexable pages only)
  const routes = [
    '',
    '/marketplace',
    '/game',
    '/announcements',
    '/editor',
    '/features',
    '/features/analyze',
    '/legal-notice',
    '/privacy-policy',
    '/about',
    '/compare',
    '/feedback',
  ];

  return routes.flatMap((route) => 
    locales.map((locale) => ({
      url: `${baseUrl}/${locale}${route}`,
      lastModified: new Date(),
      changeFrequency: (route === '' ? 'daily' : 'weekly') as any,
      priority: route === '' ? 1 : 0.8,
      alternates: {
        languages: {
          en: `${baseUrl}/en${route}`,
          de: `${baseUrl}/de${route}`,
          'x-default': `${baseUrl}/en${route}`,
        },
      },
    }))
  );
}
