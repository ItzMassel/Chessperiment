export default function Loading() {
    return (
        <section className="p-6 bg-white/50 dark:bg-stone-900/50 backdrop-blur-sm border border-gray-200/50 dark:border-stone-700/50 rounded-3xl h-full flex flex-col">
            <div className="flex items-center gap-2 mb-8 animate-pulse">
                <div className="w-5 h-5 bg-gray-200 dark:bg-stone-700 rounded" />
                <div className="h-6 w-32 bg-gray-200 dark:bg-stone-700 rounded" />
            </div>

            <div className="space-y-4 flex-1">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 bg-gray-100 dark:bg-stone-800/50 rounded-2xl animate-pulse border border-gray-100 dark:border-stone-700" />
                ))}
            </div>

            <div className="mt-8 h-10 w-full bg-gray-100 dark:bg-stone-800/50 rounded-xl animate-pulse" />
        </section>
    );
}
