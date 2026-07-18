import { notFound } from 'next/navigation';
import { getCreatorProfileByHandle } from '@/app/actions/creator';
import { getCreatorMarketplaceItems } from '@/lib/marketplace-data';
import { User, Calendar } from 'lucide-react';
import { MarketplaceItemCard } from '@/components/marketplace/MarketplaceItemCard';
import { FollowButton } from './FollowButton';

interface PageProps {
    params: Promise<{
        handle: string;
        locale: string;
    }>;
}

export async function generateMetadata({ params }: PageProps) {
    const { handle } = await params;
    const profile = await getCreatorProfileByHandle(`@${handle}`);

    if (!profile) return { title: 'Creator Not Found' };

    return {
        title: `${profile.handle} - Creator Profile`,
        description: `Check out games and pieces by ${profile.handle} on chessperiment.`
    };
}

export default async function CreatorPage({ params }: PageProps) {
    const { handle } = await params;
    const profile = await getCreatorProfileByHandle(`@${handle}`);

    if (!profile) return notFound();

    const items = await getCreatorMarketplaceItems(profile.handle);
    const serializedItems = JSON.parse(JSON.stringify(items));

    return (
        <main className="min-h-screen bg-bg pt-8 pb-20 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Profile Header */}
                <div className="bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 rounded-3xl p-8 mb-12 flex flex-col md:flex-row items-center gap-8 shadow-sm">
                    <div className="w-32 h-32 bg-amber-500/10 rounded-full flex items-center justify-center border-4 border-white dark:border-stone-800 shadow-xl overflow-hidden">
                        {profile.photoUrl ? (
                            <img src={profile.photoUrl} alt={profile.displayName} className="w-full h-full object-cover" />
                        ) : (
                            <User size={64} className="text-amber-500" />
                        )}
                    </div>

                    <div className="text-center md:text-left flex-1">
                        <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-1">
                            {profile.displayName || profile.handle}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">{profile.handle}</p>
                        {profile.bio && (
                            <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 max-w-lg">{profile.bio}</p>
                        )}
                        <div className="flex items-center justify-center md:justify-start gap-4 text-gray-500 dark:text-gray-400 text-sm">
                            <span className="flex items-center gap-1">
                                <Calendar size={16} />
                                Joined {profile.date_joined ? new Date(profile.date_joined).toLocaleDateString() : 'N/A'}
                            </span>
                            <span>•</span>
                            <span>{items.length} Creations</span>
                            <span>•</span>
                            <span>{profile.followers?.length || 0} Followers</span>
                        </div>
                    </div>

                    <FollowButton targetUserId={profile.userId} />
                </div>

                {/* Items Grid */}
                <div>
                    <h2 className="text-2xl font-bold mb-6 px-2 border-l-4 border-amber-500 pl-4">
                        Published Creations
                    </h2>

                    {items.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            <ClientGrid items={serializedItems} />
                        </div>
                    ) : (
                        <div className="text-center py-20 text-gray-500">
                            No creations published yet.
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}

function ClientGrid({ items }: { items: any[] }) {
    return (
        <>
            {items.map((item) => (
                <MarketplaceItemCard key={item.id} item={item} />
            ))}
        </>
    );
}
