"use client";

import { donationConfig, donationReady, getDonationUrl } from "@/lib/donation";
import { cn } from "@/lib/utils";
import { ExternalLink, Heart } from "lucide-react";
import { useTranslations } from "next-intl";

type DonationCardProps = {
  compact?: boolean;
  className?: string;
};

export function DonationCard({
  compact = false,
  className,
}: DonationCardProps) {
  const t = useTranslations("Donation");
  const donationUrl = getDonationUrl();

  if (!donationReady || !donationUrl) {
    return null;
  }

  return (
    <section
      className={cn(
        "rounded-3xl border border-amber-200/70 bg-linear-to-br from-amber-50 via-white to-orange-50 p-6 text-stone-900 shadow-[0_24px_80px_-48px_rgba(245,158,11,0.55)] dark:border-amber-400/20 dark:from-stone-900 dark:via-stone-900 dark:to-stone-950 dark:text-stone-100",
        compact ? "space-y-4" : "space-y-5",
        className
      )}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/30">
          <Heart className="h-5 w-5" />
        </div>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2
              className={cn(
                "font-bold tracking-tight",
                compact ? "text-xl" : "text-2xl sm:text-3xl"
              )}
            >
              {t("title")}
            </h2>
            <span className="rounded-full border border-amber-300/70 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700 dark:border-amber-400/20 dark:bg-white/5 dark:text-amber-300">
              {donationConfig.providerLabel}
            </span>
          </div>
          <p
            className={cn(
              "max-w-2xl leading-relaxed text-stone-600 dark:text-stone-300",
              compact ? "text-sm" : "text-base sm:text-lg"
            )}
          >
            {t("description", {
              amount: donationConfig.monthlyGoalEuro,
            })}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-stone-500 dark:text-stone-400">
          {t("note", { provider: donationConfig.providerLabel })}
        </p>
        <a
          href={donationUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
        >
          {t("button")}
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </section>
  );
}
