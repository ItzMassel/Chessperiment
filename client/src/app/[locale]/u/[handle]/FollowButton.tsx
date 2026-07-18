'use client';

import { useState, useEffect } from 'react';
import { followCreator, unfollowCreator, isFollowing } from '@/app/actions/creator';
import { useSession } from 'next-auth/react';
import { Loader2, UserPlus, UserMinus } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/navigation';

interface FollowButtonProps {
    targetUserId: string;
}

export function FollowButton({ targetUserId }: FollowButtonProps) {
    const { data: session } = useSession();
    const router = useRouter();
    const [following, setFollowing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (session?.user?.id) {
            isFollowing(targetUserId).then(setFollowing).finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [session, targetUserId]);

    if (loading) return null;
    if (!session?.user?.id) return null;
    if (session.user.id === targetUserId) return null;

    const handleFollow = async () => {
        setActionLoading(true);
        try {
            if (following) {
                const res = await unfollowCreator(targetUserId);
                if (res.success) {
                    setFollowing(false);
                    toast.success("Unfollowed");
                    router.refresh();
                } else {
                    toast.error(res.error);
                }
            } else {
                const res = await followCreator(targetUserId);
                if (res.success) {
                    setFollowing(true);
                    toast.success("Following!");
                    router.refresh();
                } else {
                    toast.error(res.error);
                }
            }
        } catch {
            toast.error("Something went wrong");
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <button
            onClick={handleFollow}
            disabled={actionLoading}
            className={`shrink-0 px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 text-sm ${
                following
                    ? 'bg-stone-200 dark:bg-stone-700 text-gray-700 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400'
                    : 'bg-amber-500 hover:bg-amber-400 text-white shadow-lg shadow-amber-500/20'
            }`}
        >
            {actionLoading ? (
                <Loader2 size={18} className="animate-spin" />
            ) : following ? (
                <UserMinus size={18} />
            ) : (
                <UserPlus size={18} />
            )}
            {following ? 'Following' : 'Follow'}
        </button>
    );
}
