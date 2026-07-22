"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StepDefinition } from "./types"
import { useElementPosition } from "./useElementPosition"

interface TutorialTooltipProps {
  step: StepDefinition | null
  currentStepIndex: number
  totalSteps: number
  isActive: boolean
  showBack: boolean
  onNext: () => void
  onBack: () => void
  onSkip: () => void
}

export function TutorialTooltip({
  step,
  currentStepIndex,
  totalSteps,
  isActive,
  showBack,
  onNext,
  onBack,
  onSkip,
}: TutorialTooltipProps) {
  const [showSolution, setShowSolution] = useState(false)
  const { rect: targetRect } = useElementPosition(
    isActive && step?.target && step.placement !== "center" ? step.target : null
  )

  if (!isActive || !step) return null

  const getTooltipStyle = (s: StepDefinition, tRect: DOMRect | null): React.CSSProperties => {
    const gap = 20
    const TW = 380
    const isMobile = window.innerWidth < 640

    const clampH = (centerX: number) =>
      Math.max(gap, Math.min(centerX, window.innerWidth - TW - gap))

    const clampV = (centerY: number) =>
      Math.max(gap, Math.min(centerY, window.innerHeight - 200))

    if (s.placement === "center" || !tRect || isMobile) {
      return {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      }
    }

    switch (s.placement) {
      case "bottom":
        return {
          position: "fixed",
          left: clampH(tRect.left + tRect.width / 2),
          top: tRect.bottom + gap,
          transform: "translateX(-50%)",
        }
      case "top":
        return {
          position: "fixed",
          left: clampH(tRect.left + tRect.width / 2),
          top: tRect.top - gap,
          transform: "translate(-50%, -100%)",
        }
      case "left":
        return {
          position: "fixed",
          right: window.innerWidth - tRect.left + gap,
          top: clampV(tRect.top + tRect.height / 2),
          transform: "translateY(-50%)",
        }
      case "right":
        return {
          position: "fixed",
          left: tRect.right + gap,
          top: clampV(tRect.top + tRect.height / 2),
          transform: "translateY(-50%)",
        }
      default:
        return {
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }
    }
  }

  const isAutoAdvance = !!step.navigateTo

  const buttonLabel =
    step.type === "explore"
      ? "Understood"
      : step.type === "action" || step.type === "action-with-solution"
        ? "Done"
        : "Next"

  return (
    <AnimatePresence>
      <motion.div
        key={`tooltip-${step.id}`}
        initial={{ opacity: 0, scale: 0.95, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -8 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="fixed z-[110] w-[380px] max-w-[calc(100vw-32px)]"
        style={getTooltipStyle(step, targetRect)}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white dark:bg-[var(--islands)] rounded-2xl border border-stone-200 dark:border-white/10 shadow-2xl overflow-hidden">
          <div className="h-1 bg-stone-100 dark:bg-white/5">
            <motion.div
              className="h-full bg-[var(--accent)]"
              initial={{ width: `${(currentStepIndex / totalSteps) * 100}%` }}
              animate={{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>

          <div className="p-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-stone-400 dark:text-stone-500">
                Step {currentStepIndex + 1} of {totalSteps}
              </span>
              <button
                onClick={onSkip}
                className="text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
              >
                Skip
              </button>
            </div>

            <h3 className="text-base font-semibold text-[var(--text)] mb-2 leading-snug">
              {step.title}
            </h3>

            <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed whitespace-pre-line">
              {step.description}
            </p>

            {step.type === "action-with-solution" && !showSolution && (
              <button
                onClick={() => setShowSolution(true)}
                className="mt-3 text-xs font-medium text-[var(--accent)] hover:underline"
              >
                Show solution
              </button>
            )}

            {showSolution && step.solution && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-3 p-3 rounded-xl bg-stone-100 dark:bg-white/5 border border-stone-200 dark:border-white/10"
              >
                <p className="text-xs text-stone-500 dark:text-stone-400 whitespace-pre-line font-mono leading-relaxed">
                  {step.solution}
                </p>
              </motion.div>
            )}

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-stone-100 dark:border-white/5">
              {isAutoAdvance ? (
                <p className="text-[11px] text-stone-400 dark:text-stone-500 italic">
                  Follows you automatically &rarr;
                </p>
              ) : (
                <div className="flex gap-2">
                  {showBack && (
                    <Button variant="outline" size="sm" onClick={onBack}>
                      Back
                    </Button>
                  )}
                </div>
              )}
              {!isAutoAdvance && (
                step.type === "explore" ? (
                  <Button size="sm" className="bg-[var(--accent)] hover:bg-[var(--accent-hover)]" onClick={onNext}>
                    {buttonLabel}
                  </Button>
                ) : (
                  <Button size="sm" onClick={onNext}>
                    {buttonLabel}
                  </Button>
                )
              )}
            </div>
          </div>

          <button
            onClick={onSkip}
            className="absolute top-3 right-3 p-1 rounded-lg text-stone-300 hover:text-stone-500 dark:hover:text-stone-300 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
