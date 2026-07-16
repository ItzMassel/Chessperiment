import { Link } from '@/i18n/navigation';
import announcements from '@/app/announcements';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { SEOFooter } from "@/components/SEOFooter";

export async function generateMetadata({ params }: { params: any }) {
    const resolvedParams = await params;
    const id = resolvedParams?.id;
    const locale = resolvedParams?.locale || 'en';
    const announcement = announcements.find(a => a.id === id);

    if (!announcement) return { title: 'Not Found | chessperiment' };

    const t = await getTranslations({ locale, namespace: 'SEO.Announcements' });

    const title = announcement.title[locale as keyof typeof announcement.title];

    return {
        title: `${title} | ${t('title') || 'News'}`,
        description: announcement.shortDescription[locale as keyof typeof announcement.shortDescription],
        openGraph: {
            title: title,
            description: announcement.shortDescription[locale as keyof typeof announcement.shortDescription],
            images: [{ url: announcement.image }],
        },
    };
}

export default async function AnnouncementPage({ params }: { params: any }) {
    const resolvedParams = await params;
    const id = resolvedParams?.id;
    const locale = resolvedParams?.locale || 'en';

    const announcement = announcements.find(a => a.id === id);
    const t = await getTranslations({ locale, namespace: 'Announcements' });

    if (!announcement) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-bg pb-20">
            {/* Hero Header */}
            <div className="relative h-[40vh] md:h-[60vh] w-full overflow-hidden">
                <Image
                    src={announcement.image}
                    alt={announcement.title[locale as keyof typeof announcement.title]}
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-linear-to-t from-bg via-bg/20 to-transparent" />

                <div className="absolute inset-0 flex items-end">
                    <div className="max-w-4xl mx-auto px-4 w-full pb-12">
                        <Link
                            href="/announcements"
                            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors group"
                        >
                            <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            {t('backToOverview')}
                        </Link>
                        <h1 className="text-4xl md:text-6xl font-black text-white leading-tight drop-shadow-xl">
                            {announcement.title[locale as keyof typeof announcement.title]}
                        </h1>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="max-w-4xl mx-auto px-4 -mt-8 relative z-10">
                <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl">
                    <div className="flex flex-wrap items-center gap-6 mb-12 pb-8 border-b border-stone-100 dark:border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center font-bold text-white">
                                {announcement.author[0]}
                            </div>
                            <div>
                                <div className="text-xs text-stone-500 uppercase tracking-widest font-bold">{t('by')}</div>
                                <div className="font-bold text-stone-900 dark:text-white">{announcement.author}</div>
                            </div>
                        </div>
                        <div className="h-8 w-px bg-stone-200 dark:bg-white/10 hidden sm:block" />
                        <div>
                            <div className="text-xs text-stone-500 uppercase tracking-widest font-bold">Datum</div>
                            <div className="font-bold text-stone-900 dark:text-white uppercase">{announcement.date}</div>
                        </div>
                    </div>

                    <div className="prose prose-lg dark:prose-invert max-w-none">
                        <div className="text-xl text-stone-600 dark:text-stone-300 font-medium leading-relaxed mb-8">
                            {announcement.shortDescription[locale as keyof typeof announcement.shortDescription]}
                        </div>
                        <div
                            className="space-y-6 text-stone-800 dark:text-stone-200 leading-loose"
                            dangerouslySetInnerHTML={{ __html: announcement.content[locale as keyof typeof announcement.content] }}
                        />
                    </div>
                </div>
                <SEOFooter />
            </div>
        </div>
    );
}
