'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { X, Download, Image, FileText, FileJson, Loader2, Check } from 'lucide-react';
import { Project } from '@/types/Project';
import { exportAsImageBlob, exportAsImageWithInfoBlob, exportAsJsonString, downloadBlob, downloadString } from '@/lib/export-variant';

interface ExportVariantModalProps {
    project: Project;
    onClose: () => void;
}

export default function ExportVariantModal({ project, onClose }: ExportVariantModalProps) {
    const t = useTranslations('ExportVariant');
    const [exporting, setExporting] = useState<string | null>(null);

    const sanitizedName = (project.name || 'chess-variant')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'chess-variant';

    const handleExportImage = async () => {
        setExporting('image');
        try {
            const blob = await exportAsImageBlob(project);
            downloadBlob(blob, `${sanitizedName}-board.png`);
        } catch (err) {
            console.error('Export failed:', err);
        } finally {
            setExporting(null);
        }
    };

    const handleExportImageWithInfo = async () => {
        setExporting('image-info');
        try {
            const blob = await exportAsImageWithInfoBlob(project);
            downloadBlob(blob, `${sanitizedName}-board-with-info.png`);
        } catch (err) {
            console.error('Export failed:', err);
        } finally {
            setExporting(null);
        }
    };

    const handleExportJson = () => {
        setExporting('json');
        try {
            const json = exportAsJsonString(project);
            downloadString(json, `${sanitizedName}.chessperiment.json`);
        } catch (err) {
            console.error('Export failed:', err);
        } finally {
            setTimeout(() => setExporting(null), 500);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-black text-stone-900 dark:text-white">{t('title')}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">{t('description')}</p>

                <div className="space-y-4">
                    <button
                        onClick={handleExportImage}
                        disabled={exporting !== null}
                        className="w-full flex items-center gap-4 p-4 rounded-2xl border border-stone-200 dark:border-stone-700 hover:border-accent hover:bg-accent/5 dark:hover:bg-accent/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left group"
                    >
                        <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 shrink-0">
                            {exporting === 'image' ? <Loader2 size={22} className="animate-spin" /> : <Image size={22} />}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="font-bold text-stone-900 dark:text-white">{t('imageOnlyTitle')}</p>
                            <p className="text-sm text-stone-500 dark:text-stone-400 truncate">{t('imageOnlyDesc')}</p>
                        </div>
                        {exporting === 'image' ? (
                            <Loader2 size={20} className="animate-spin text-green-600 shrink-0" />
                        ) : (
                            <Download size={20} className="text-stone-400 group-hover:text-accent shrink-0" />
                        )}
                    </button>

                    <button
                        onClick={handleExportImageWithInfo}
                        disabled={exporting !== null}
                        className="w-full flex items-center gap-4 p-4 rounded-2xl border border-stone-200 dark:border-stone-700 hover:border-accent hover:bg-accent/5 dark:hover:bg-accent/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left group"
                    >
                        <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shrink-0">
                            {exporting === 'image-info' ? <Loader2 size={22} className="animate-spin" /> : <FileText size={22} />}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="font-bold text-stone-900 dark:text-white">{t('imageWithInfoTitle')}</p>
                            <p className="text-sm text-stone-500 dark:text-stone-400 truncate">{t('imageWithInfoDesc')}</p>
                        </div>
                        {exporting === 'image-info' ? (
                            <Loader2 size={20} className="animate-spin text-blue-600 shrink-0" />
                        ) : (
                            <Download size={20} className="text-stone-400 group-hover:text-accent shrink-0" />
                        )}
                    </button>

                    <button
                        onClick={handleExportJson}
                        disabled={exporting !== null}
                        className="w-full flex items-center gap-4 p-4 rounded-2xl border border-stone-200 dark:border-stone-700 hover:border-accent hover:bg-accent/5 dark:hover:bg-accent/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left group"
                    >
                        <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 shrink-0">
                            {exporting === 'json' ? <Check size={22} /> : <FileJson size={22} />}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="font-bold text-stone-900 dark:text-white">{t('fileTitle')}</p>
                            <p className="text-sm text-stone-500 dark:text-stone-400 truncate">{t('fileDesc')}</p>
                        </div>
                        {exporting === 'json' ? (
                            <Check size={20} className="text-purple-600 shrink-0" />
                        ) : (
                            <Download size={20} className="text-stone-400 group-hover:text-accent shrink-0" />
                        )}
                    </button>
                </div>

                <button
                    onClick={onClose}
                    className="w-full mt-6 py-3 text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors font-medium"
                >
                    {t('cancel')}
                </button>
            </div>
        </div>
    );
}
