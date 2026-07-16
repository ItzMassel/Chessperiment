import { useTranslations } from 'next-intl';

export default function Footer() {
    const t = useTranslations('Game');
    return <footer className="mt-8"><a href="https://de.vecteezy.com/gratis-vektor/schachfigur">{t('attribution')}</a></footer>
}