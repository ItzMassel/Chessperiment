'use client';

import { useSession } from 'next-auth/react';
import { Plus } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

export function AddMarketplaceItemButton() {
    const { data: session } = useSession();
    const t = useTranslations('Marketplace');

    if (!session) return null;

    return (
        <Link
            href="/marketplace/create"
            className="fixed bottom-24 right-6 z-40 w-14 h-14 bg-amber-400 hover:bg-amber-300 text-bg rounded-full shadow-xl shadow-amber-400/30 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
            title={t('createItem')}
        >
            <Plus size={32} strokeWidth={3} />
        </Link>
    );
}
