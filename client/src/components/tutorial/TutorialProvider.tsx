"use client"

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react"
import { usePathname } from "@/i18n/navigation"
import {
  TutorialState,
  TutorialAction,
  TutorialContextValue,
  StepDefinition,
} from "./types"
import { tutorialSteps } from "./steps"
import { TutorialOverlay } from "./TutorialOverlay"
import { TutorialTooltip } from "./TutorialTooltip"

const STORAGE_KEY_PREFIX = "chessperiment_tutorial_"

// Set by the "Tutorial" button on the projects overview to explicitly request
// that the tutorial starts the next time a TutorialProvider mounts. Without this
// flag the tutorial never auto-starts.
export const TUTORIAL_START_PENDING_KEY = "chessperiment_tutorial_start_pending"

function getStorageKey(projectId: string) {
  return STORAGE_KEY_PREFIX + projectId
}

function loadState(projectId: string): TutorialState | null {
  try {
    const raw = localStorage.getItem(getStorageKey(projectId))
    if (!raw) return null
    return JSON.parse(raw) as TutorialState
  } catch {
    return null
  }
}

function saveState(projectId: string, state: TutorialState) {
  try {
    localStorage.setItem(getStorageKey(projectId), JSON.stringify(state))
  } catch {
    /* localStorage unavailable */
  }
}

function reducer(state: TutorialState, action: TutorialAction): TutorialState {
  switch (action.type) {
    case "START":
      return { active: true, currentStepIndex: 0, completed: false, dismissed: false }
    case "NEXT_STEP": {
      const next = state.currentStepIndex + 1
      if (next >= action.totalSteps) {
        return { ...state, active: false, completed: true, currentStepIndex: 0 }
      }
      return { ...state, currentStepIndex: next, dismissed: false }
    }
    case "PREV_STEP":
      return {
        ...state,
        currentStepIndex: Math.max(0, state.currentStepIndex - 1),
      }
    case "DISMISS":
      return { ...state, active: false, dismissed: true }
    case "COMPLETE":
      return { ...state, active: false, completed: true, currentStepIndex: 0 }
    case "RESTORE":
      return action.state
    default:
      return state
  }
}

function createInitialState(projectId: string): TutorialState {
  const saved = loadState(projectId)
  if (saved) return saved
  return { active: false, currentStepIndex: 0, completed: false, dismissed: false }
}

function matchesNavigateTo(pathname: string, pattern: string): boolean {
  const isRegex = /[\[\]\(\)\^\$\*\+\.\|\\]/.test(pattern)
  if (isRegex) {
    try {
      return new RegExp(pattern).test(pathname)
    } catch {
      return pathname.includes(pattern)
    }
  }
  return pathname.includes(pattern)
}

const TutorialContext = createContext<TutorialContextValue | null>(null)

export function useTutorial(): TutorialContextValue {
  const ctx = useContext(TutorialContext)
  if (!ctx) {
    throw new Error("useTutorial must be used within a TutorialProvider")
  }
  return ctx
}

export function useTutorialOptional(): TutorialContextValue | null {
  return useContext(TutorialContext)
}

interface TutorialProviderProps {
  projectId: string
  children: ReactNode
}

export function TutorialProvider({ projectId, children }: TutorialProviderProps) {
  const [state, dispatch] = useReducer(reducer, projectId, createInitialState)
  const pathname = usePathname()

  const steps = tutorialSteps
  const totalSteps = steps.length

  const currentStep = useMemo<StepDefinition | null>(() => {
    if (!state.active) return null
    return steps[state.currentStepIndex] ?? null
  }, [state.active, state.currentStepIndex, steps])

  const isActive = state.active && !state.dismissed

  useEffect(() => {
    saveState(projectId, state)
  }, [state, projectId])

  // The tutorial only starts when explicitly requested via the "Tutorial" button
  // on the projects overview, which sets TUTORIAL_START_PENDING_KEY before
  // navigating into the editor. It never auto-starts on its own.
  useEffect(() => {
    try {
      if (localStorage.getItem(TUTORIAL_START_PENDING_KEY)) {
        localStorage.removeItem(TUTORIAL_START_PENDING_KEY)
        dispatch({ type: "START" })
      }
    } catch {
      /* localStorage unavailable */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!state.active || state.completed || state.dismissed) return

    const step = steps[state.currentStepIndex]
    if (!step) return

    if (step.navigateTo && matchesNavigateTo(pathname, step.navigateTo)) {
      dispatch({ type: "NEXT_STEP", totalSteps })
    }
  }, [pathname, state.active, state.completed, state.dismissed, state.currentStepIndex, steps, totalSteps])

  const handleNext = useCallback(() => {
    dispatch({ type: "NEXT_STEP", totalSteps })
  }, [totalSteps])

  const handleBack = useCallback(() => {
    dispatch({ type: "PREV_STEP" })
  }, [])

  const handleDismiss = useCallback(() => {
    dispatch({ type: "DISMISS" })
  }, [])

  const value = useMemo<TutorialContextValue>(
    () => ({
      state,
      steps,
      isActive,
      currentStep,
      goNext: handleNext,
      goBack: handleBack,
      dismiss: handleDismiss,
    }),
    [state, steps, isActive, currentStep, handleNext, handleBack, handleDismiss]
  )

  return (
    <TutorialContext.Provider value={value}>
      {children}
      <TutorialOverlay step={currentStep} isActive={isActive} />
      <TutorialTooltip
        step={currentStep}
        currentStepIndex={state.currentStepIndex}
        totalSteps={totalSteps}
        isActive={isActive}
        showBack={false}
        onNext={handleNext}
        onBack={handleBack}
        onSkip={handleDismiss}
      />
    </TutorialContext.Provider>
  )
}
