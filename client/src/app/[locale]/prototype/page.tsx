import PrototypeBoard from '@/components/prototype/PrototypeBoard';

export const metadata = {
    title: 'Engine Prototype | chessperiment',
    description: 'Test custom piece logic and the logic-aware chess engine in this sandbox environment.',
};

export default function PrototypePage() {
    return (
        <div className="min-h-screen bg-stone-50 dark:bg-stone-950 pt-20">
            <div className="container mx-auto px-4 pb-20">
                <div className="mb-8">
                    <h1 className="text-4xl lg:text-5xl font-black text-stone-900 dark:text-white uppercase tracking-tighter italic">
                        Logic <span className="text-amber-500">Prototype</span>
                    </h1>
                    <p className="text-stone-500 dark:text-stone-400 font-bold uppercase tracking-widest text-xs mt-2">
                        Advanced Engine Testing Sandbox
                    </p>
                </div>

                <PrototypeBoard />
            </div>
        </div>
    );
}
