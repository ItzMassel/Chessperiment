const VISITOR_ID_KEY = "chess_visitor_id";
const SESSION_ID_KEY = "chess_session_id";

function generateId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}

function getOrCreateStorageItem(key: string, storage: Storage): string {
  let id = storage.getItem(key);
  if (!id) {
    id = generateId();
    storage.setItem(key, id);
  }
  return id;
}

export function getVisitorId(): string {
  return getOrCreateStorageItem(VISITOR_ID_KEY, localStorage);
}

export function getSessionId(): string {
  return getOrCreateStorageItem(SESSION_ID_KEY, sessionStorage);
}

export function initTracking(): { isNewVisitor: boolean; isNewSession: boolean } {
  if (typeof window === "undefined") {
    return { isNewVisitor: false, isNewSession: false };
  }

  let isNewVisitor = false;
  let isNewSession = false;

  try {
    const existingVisitor = localStorage.getItem(VISITOR_ID_KEY);
    if (!existingVisitor) {
      localStorage.setItem(VISITOR_ID_KEY, generateId());
      isNewVisitor = true;
    }

    const existingSession = sessionStorage.getItem(SESSION_ID_KEY);
    if (!existingSession) {
      sessionStorage.setItem(SESSION_ID_KEY, generateId());
      isNewSession = true;
    }
  } catch {
    // Storage unavailable — silently ignore
  }

  return { isNewVisitor, isNewSession };
}
