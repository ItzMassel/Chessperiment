"use client"

import { useState, useEffect, useRef } from "react"

export interface ElementPosition {
  rect: DOMRect | null
  visible: boolean
}

export function useElementPosition(selector: string | null): ElementPosition {
  const [position, setPosition] = useState<ElementPosition>({
    rect: null,
    visible: false,
  })
  const rafRef = useRef<number | null>(null)
  const prevSelectorRef = useRef<string | null>(null)

  useEffect(() => {
    if (!selector) {
      setPosition({ rect: null, visible: false })
      prevSelectorRef.current = selector
      return
    }

    function update() {
      const el = selector ? document.querySelector(selector) : null
      if (!el) {
        setPosition({ rect: null, visible: false })
        return
      }

      const rect = el.getBoundingClientRect()
      const visible =
        rect.top < window.innerHeight &&
        rect.bottom > 0 &&
        rect.left < window.innerWidth &&
        rect.right > 0

      setPosition({ rect, visible })
    }

    update()

    const el = selector ? document.querySelector(selector) : null
    const ro = new ResizeObserver(() => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(update)
    })
    const mo = new MutationObserver(() => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(update)
    })

    if (el) {
      ro.observe(el)
      mo.observe(el, { attributes: true, childList: true, subtree: true })
    }

    window.addEventListener("scroll", update, { capture: true, passive: true })
    window.addEventListener("resize", update, { passive: true })

    if (el && selector !== prevSelectorRef.current) {
      el.scrollIntoView({ block: "center", behavior: "smooth" })
    }

    prevSelectorRef.current = selector

    return () => {
      ro.disconnect()
      mo.disconnect()
      window.removeEventListener("scroll", update, { capture: true })
      window.removeEventListener("resize", update)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [selector])

  return position
}
