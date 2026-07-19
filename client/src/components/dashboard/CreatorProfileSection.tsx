'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getMyCreatorProfile, registerCreatorHandle, updateCreatorProfile, CreatorProfile } from '@/app/actions/creator';
import { Loader2, UserCheck, AtSign, Edit2, Save, X, Image as ImageIcon, FileText, Upload } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { toast } from 'sonner';
import Image from 'next/image';
import { supabase, isConfigured } from '@/lib/supabase-client';

export default function CreatorProfileSection() {
    const { user } = useAuth();
    const [profile, setProfile] = useState<CreatorProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isRegistering, setIsRegistering] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [handleInput, setHandleInput] = useState('');

    // Edit form state
    const [editForm, setEditForm] = useState({
        displayName: '',
        bio: '',
        photoUrl: ''
    });

    const router = useRouter();
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const photoInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (user) {
            loadProfile();
        } else {
            setLoading(false);
        }
    }, [user, refreshTrigger]);

    async function loadProfile() {
        try {
            console.log('🔄 Loading creator profile...');
            const data = await getMyCreatorProfile();
            console.log('📊 Profile data returned:', data);
            if (data) {
                console.log('✅ Profile found, updating state:', data);
                setProfile(data as any);
                // Initialize form data
                setEditForm({
                    displayName: data.displayName || '',
                    bio: data.bio || '',
                    photoUrl: data.photoUrl || ''
                });
            } else {
                console.log('⚠️ No profile data returned from getMyCreatorProfile()');
            }
        } catch (error) {
            console.error("❌ Failed to load profile", error);
        } finally {
            setLoading(false);
        }
    }

    const handleRegister = async () => {
        if (!handleInput) return;

        let handle = handleInput.trim();
        if (!handle.startsWith('@')) {
            handle = '@' + handle;
        }

        if (handle.length < 4) {
            toast.error("Handle must be at least 3 characters.");
            return;
        }

        setIsRegistering(true);
        try {
            console.log('Registering handle:', handle);
            const result = await registerCreatorHandle(handle);
            console.log('Registration result:', result);
            if (result.success) {
                console.log('✅ Creator profile registered!');
                toast.success("Creator profile registered!");
                setHandleInput('');
                // Add a small delay to allow Firestore replication before fetching
                setTimeout(() => {
                    console.log('📥 Reloading profile after registration...');
                    setRefreshTrigger(prev => prev + 1);
                }, 500);
            } else {
                console.log('❌ Registration failed:', result.error);
                toast.error(result.error || "Registration failed");
            }
        } catch (error) {
            console.error('Registration error:', error);
            toast.error("Failed to register.");
        } finally {
            setIsRegistering(false);
        }
    };

    const handleSaveProfile = async () => {
        setIsSaving(true);
        try {
            const result = await updateCreatorProfile({
                ...editForm
            });

            if (result.success) {
                toast.success("Profile updated!");
                await loadProfile();
                setIsEditing(false);
                router.refresh();
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("Failed to update profile.");
        } finally {
            setIsSaving(false);
        }
    };

    async function handlePhotoUpload(file: File) {
        if (!user || !isConfigured || !supabase) return;
        setUploadingPhoto(true);
        try {
            const ext = file.name.split('.').pop();
            const path = `${user.uid || user.id}/${Date.now()}.${ext}`;
            const { error } = await supabase.storage.from('avatars').upload(path, file);
            if (error) throw error;
            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
            setEditForm(prev => ({ ...prev, photoUrl: publicUrl }));
            toast.success('Photo uploaded!');
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Failed to upload photo');
        } finally {
            setUploadingPhoto(false);
        }
    }

    if (loading) return null;

    if (profile) {
        return (
            <div className="bg-linear-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-6 mb-8 overflow-hidden relative">

                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -translate-y-32 translate-x-16 pointer-events-none" />

                <div className="flex flex-col md:flex-row gap-6 relative z-10">
                    {/* Left: Avatar */}
                    <div className="shrink-0">
                        <div className="w-24 h-24 rounded-full bg-amber-100 dark:bg-amber-900/30 border-2 border-amber-500 flex items-center justify-center overflow-hidden shadow-lg">
                            {profile.photoUrl ? (
                                <Image
                                    src={profile.photoUrl}
                                    alt={profile.displayName}
                                    width={96}
                                    height={96}
                                    className="object-cover w-full h-full"
                                />
                            ) : (
                                <UserCheck className="text-amber-500" size={40} />
                            )}
                        </div>
                    </div>

                    {/* Right: Content */}
                    <div className="grow">
                        <div className="flex items-start justify-between mb-2">
                            <div>
                                <h3 className="font-bold text-2xl text-gray-900 dark:text-white flex items-center gap-2">
                                    {profile.displayName}
                                    <span className="text-xs font-normal px-2 py-0.5 bg-amber-500/20 text-amber-700 dark:text-amber-400 rounded-full border border-amber-500/30">
                                        Creator
                                    </span>
                                </h3>
                                <p className="text-amber-600 dark:text-amber-500 font-mono font-medium">
                                    {profile.handle}
                                </p>
                            </div>

                            <div className="flex gap-2">
                                {!isEditing ? (
                                    <>
                                        <button
                                            onClick={() => router.push(`/u/${profile.handle.substring(1)}`)}
                                            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white rounded-lg font-bold transition-colors text-sm shadow-sm"
                                        >
                                            View Public Page
                                        </button>
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="p-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors"
                                            title="Edit Profile"
                                        >
                                            <Edit2 size={18} className="text-gray-600 dark:text-gray-300" />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            className="p-2 bg-transparent hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg text-gray-500 transition-colors"
                                            title="Cancel"
                                        >
                                            <X size={20} />
                                        </button>
                                        <button
                                            onClick={handleSaveProfile}
                                            disabled={isSaving}
                                            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold transition-colors text-sm flex items-center gap-2 shadow-sm"
                                        >
                                            {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                                            Save
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* View Mode: Bio */}
                        {!isEditing && (
                            <div className="mt-4">
                                {profile.bio ? (
                                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed max-w-2xl">
                                        {profile.bio}
                                    </p>
                                ) : (
                                    <p className="text-gray-400 italic text-sm">
                                        No bio yet. Click edit to add one!
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Edit Mode: Form */}
                        {isEditing && (
                            <div className="mt-4 space-y-4 bg-white/50 dark:bg-black/20 p-4 rounded-xl border border-amber-500/10">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Display Name</label>
                                    <input
                                        type="text"
                                        value={editForm.displayName}
                                        onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                                        className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                                        placeholder="Your Name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Bio</label>
                                    <textarea
                                        value={editForm.bio}
                                        onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                                        className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none min-h-[80px]"
                                        placeholder="Tell the world about yourself..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Profile Picture</label>
                                    <div className="flex gap-2">
                                        <div className="relative grow">
                                            <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                            <input
                                                type="text"
                                                value={editForm.photoUrl}
                                                onChange={(e) => setEditForm({ ...editForm, photoUrl: e.target.value })}
                                                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-sm"
                                                placeholder="https://example.com/avatar.jpg"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => photoInputRef.current?.click()}
                                            disabled={uploadingPhoto}
                                            className="flex items-center gap-1.5 px-3 py-2 bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-gray-800 dark:text-gray-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 shrink-0"
                                        >
                                            {uploadingPhoto ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                                            {uploadingPhoto ? 'Uploading…' : 'Upload'}
                                        </button>
                                        <input
                                            ref={photoInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) handlePhotoUpload(file);
                                                e.target.value = '';
                                            }}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Upload a photo or enter a direct link to an image.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-linear-to-r from-stone-50 to-stone-100 dark:from-stone-900/50 dark:to-stone-900/30 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 mb-12 relative overflow-hidden group">
            {/* Hover glow effect */}
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-all duration-500 pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                <div className="flex-1">
                    <h3 className="font-bold text-2xl text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                        Upgrade to Creator
                        <span className="text-xs font-bold px-2 py-0.5 bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 rounded-full">
                            Free
                        </span>
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 max-w-lg mb-4">
                        Unlock the full potential of Chessperiment. Publish your custom boards, pieces, and game variants to the marketplace.
                    </p>
                    <ul className="grid grid-cols-2 gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                        <li className="flex items-center gap-1.5"><UserCheck size={14} className="text-amber-500" /> Public Profile Page</li>
                        <li className="flex items-center gap-1.5"><AtSign size={14} className="text-amber-500" /> Custom @handle</li>
                    </ul>
                </div>

                <div className="bg-white dark:bg-stone-950 p-4 rounded-xl border border-stone-200 dark:border-stone-800 shadow-xl w-full md:w-auto md:min-w-[320px]">
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Choose your Handle</label>
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                            <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="username"
                                value={handleInput}
                                onChange={(e) => setHandleInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && handleInput && !isRegistering) {
                                        handleRegister();
                                    }
                                }}
                                className="w-full pl-9 pr-4 py-3 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all font-mono text-sm"
                            />
                        </div>
                        <button
                            onClick={handleRegister}
                            disabled={isRegistering || !handleInput}
                            className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap shadow-lg shadow-amber-500/20"
                        >
                            {isRegistering ? <Loader2 className="animate-spin" size={20} /> : "Claim"}
                        </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-2 text-center">
                        This will be your unique identifier in the marketplace.
                    </p>
                </div>
            </div>
        </div>
    );
}
