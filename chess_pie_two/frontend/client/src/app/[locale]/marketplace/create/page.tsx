'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { createMarketplaceItem } from '@/lib/marketplace-data';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Loader2, Upload, AlertCircle } from 'lucide-react';

export default function CreateMarketplaceItemPage() {
    const t = useTranslations('Marketplace'); // Assume 'Create' namespace or add keys
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (status === 'loading') {
        return <div className="flex justify-center pt-20"><Loader2 className="animate-spin text-amber-400" size={40} /></div>;
    }

    if (status === 'unauthenticated') {
        // Should ideally redirect or show access denied
        return (
            <div className="flex flex-col items-center justify-center pt-20 px-4 text-center">
                <AlertCircle size={48} className="text-red-400 mb-4" />
                <h1 className="text-2xl font-bold text-white mb-2">{t('accessDenied')}</h1>
                <p className="text-gray-400">{t('loginRequired')}</p>
            </div>
        );
    }

    async function onSubmit(formData: FormData) {
        setLoading(true);
        setError(null);
        try {
            const title = formData.get('title') as string;
            const description = formData.get('description') as string;
            const price = parseFloat(formData.get('price') as string);
            const type = formData.get('type') as any;
            const imageUrl = formData.get('imageUrl') as string; // Temp: URL input

            if (!title || !type) {
                throw new Error('Missing required fields');
            }

            const id = await createMarketplaceItem({
                title,
                description,
                price: isNaN(price) ? 0 : price,
                type,
                imageUrl,
                creator_handle: session?.user?.name ? `@${session.user.name.replace(/\s+/g, '').toLowerCase()}` : '@anonymous',
            });

            router.push(`/marketplace/${id}`);
            router.refresh();

        } catch (e: any) {
            console.error(e);
            setError(e.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen bg-bg pt-8 pb-20 px-4">
            <div className="max-w-2xl mx-auto bg-gray-100 dark:bg-gray-900/50 p-6 md:p-8 rounded-2xl border border-gray-200 dark:border-gray-800">
                <h1 className="text-3xl font-black text-gray-800 dark:text-white mb-6">{t('createItem')}</h1>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl mb-6 text-sm">
                        {error}
                    </div>
                )}

                <form action={onSubmit} className="flex flex-col gap-6">

                    {/* Title */}
                    <div className="flex flex-col gap-2">
                        <label className="font-bold text-gray-700 dark:text-gray-300 text-sm">{t('form.title')}</label>
                        <input
                            name="title"
                            required
                            placeholder={t('form.titlePlaceholder')}
                            className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-amber-400/50 outline-none transition-all"
                        />
                    </div>

                    {/* Type */}
                    <div className="flex flex-col gap-2">
                        <label className="font-bold text-gray-700 dark:text-gray-300 text-sm">{t('form.type')}</label>
                        <select
                            name="type"
                            className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-amber-400/50 outline-none transition-all"
                        >
                            <option value="board">Board</option>
                            <option value="piece">Piece</option>
                            <option value="design">Design</option>
                        </select>
                    </div>

                    {/* Price */}
                    <div className="flex flex-col gap-2">
                        <label className="font-bold text-gray-700 dark:text-gray-300 text-sm">{t('form.price')}</label>
                        <div className="relative">
                            <span className="absolute left-3 top-3 text-gray-400">$</span>
                            <input
                                name="price"
                                type="number"
                                step="0.01"
                                min="0"
                                defaultValue="0"
                                className="w-full p-3 pl-7 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-amber-400/50 outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div className="flex flex-col gap-2">
                        <label className="font-bold text-gray-700 dark:text-gray-300 text-sm">{t('form.description')}</label>
                        <textarea
                            name="description"
                            rows={4}
                            placeholder={t('form.descriptionPlaceholder')}
                            className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-amber-400/50 outline-none transition-all resize-none"
                        />
                    </div>

                    {/* Image URL (Simplified for now) */}
                    <div className="flex flex-col gap-2">
                        <label className="font-bold text-gray-700 dark:text-gray-300 text-sm">{t('form.imageUrl')}</label>
                        <input
                            name="imageUrl"
                            placeholder="https://..."
                            className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-amber-400/50 outline-none transition-all"
                        />
                        <p className="text-xs text-gray-500">{t('form.imageUrlHelp')}</p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-4 w-full bg-amber-400 hover:bg-amber-300 text-bg font-bold py-4 rounded-xl transition-all transform active:scale-[0.98] shadow-lg shadow-amber-400/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <Upload size={20} />}
                        {t('publishItem')}
                    </button>
                </form>
            </div>
        </main>
    );
}
