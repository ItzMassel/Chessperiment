export const donationConfig = {
  enabled: true,
  url: "buymeacoffee.com/chessperiment",
  providerLabel: "Buy Me a Coffee",
  monthlyGoalEuro: 15,
} as const;

export function getDonationUrl() {
  const url = donationConfig.url.trim();

  if (!url) {
    return "";
  }

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  return `https://${url}`;
}

export const donationReady =
  donationConfig.enabled && donationConfig.url.trim().length > 0;
