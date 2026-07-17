export function trackEvent(
  event:
    | "play_game"
    | "open_piece_editor"
    | "open_rules_editor"
    | "open_square_editor"
    | "open_marketplace"
    | "new_visitor"
    | "new_session"
): void {
  let visitorId: string | null = null;
  let sessionId: string | null = null;
  try {
    visitorId = localStorage.getItem("chess_visitor_id");
    sessionId = sessionStorage.getItem("chess_session_id");
  } catch {}

  fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, visitorId, sessionId }),
  }).catch(() => {});
}
