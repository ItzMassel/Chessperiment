"use client"

import React from 'react';
import Hero from '@/components/landing/Hero';
import VisualBoard from '@/components/landing/VisualBoard';
import FeatureGrid from '@/components/landing/FeatureGrid';
import { DonationCard } from '@/components/DonationCard';

const LandingPage: React.FC = () => {
    return (
        <div className="relative flex w-full flex-col group/design-root bg-white dark:bg-stone-950">
            <main className="flex-1 w-full">
                <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-24 flex flex-col gap-16 lg:gap-24">
                    {/* Hero Section Container */}
                    <div className="bg-white dark:bg-stone-900/50 rounded-3xl p-8 sm:p-20 shadow-xl border border-gray-100 dark:border-stone-800 text-center relative overflow-hidden group">
                        {/* Background Pattern */}
                        <div
                            className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
                            style={{
                                backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
                                backgroundSize: '20px 20px'
                            }}
                        />

                        <Hero />
                    </div>

                    <VisualBoard />
                    <FeatureGrid />
                    <DonationCard className="mx-auto w-full max-w-4xl" />
                </div>
            </main>
        </div>
    );
};

export default LandingPage;
