/**
 * Fire-and-forget anonymous event counter.
 * No cookies, no user IDs — just increments a server-side counter.
 * Safe to call anywhere; errors are swallowed silently.
 */
export function trackEvent(
  event:
    | "play_game"
    | "open_piece_editor"
    | "open_rules_editor"
    | "open_square_editor"
    | "open_marketplace"
): void {
  fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event }),
  }).catch(() => {
    // Swallow — tracking should never affect the user experience
  });
}
