"use client"
import { useState, useEffect } from "react";
import { usePathname } from "@/i18n/navigation";
import { Header } from "./Header";
import { useLocale } from "next-intl";
import { MobileMenu } from "./MobileMenu";
import { useAuth } from "@/context/AuthContext";

export function HeaderWrapper() {
    const pathname = usePathname();
    const locale = useLocale();
    const { user, loading } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="h-20" />; // Occupy some space, but don't render content until mounted
    }

    return <>
        <MobileMenu locale={locale} isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} user={user} />
        <Header pathname={pathname} locale={locale} isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} user={user} />
    </>;
}
