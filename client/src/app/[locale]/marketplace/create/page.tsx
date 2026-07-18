'use client';

import { useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useSession } from 'next-auth/react';
import { Loader2, ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';

export default function CreateMarketplaceItemPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === 'authenticated') {
            router.replace('/editor');
        }
    }, [status, router]);

    if (status === 'loading') {
        return (
            <div className="flex justify-center pt-20">
                <Loader2 className="animate-spin text-amber-400" size={40} />
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-bg pt-8 pb-20 px-4">
            <div className="max-w-2xl mx-auto bg-gray-100 dark:bg-gray-900/50 p-8 rounded-2xl border border-gray-200 dark:border-gray-800 text-center">
                <h1 className="text-3xl font-black text-gray-800 dark:text-white mb-4">
                    Publishing has moved
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                    You can now publish games, boards, and piece sets directly from the editor.
                    Open any project and use the Publish button.
                </p>
                <Link
                    href="/editor"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-xl transition-colors"
                >
                    Go to Editor <ArrowRight size={20} />
                </Link>
            </div>
        </main>
    );
}
