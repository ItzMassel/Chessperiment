"use client";

import { useEffect } from "react";
import { initTracking } from "@/lib/visitor";
import { trackEvent } from "@/lib/track";

export function VisitorTracker() {
  useEffect(() => {
    const { isNewVisitor, isNewSession } = initTracking();

    if (isNewVisitor) {
      trackEvent("new_visitor");
    }

    if (isNewSession) {
      trackEvent("new_session");
    }
  }, []);

  return null;
}
