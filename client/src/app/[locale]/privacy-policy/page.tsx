import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import { Link } from '@/i18n/navigation';
import styles from "./privacypolicy.module.css";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'SEO.PrivacyPolicy' });
    return {
        title: t('title'),
        description: t('description'),
        alternates: {
            canonical: `https://chessperiment.app/${locale}/privacy-policy`,
            languages: {
                'en': 'https://chessperiment.app/en/privacy-policy',
                'de': 'https://chessperiment.app/de/privacy-policy'
            }
        },
    };
}

export default async function PrivacyPolicy({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "PrivacyPolicy" });

    return (
        <div className={styles.container}>
            <div className="mb-6">
                <Link href="/" className="text-sm text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 transition-colors">
                    ← chessperiment
                </Link>
            </div>
            <h1 className={styles.title}>{t("title")}</h1>
            <p className={styles.lastUpdated}>{t("lastUpdated")}</p>

            <section className={styles.section}>
                <h2 className={styles.heading}>{t("controllerHeading")}</h2>
                <div className={styles.text}>{t("controllerText")}</div>
            </section>

            <section className={styles.section}>
                <h2 className={styles.heading}>{t("generalHeading")}</h2>
                <p className={styles.text}>{t("generalText")}</p>
            </section>

            <section className={styles.section}>
                <h2 className={styles.heading}>{t("sslHeading")}</h2>
                <p className={styles.text}>{t("sslText")}</p>
            </section>

            <section className={styles.section}>
                <h2 className={styles.heading}>{t("cookiesHeading")}</h2>
                <h3 className={styles.subheading}>{t("klaroSubheading")}</h3>
                <p className={styles.text}>{t("klaroText")}</p>
                <h3 className={styles.subheading}>{t("sessionSubheading")}</h3>
                <p className={styles.text}>{t("sessionText")}</p>
                <h3 className={styles.subheading}>{t("localStorageSubheading")}</h3>
                <p className={styles.text}>{t("localStorageText")}</p>
            </section>

            <section className={styles.section}>
                <h2 className={styles.heading}>{t("accountsHeading")}</h2>
                <h3 className={styles.subheading}>{t("emailSubheading")}</h3>
                <p className={styles.text}>{t("emailText")}</p>
                <h3 className={styles.subheading}>{t("googleSubheading")}</h3>
                <p className={styles.text}>{t("googleText")}</p>
                <h3 className={styles.subheading}>{t("verificationSubheading")}</h3>
                <p className={styles.text}>{t("verificationText")}</p>
            </section>

            <section className={styles.section}>
                <h2 className={styles.heading}>{t("firebaseHeading")}</h2>
                <h3 className={styles.subheading}>{t("firestoreSubheading")}</h3>
                <p className={styles.text}>{t("firestoreText")}</p>
                <h3 className={styles.subheading}>{t("firebaseStorageSubheading")}</h3>
                <p className={styles.text}>{t("firebaseStorageText")}</p>
                <h3 className={styles.subheading}>{t("dpfSubheading")}</h3>
                <p className={styles.text}>{t("dpfText")}</p>
            </section>

            <section className={styles.section}>
                <h2 className={styles.heading}>{t("aiHeading")}</h2>
                <p className={styles.text}>{t("aiText")}</p>
            </section>

            <section className={styles.section}>
                <h2 className={styles.heading}>{t("multiplayerHeading")}</h2>
                <h3 className={styles.subheading}>{t("socketSubheading")}</h3>
                <p className={styles.text}>{t("socketText")}</p>
                <h3 className={styles.subheading}>{t("stockfishSubheading")}</h3>
                <p className={styles.text}>{t("stockfishText")}</p>
            </section>

            <section className={styles.section}>
                <h2 className={styles.heading}>{t("emailHeading")}</h2>
                <h3 className={styles.subheading}>{t("resendSubheading")}</h3>
                <p className={styles.text}>{t("resendText")}</p>
                <h3 className={styles.subheading}>{t("firebaseEmailSubheading")}</h3>
                <p className={styles.text}>{t("firebaseEmailText")}</p>
            </section>

            <section className={styles.section}>
                <h2 className={styles.heading}>{t("ugcHeading")}</h2>
                <p className={styles.text}>{t("ugcText")}</p>
            </section>

            <section className={styles.section}>
                <h2 className={styles.heading}>{t("feedbackHeading")}</h2>
                <h3 className={styles.subheading}>{t("communitySubheading")}</h3>
                <p className={styles.text}>{t("communityText")}</p>
                <h3 className={styles.subheading}>{t("surveySubheading")}</h3>
                <p className={styles.text}>{t("surveyText")}</p>
            </section>

            <section className={styles.section}>
                <h2 className={styles.heading}>{t("thirdPartyHeading")}</h2>
                <h3 className={styles.subheading}>{t("botidSubheading")}</h3>
                <p className={styles.text}>{t("botidText")}</p>
                <h3 className={styles.subheading}>{t("bmcSubheading")}</h3>
                <p className={styles.text}>{t("bmcText")}</p>
                <h3 className={styles.subheading}>{t("googleImagesSubheading")}</h3>
                <p className={styles.text}>{t("googleImagesText")}</p>
            </section>

            <section className={styles.section}>
                <h2 className={styles.heading}>{t("retentionHeading")}</h2>
                <p className={styles.text}>{t("retentionText")}</p>
            </section>

            <section className={styles.section}>
                <h2 className={styles.heading}>{t("rightsHeading")}</h2>
                <p className={styles.text}>{t("rightsText")}</p>
            </section>

            <section className={styles.section}>
                <h2 className={styles.heading}>{t("objectionHeading")}</h2>
                <p className={styles.text}>{t("objectionText")}</p>
            </section>

            <section className={styles.section}>
                <h2 className={styles.heading}>{t("complaintHeading")}</h2>
                <p className={styles.text}>{t("complaintText")}</p>
            </section>

            <section className={styles.section}>
                <h2 className={styles.heading}>{t("minorsHeading")}</h2>
                <p className={styles.text}>{t("minorsText")}</p>
            </section>

            <section className={styles.section}>
                <h2 className={styles.heading}>{t("changesHeading")}</h2>
                <p className={styles.text}>{t("changesText")}</p>
            </section>

            <footer className={styles.footer}>
                <p className={styles.smallText}>{t("lastUpdated")}</p>
            </footer>
        </div>
    );
}
