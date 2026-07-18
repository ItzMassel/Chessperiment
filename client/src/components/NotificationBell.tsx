'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { getNotifications, getUnreadNotificationCount, markNotificationRead, markAllNotificationsRead, AppNotification } from '@/app/actions/notifications';

export function NotificationBell() {
    const { data: session } = useSession();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (session?.user?.id) {
            loadNotifications();
        }
    }, [session]);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    async function loadNotifications() {
        if (!session?.user?.id) return;
        setLoading(true);
        try {
            const [notifs, count] = await Promise.all([
                getNotifications(session.user.id),
                getUnreadNotificationCount(session.user.id),
            ]);
            setNotifications(notifs);
            setUnreadCount(count);
        } finally {
            setLoading(false);
        }
    }

    const handleMarkAllRead = async () => {
        if (!session?.user?.id) return;
        await markAllNotificationsRead(session.user.id);
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
    };

    const handleClickNotification = async (notif: AppNotification) => {
        if (!notif.read && notif.id) {
            await markNotificationRead(notif.id);
            setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        }
        setOpen(false);
    };

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(!open)}
                className="relative p-2 text-stone-400 hover:text-amber-400 transition-colors"
                aria-label="Notifications"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto">
                    <div className="flex items-center justify-between p-3 border-b border-stone-200 dark:border-stone-800">
                        <span className="font-bold text-sm text-gray-900 dark:text-white">Notifications</span>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-xs text-amber-500 hover:text-amber-400 font-medium"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    {loading ? (
                        <div className="p-4 text-center text-sm text-gray-500">Loading...</div>
                    ) : notifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-gray-500">No notifications yet</div>
                    ) : (
                        <div className="divide-y divide-stone-100 dark:divide-stone-800">
                            {notifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    onClick={() => handleClickNotification(notif)}
                                    className={`p-3 cursor-pointer transition-colors ${
                                        notif.read
                                            ? 'bg-white dark:bg-stone-900'
                                            : 'bg-amber-50 dark:bg-amber-900/10'
                                    } hover:bg-stone-50 dark:hover:bg-stone-800`}
                                >
                                    <div className="flex items-start gap-3">
                                        {notif.actorPhotoUrl && (
                                            <img
                                                src={notif.actorPhotoUrl}
                                                alt=""
                                                className="w-8 h-8 rounded-full object-cover shrink-0"
                                            />
                                        )}
                                        <div className="min-w-0">
                                            <p className="text-sm text-gray-800 dark:text-gray-200 leading-snug">
                                                {notif.message}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {new Date(notif.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
