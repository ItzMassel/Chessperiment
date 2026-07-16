'use client';

import { useState } from 'react';
import { Star, Trash2, User } from 'lucide-react';
import { submitReview, deleteReview } from '@/app/actions/marketplace';
import { Review } from '@/lib/marketplace-types';
import { useAuth } from '@/context/AuthContext';
import { Link } from '@/i18n/navigation';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

interface ReviewSectionProps {
    marketplaceId: string;
    initialReviews: Review[];
}

function StarRating({ value, onChange, readonly = false }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) {
    const [hover, setHover] = useState(0);
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    disabled={readonly}
                    onClick={() => onChange?.(star)}
                    onMouseEnter={() => !readonly && setHover(star)}
                    onMouseLeave={() => !readonly && setHover(0)}
                    className={`transition-transform ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
                >
                    <Star
                        size={readonly ? 14 : 20}
                        className={
                            (hover || value) >= star
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-300 dark:text-gray-600'
                        }
                    />
                </button>
            ))}
        </div>
    );
}

export default function ReviewSection({ marketplaceId, initialReviews }: ReviewSectionProps) {
    const t = useTranslations('Marketplace');
    const { user } = useAuth();
    const router = useRouter();
    const [reviews, setReviews] = useState<Review[]>(initialReviews);
    const [rating, setRating] = useState(0);
    const [text, setText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);

    const hasReviewed = user && reviews.some(r => r.userId === user.uid);

    const handleSubmit = async () => {
        if (rating === 0 || !text.trim()) return;
        setSubmitting(true);
        try {
            const result = await submitReview(marketplaceId, rating, text);
            if (result.success) {
                setRating(0);
                setText('');
                setShowForm(false);
                router.refresh();
            } else {
                alert(result.error);
            }
        } catch {
            alert(t('review.failed'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (reviewId: string) => {
        if (!confirm(t('review.deleteConfirm'))) return;
        const result = await deleteReview(marketplaceId, reviewId);
        if (result.success) {
            setReviews(prev => prev.filter(r => r.id !== reviewId));
            router.refresh();
        }
    };

    const formatDate = (date: Date | string) => {
        const d = date instanceof Date ? date : new Date(date);
        return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    };

    return (
        <div className="mt-12" id="reviews">
            <h2 className="text-2xl font-black text-gray-800 dark:text-white mb-6">
                {t('review.title')} ({reviews.length})
            </h2>

            {/* Write Review */}
            {user && !hasReviewed && (
                <div className="mb-8">
                    {!showForm ? (
                        <button
                            onClick={() => setShowForm(true)}
                            className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-sm transition-colors"
                        >
                            {t('review.write')}
                        </button>
                    ) : (
                        <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 block">{t('review.yourRating')}</label>
                                <StarRating value={rating} onChange={setRating} />
                            </div>
                            <div>
                                <textarea
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    rows={3}
                                    maxLength={2000}
                                    placeholder={t('review.placeholder')}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400/50 resize-none text-sm"
                                />
                                <p className="text-xs text-gray-400 mt-1">{text.length}/2000</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting || rating === 0 || !text.trim()}
                                    className="px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-bold text-sm transition-colors disabled:opacity-50"
                                >
                                    {t('review.submit')}
                                </button>
                                <button
                                    onClick={() => { setShowForm(false); setRating(0); setText(''); }}
                                    className="px-4 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                >
                                    {t('review.cancel')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {!user && (
                <p className="text-sm text-gray-400 mb-6">{t('review.loginRequired')}</p>
            )}

            {hasReviewed && (
                <p className="text-sm text-amber-500 mb-6">{t('review.alreadyReviewed')}</p>
            )}

            {/* Review List */}
            {reviews.length === 0 ? (
                <p className="text-gray-400 text-sm">{t('review.noReviews')}</p>
            ) : (
                <div className="space-y-4">
                    {reviews.map((review) => (
                        <div key={review.id} className="bg-white dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                        <User size={14} className="text-gray-500" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            {review.creatorHandle ? (
                                                <Link href={`/u/${review.creatorHandle.replace('@', '')}`} className="font-semibold text-sm text-gray-800 dark:text-white hover:text-amber-500 transition-colors">
                                                    {review.displayName}
                                                </Link>
                                            ) : (
                                                <span className="font-semibold text-sm text-gray-800 dark:text-white">{review.displayName}</span>
                                            )}
                                            <span className="text-xs text-gray-400">{formatDate(review.createdAt)}</span>
                                        </div>
                                        <StarRating value={review.rating} readonly />
                                    </div>
                                </div>
                                {user?.uid === review.userId && (
                                    <button
                                        onClick={() => handleDelete(review.id!)}
                                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-3 leading-relaxed">{review.text}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
