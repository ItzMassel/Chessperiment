import { useTranslations } from 'next-intl';

export default function Trending() {
    const t = useTranslations('Homepage');

    return <>{t('trending')}</>
}