'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FAQItem {
    id: string;
    question: { [key: string]: string };
    answer: { [key: string]: string };
}

interface FAQClientProps {
    faqs: FAQItem[];
    locale: string;
    title: string;
}

export default function FAQClient({ faqs, locale, title }: FAQClientProps) {
    const [openFaq, setOpenFaq] = useState<string | null>(null);

    const toggleFaq = (id: string) => {
        setOpenFaq(openFaq === id ? null : id);
    };

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-4xl pt-12">
            <h1 className="text-4xl md:text-5xl font-bold text-center mb-10 text-white">
                {title}
            </h1>

            <div className="space-y-4">
                {faqs.map((faq) => (
                    <div key={faq.id} className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl overflow-hidden transition-all duration-300">
                        <button
                            className="flex justify-between items-center w-full p-6 text-lg font-semibold text-left text-white/90 hover:bg-white/5 transition-colors"
                            onClick={() => toggleFaq(faq.id)}
                        >
                            {faq.question[locale] || faq.question['en']}
                            <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${openFaq === faq.id ? 'rotate-180 text-accent' : 'text-white/40'}`} />
                        </button>
                        <div
                            className={`transition-all duration-300 ease-in-out ${openFaq === faq.id ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}
                        >
                            <div className="px-6 pb-6 text-white/60 prose prose-invert max-w-none">
                                <p>{faq.answer[locale] || faq.answer['en']}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
