"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useElementPosition } from "./useElementPosition"
import { StepDefinition } from "./types"

interface TutorialOverlayProps {
  step: StepDefinition | null
  isActive: boolean
}

export function TutorialOverlay({ step, isActive }: TutorialOverlayProps) {
  const { rect: targetRect } = useElementPosition(
    isActive && step?.target ? step.target : null
  )

  if (!isActive || !step) return null

  if (step.showOverlay === false) return null

  const hasTarget = step.target && targetRect

  if (!hasTarget || step.placement === "center") {
    return (
      <AnimatePresence>
        <motion.div
          key="overlay-simple"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] bg-black/50 pointer-events-auto"
        />
      </AnimatePresence>
    )
  }

  const padding = 12
  const t = Math.max(0, targetRect.top - padding)
  const b = Math.min(window.innerHeight, targetRect.bottom + padding)
  const l = Math.max(0, targetRect.left - padding)
  const r = Math.min(window.innerWidth, targetRect.right + padding)

  return (
    <AnimatePresence>
      <motion.div
        key={`overlay-spotlight-${step.id}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[100] pointer-events-none"
      >
        <div
          className="absolute left-0 right-0 top-0 bg-black/60 pointer-events-auto"
          style={{ height: t }}
        />
        <div
          className="absolute left-0 right-0 bottom-0 bg-black/60 pointer-events-auto"
          style={{ height: `calc(100vh - ${b}px)` }}
        />
        <div
          className="absolute bg-black/60 pointer-events-auto"
          style={{ top: t, left: 0, width: l, height: b - t }}
        />
        <div
          className="absolute bg-black/60 pointer-events-auto"
          style={{ top: t, right: 0, width: `calc(100vw - ${r}px)`, height: b - t }}
        />

        <motion.div
          key={`pulse-${step.id}`}
          className="absolute pointer-events-none"
          initial={{ opacity: 0.3 }}
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          style={{
            top: t - 2,
            left: l - 2,
            width: r - l + 4,
            height: b - t + 4,
            borderRadius: 14,
            border: "2px solid var(--accent)",
          }}
        />
      </motion.div>
    </AnimatePresence>
  )
}
