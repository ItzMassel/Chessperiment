import { newsJSON } from './Data.js';
import { useLocale } from 'next-intl';

export default function News() {
    const locale = useLocale();
    const sortedNews = [...newsJSON].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return (
        <ul>
            {sortedNews.map(item => {
                const dateObj = new Date(item.date);
                const formattedDate = dateObj.toLocaleDateString(locale);
                const formattedTime = dateObj.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });

                return (
                    <li key={item.id} className="mb-4">
                        <strong>{item.title}</strong>{' '}
                        <span className="text-sm text-gray-500">({formattedDate} {formattedTime})</span>
                        <p>{item.content}</p>
                    </li>
                );
            })}
        </ul>
    );
}
