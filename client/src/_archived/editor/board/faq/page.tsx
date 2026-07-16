import type { Metadata } from 'next';
import { generateHreflangs, Locale } from '@/lib/hreflang';
import { getTranslations } from 'next-intl/server';
import FAQClient from './FAQClient';

const faqs = [
    {
        id: '1',
        question: {
            en: 'How do I create a custom board shape?',
            de: 'Wie erstelle ich eine benutzerdefinierte Brettform?'
        },
        answer: {
            en: 'In "Shape" mode, simply click on the empty squares to activate them, or click on active squares to deactivate them. You can drag the resize handles on the right and bottom to expand your grid.',
            de: 'Im Modus "Form" klicken Sie einfach auf leere Felder, um sie zu aktivieren, oder auf aktive Felder, um sie zu deaktivieren. Sie können die Größenänderungsgriffe rechts und unten ziehen, um Ihr Raster zu erweitern.'
        }
    },
    {
        id: '2',
        question: {
            en: 'Can I place any chess piece anywhere?',
            de: 'Kann ich jede Schachfigur überall platzieren?'
        },
        answer: {
            en: 'Yes! Switch to "Pieces" mode, select your desired piece (e.g., White Queen), and then click on any active square on the board to place it. Right-click to remove a piece.',
            de: 'Ja! Wechseln Sie in den Modus "Figuren", wählen Sie Ihre gewünschte Figur aus (z.B. Weiße Dame) und klicken Sie dann auf ein beliebiges aktives Feld auf dem Brett, um sie zu platzieren. Rechtsklick entfernt eine Figur.'
        }
    },
    {
        id: '3',
        question: {
            en: 'How do I save and share my custom board?',
            de: 'Wie speichere und teile ich mein benutzerdefiniertes Brett?'
        },
        answer: {
            en: 'Currently, boards are saved locally in your browser. In the future, you will be able to publish your creations to the chessperiment community or export them as JSON files. Sharing links will also be available.',
            de: 'Derzeit werden Bretter lokal in Ihrem Browser gespeichert. Zukünftig können Sie Ihre Kreationen in der chessperiment-Community veröffentlichen oder als JSON-Dateien exportieren. Auch das Teilen von Links wird möglich sein.'
        }
    },
    {
        id: '4',
        question: {
            en: 'What are the limits for board size?',
            de: 'Welche Grenzen gibt es für die Brettgröße?'
        },
        answer: {
            en: 'The editor supports boards from 1x1 up to 20x20 squares, giving you plenty of room for creative designs.',
            de: 'Der Editor unterstützt Bretter von 1x1 bis zu 20x20 Feldern, was Ihnen viel Raum für kreative Designs bietet.'
        }
    },
    {
        id: '5',
        question: {
            en: 'Can I customize the appearance of the pieces?',
            de: 'Kann ich das Aussehen der Figuren anpassen?'
        },
        answer: {
            en: 'Yes, you can select different piece styles from the "Design" section in the editor sidebar. For even more customization, visit the Piece Editor to create your own pixel-art pieces!',
            de: 'Ja, Sie können verschiedene Figurenstile im Abschnitt "Design" in der Editor-Seitenleiste auswählen. Für noch mehr Anpassungsmöglichkeiten besuchen Sie den Figuren-Editor, um Ihre eigenen Pixel-Art-Figuren zu erstellen!'
        }
    }
];

type Props = {
    params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;
    const title = locale === 'de' ? "chessperiment Board Editor FAQ – Alle Antworten" : "chessperiment Board Editor FAQ – All Answers";
    const description = locale === 'de'
        ? "Hier findest du alle häufigen Fragen zum chessperiment Board Editor, inklusive Tipps zum Erstellen eigener Boards und Figuren."
        : "Here you will find all frequently asked questions about the chessperiment Board Editor, including tips for creating your own boards and pieces.";

    const hreflangs = generateHreflangs('/editor/board/faq', ['de', 'en'], locale as Locale, 'https://chessperiment.app');

    return {
        title: title,
        description: description,
        alternates: {
            canonical: `https://chessperiment.app/${locale}/editor/board/faq`,
            languages: hreflangs.reduce((acc, tag) => {
                acc[tag.hrefLang] = tag.href;
                return acc;
            }, {} as Record<string, string>),
        },
        openGraph: {
            title: title,
            description: description,
            url: `https://chessperiment.app/${locale}/editor/board/faq`,
            images: ['https://chessperiment.app/editor-board-faq.png'],
            type: "website"
        },
        twitter: {
            card: "summary_large_image",
            title: title,
            description: description,
            images: ['https://chessperiment.app/editor-board-faq.png'],
        },
    };
}

export default async function FAQPage({ params }: Props) {
    const { locale } = await params;
    const t = await getTranslations('FAQ');

    const jsonLd_faq = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqs.map(faq => ({
            "@type": "Question",
            "name": faq.question[locale as keyof typeof faq.question],
            "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer[locale as keyof typeof faq.answer]
            }
        }))
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd_faq).replace(/</g, '\u003c') }}
            />
            <FAQClient faqs={faqs} locale={locale} title={t('title')} />
        </>
    );
}