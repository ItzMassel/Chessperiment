import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import { Link } from '@/i18n/navigation';
import styles from "./legal-notice.module.css";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'SEO.LegalNotice' });
    return {
        title: t('title'),
        description: t('description'),
        alternates: {
            canonical: `https://chessperiment.app/${locale}/legal-notice`,
            languages: {
                'en': 'https://chessperiment.app/en/legal-notice',
                'de': 'https://chessperiment.app/de/legal-notice'
            }
        },
    };
}

export default async function LegalNotice({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "LegalNotice" });

    return (
        <div className={styles.container}>
            <div className="mb-6">
                <Link href="/" className="text-sm text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 transition-colors">
                    ← chessperiment
                </Link>
            </div>
            <h1 className={styles.title}>{t("title")}</h1>

            <section className={styles.section}>
                <p className={styles.text}>{t("legalBasis")}</p>
                <address>
                    <p className={styles.text}>{t("operatorName")}</p>
                    <p className={styles.text}>{t("representedBy")}{" "}{t("guardianName")}</p>
                    <p className={styles.text}>{t("address")}</p>
                </address>
            </section>

            <section className={styles.section}>
                <h2 className={styles.heading}>{t("contactHeading")}</h2>
                <p className={styles.text}>
                    {t("emailLabel")}{" "}
                    <a href={`mailto:${t("emailValue")}`} className={styles.link}>
                        {t("emailValue")}
                    </a>
                </p>
                <p className={styles.text}>
                    {t("phoneLabel")}{" "}
                    <a href={`tel:${t("phoneValue")}`} className={styles.link}>
                        {t("phoneValue")}
                    </a>
                </p>
            </section>

            <section className={styles.section}>
                <h2 className={styles.heading}>{t("disputeHeading")}</h2>
                <p className={styles.text}>{t("disputeText")}</p>
            </section>
        </div>
    );
}
