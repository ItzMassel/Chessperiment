import { ReactNode } from "react"

export type StepType = "info" | "action" | "action-with-solution" | "explore"

export type Placement = "top" | "bottom" | "left" | "right" | "center"

export interface StepDefinition {
  id: string
  title: string
  description: string
  placement: Placement
  type: StepType
  target?: string
  solution?: string
  navigateTo?: string
  showOverlay?: boolean
}

export interface TutorialState {
  active: boolean
  currentStepIndex: number
  completed: boolean
  dismissed: boolean
}

export type TutorialAction =
  | { type: "NEXT_STEP"; totalSteps: number }
  | { type: "PREV_STEP" }
  | { type: "START" }
  | { type: "DISMISS" }
  | { type: "COMPLETE" }
  | { type: "RESTORE"; state: TutorialState }

export interface TutorialContextValue {
  state: TutorialState
  steps: readonly StepDefinition[]
  isActive: boolean
  currentStep: StepDefinition | null
  goNext: () => void
  goBack: () => void
  dismiss: () => void
}
