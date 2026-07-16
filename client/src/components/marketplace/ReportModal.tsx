'use client';

import { useState } from 'react';
import { Flag, X, Loader2 } from 'lucide-react';
import { reportMarketplaceItem } from '@/app/actions/marketplace';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

const REPORT_REASONS = [
    'Inappropriate content',
    'Spam or misleading',
    'Copyright infringement',
    'Offensive language',
    'Other',
];

interface ReportModalProps {
    marketplaceId: string;
    itemTitle: string;
}

export function ReportModal({ marketplaceId, itemTitle }: ReportModalProps) {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [reason, setReason] = useState('');
    const [details, setDetails] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (!user) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reason) return;
        setSubmitting(true);
        try {
            const result = await reportMarketplaceItem(marketplaceId, reason, details);
            if (result.success) {
                toast.success('Report submitted. Thank you.');
                setOpen(false);
                setReason('');
                setDetails('');
            } else {
                toast.error(result.error || 'Failed to submit report.');
            }
        } catch {
            toast.error('Failed to submit report.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors mt-2"
            >
                <Flag size={12} />
                Report
            </button>

            {open && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
                >
                    <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-stone-700">
                        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-stone-800">
                            <div>
                                <h2 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                    <Flag size={16} className="text-red-500" />
                                    Report Item
                                </h2>
                                <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{itemTitle}</p>
                            </div>
                            <button
                                onClick={() => setOpen(false)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-stone-800 transition-all"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                                    Reason <span className="text-red-500">*</span>
                                </label>
                                <div className="space-y-2">
                                    {REPORT_REASONS.map((r) => (
                                        <label key={r} className="flex items-center gap-2.5 cursor-pointer group">
                                            <input
                                                type="radio"
                                                name="reason"
                                                value={r}
                                                checked={reason === r}
                                                onChange={() => setReason(r)}
                                                className="accent-red-500"
                                            />
                                            <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
                                                {r}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                                    Additional details <span className="text-gray-400 font-normal">(optional)</span>
                                </label>
                                <textarea
                                    value={details}
                                    onChange={(e) => setDetails(e.target.value)}
                                    rows={3}
                                    maxLength={1000}
                                    placeholder="Describe the issue..."
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-stone-700 bg-white dark:bg-stone-950 text-sm text-gray-800 dark:text-gray-200 focus:border-red-400 outline-none resize-none"
                                />
                            </div>

                            <div className="flex gap-2 justify-end pt-1">
                                <button
                                    type="button"
                                    onClick={() => setOpen(false)}
                                    className="px-4 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!reason || submitting}
                                    className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                                >
                                    {submitting && <Loader2 size={14} className="animate-spin" />}
                                    Submit Report
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
