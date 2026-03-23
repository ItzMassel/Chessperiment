'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { publishToMarketplace } from '@/app/actions/marketplace';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

interface PublishModalProps {
    open: boolean;
    onClose: () => void;
    itemType: 'game' | 'board' | 'pieces';
    itemId: string;
    defaultTitle: string;
    defaultDescription?: string;
}

export default function PublishModal({ open, onClose, itemType, itemId, defaultTitle, defaultDescription }: PublishModalProps) {
    const t = useTranslations('Marketplace');
    const [title, setTitle] = useState(defaultTitle);
    const [description, setDescription] = useState(defaultDescription || '');
    const [loading, setLoading] = useState(false);

    const handlePublish = async () => {
        if (!title.trim()) {
            toast.error(t('publish.titleRequired'));
            return;
        }
        setLoading(true);
        try {
            let payload: Parameters<typeof publishToMarketplace>[0];
            if (itemType === 'game') payload = { type: 'game', projectId: itemId };
            else if (itemType === 'board') payload = { type: 'board', boardId: itemId };
            else payload = { type: 'pieces', pieceSetId: itemId };

            const result = await publishToMarketplace(payload, {
                title: title.trim(),
                description: description.trim(),
            });

            console.log('Publish result:', result);

            if (result.success) {
                console.log('✅ Publish succeeded!');
                toast.success(t('publish.success'));
                setTimeout(() => onClose(), 500);
            } else if (result.error === 'CREATOR_PROFILE_MISSING') {
                console.log('❌ Creator profile missing');
                toast.error(t('publish.creatorRequired'), {
                    description: t('publish.creatorRequiredDescription'),
                });
            } else {
                console.log('❌ Publish failed:', result.error);
                toast.error(result.error || t('publish.failed'));
            }
        } catch (error) {
            console.error('Publish error:', error);
            toast.error(t('publish.failed'));
        } finally {
            setLoading(false);
        }
    };

    const typeLabel = itemType === 'game' ? t('publish.typeGame')
        : itemType === 'board' ? t('publish.typeBoard')
        : t('publish.typePieces');

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{t('publish.title')}</DialogTitle>
                    <DialogDescription>{t('publish.description', { type: typeLabel })}</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">{t('form.title')}</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                            placeholder={t('form.titlePlaceholder')}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">{t('form.description')}</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400/50 resize-none"
                            placeholder={t('form.descriptionPlaceholder')}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        {t('publish.cancel')}
                    </button>
                    <button
                        onClick={handlePublish}
                        disabled={loading}
                        className="px-4 py-2 rounded-lg text-sm font-bold bg-amber-400 hover:bg-amber-300 text-black transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {t('publish.submit')}
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
