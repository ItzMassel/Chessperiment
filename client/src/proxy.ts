import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';



const { auth } = NextAuth(authConfig);
const i18nMiddleware = createMiddleware(routing);

export default auth((req) => {
  if (req.headers.get('user-agent')?.includes('Googlebot')) {
    return i18nMiddleware(req); // Keine Auth für Bots
  }
  return i18nMiddleware(req);
});


export const config = {
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*|sitemap\\.xml|robots\\.txt|opengraph-image).*)'
}
