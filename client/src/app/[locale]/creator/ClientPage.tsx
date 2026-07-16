'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/i18n/navigation';
import { MarketplaceItem } from '@/lib/marketplace-types';
import { getCreatorMarketplaceItems } from '@/lib/marketplace-data';
import { updateMarketplaceItem, deleteMarketplaceItem } from '@/app/actions/marketplace';
import { getMyCreatorProfile } from '@/app/actions/creator';
import { Loader2, Edit, Trash2, Eye, Star, GitFork, Gamepad2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import { storage } from '@/lib/firebase-client';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { MarketplaceBoardPreview } from '@/components/marketplace/MarketplaceBoardPreview';

export default function ClientPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [items, setItems] = useState<MarketplaceItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editData, setEditData] = useState<{ title: string; description: string; imageUrl: string }>({
        title: '',
        description: '',
        imageUrl: '',
    });
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!authLoading && user) {
            loadItems();
        } else if (!authLoading && !user) {
            router.push('/login');
        }
    }, [authLoading, user, router]);

    async function loadItems() {
        if (!user) return;
        setLoading(true);
        try {
            console.log('📥 Loading creator items for user:', user.uid || user.id);

            // Get creator profile to find their handle
            const creatorProfile = await getMyCreatorProfile();
            console.log('👤 Creator profile:', creatorProfile);

            if (!creatorProfile) {
                console.warn('⚠️ No creator profile found');
                setItems([]);
                return;
            }

            // Get items published by this creator
            console.log('🔍 Fetching items for creator handle:', creatorProfile.handle);
            const allItems = await getCreatorMarketplaceItems(creatorProfile.handle);
            console.log('📦 Items found:', allItems.length, allItems);
            setItems(allItems);
        } catch (error) {
            console.error('❌ Error loading items:', error);
            toast.error('Failed to load published items');
        } finally {
            setLoading(false);
        }
    }

    async function handleUpdateItem(itemId: string) {
        try {
            const result = await updateMarketplaceItem(itemId, editData);
            if (result.success) {
                toast.success('Item updated!');
                setEditingId(null);
                await loadItems();
            } else {
                toast.error(result.error || 'Failed to update item');
            }
        } catch (error) {
            console.error('Error updating item:', error);
            toast.error('Failed to update item');
        }
    }

    async function handleThumbnailUpload(file: File) {
        if (!user) return;
        setUploading(true);
        try {
            const ext = file.name.split('.').pop();
            const path = `marketplace-thumbnails/${user.uid || user.id}/${Date.now()}.${ext}`;
            if (!storage) return;
            const storageRef = ref(storage as any, path);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);
            setEditData(prev => ({ ...prev, imageUrl: url }));
            toast.success('Image uploaded!');
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Failed to upload image');
        } finally {
            setUploading(false);
        }
    }

    async function handleDelete(itemId: string) {
        if (!confirm('Are you sure you want to delete this published item?')) return;
        try {
            const result = await deleteMarketplaceItem(itemId);
            if (result.success) {
                toast.success('Item deleted');
                await loadItems();
            } else {
                toast.error(result.error || 'Failed to delete item');
            }
        } catch (error) {
            console.error('Error deleting item:', error);
            toast.error('Failed to delete item');
        }
    }

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="mb-8">
                <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2">
                    My Published Items
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Manage and customize your marketplace items
                </p>
            </div>

            {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-gray-50 dark:bg-gray-800/30 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                    <Gamepad2 className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                    <h3 className="text-xl font-bold text-gray-600 dark:text-gray-400 mb-2">
                        No published items yet
                    </h3>
                    <p className="text-gray-500 dark:text-gray-500 mb-6">
                        Publish your first game, board, or piece set from the editor
                    </p>
                    <button
                        onClick={() => router.push('/editor')}
                        className="px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-lg font-bold transition-colors"
                    >
                        Go to Editor
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map((item) => (
                        <div
                            key={item.id}
                            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow"
                        >
                            {/* Thumbnail */}
                            <div className="aspect-video bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
                                {item.imageUrl ? (
                                    <Image
                                        src={item.imageUrl}
                                        alt={item.title}
                                        fill
                                        className="object-cover"
                                    />
                                ) : item.preview_config ? (
                                    <MarketplaceBoardPreview config={item.preview_config} />
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <Gamepad2 className="w-8 h-8 text-gray-400" />
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="p-4 space-y-3">
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white truncate">{item.title}</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.type}</p>
                                </div>

                                {/* Stats */}
                                <div className="flex gap-2 text-xs text-gray-600 dark:text-gray-400">
                                    <div className="flex items-center gap-1">
                                        <Star size={12} className="text-yellow-500" />
                                        {item.rating.toFixed(1)}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Eye size={12} />
                                        {item.views}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <GitFork size={12} />
                                        {item.forkCount}
                                    </div>
                                </div>

                                {/* Actions */}
                                {editingId === item.id ? (
                                    <div className="space-y-2">
                                        <input
                                            type="text"
                                            value={editData.title}
                                            onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                                            placeholder="Title"
                                            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
                                        />
                                        <textarea
                                            value={editData.description}
                                            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                                            placeholder="Description"
                                            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm resize-none"
                                            rows={2}
                                        />
                                        <div className="space-y-1">
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Custom thumbnail (optional — auto-preview is used otherwise)</p>
                                            <div className="flex gap-2">
                                                <input
                                                    type="url"
                                                    value={editData.imageUrl}
                                                    onChange={(e) => setEditData({ ...editData, imageUrl: e.target.value })}
                                                    placeholder="Paste image URL…"
                                                    className="flex-1 min-w-0 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    disabled={uploading}
                                                    className="flex items-center gap-1.5 px-3 py-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 shrink-0"
                                                >
                                                    {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                                                    {uploading ? 'Uploading…' : 'Upload'}
                                                </button>
                                                {editData.imageUrl && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditData({ ...editData, imageUrl: '' })}
                                                        title="Remove custom thumbnail"
                                                        className="p-2 bg-gray-200 dark:bg-gray-600 hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-600 dark:text-gray-300 rounded-lg transition-colors shrink-0"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                )}
                                            </div>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) handleThumbnailUpload(file);
                                                    e.target.value = '';
                                                }}
                                            />
                                            {editData.imageUrl && (
                                                <div className="w-16 h-16 relative rounded overflow-hidden border border-gray-200 dark:border-gray-600 mt-1">
                                                    <Image src={editData.imageUrl} alt="Thumbnail preview" fill className="object-cover" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleUpdateItem(item.id)}
                                                className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm transition-colors"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={() => setEditingId(null)}
                                                className="flex-1 px-3 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-medium text-sm transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                setEditingId(item.id);
                                                setEditData({
                                                    title: item.title,
                                                    description: item.description || '',
                                                    imageUrl: item.imageUrl || '',
                                                });
                                            }}
                                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors"
                                        >
                                            <Edit size={14} /> Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
