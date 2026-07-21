import { StepDefinition } from "./types"

export const tutorialSteps: readonly StepDefinition[] = [
  // ── Board Setup (board-editor page) ──
  {
    id: "resize-board",
    title: "Resize Your Board",
    description:
      "Drag the edge handles to adjust your board's dimensions. Add more rows and columns for sprawling battlefields, or keep it compact for fast-paced skirmishes.",
    placement: "bottom",
    type: "action",
    target: "[data-tutorial-target='board-resize-handle']",
  },
  {
    id: "place-white",
    title: "Place White Pieces",
    description:
      "Select a piece from the palette below, then click an active square to place it. Start by positioning your white army — try a classic setup or invent something entirely new.",
    placement: "top",
    type: "action",
    target: "[data-tutorial-target='piece-panel']",
    showOverlay: false,
  },
  {
    id: "switch-to-black",
    title: "Switch to Black",
    description:
      "Toggle the color selector in the bottom panel to switch from white to black. Both sides need pieces before you can play.",
    placement: "top",
    type: "action",
    target: "[data-tutorial-target='color-toggle']",
  },
  {
    id: "place-black",
    title: "Place Black Pieces",
    description:
      "Now place your black pieces. Symmetry is optional — asymmetrical setups lead to interesting games!",
    placement: "top",
    type: "action",
    target: "[data-tutorial-target='piece-panel']",
    showOverlay: false,
  },

  // ── Transition: board-editor → piece-editor ──
  {
    id: "navigate-to-piece-editor",
    title: "Open the Piece Editor",
    description:
      "Great board! Now let's design the pieces that will fight on it. Click the Piece Editor icon (crown) in the sidebar on the right — the tutorial automatically follows you there.",
    placement: "left",
    type: "info",
    target: "[data-tutorial-target='nav-piece-editor']",
    navigateTo: "piece-editor",
  },

  // ── Piece Design (piece-editor page) ──
  {
    id: "name-piece",
    title: "Name Your Piece",
    description:
      "Every great piece needs a fitting name. Choose something that captures its role and personality — like 'Shadow Knight,' 'Arcane Rook,' or something entirely your own.",
    placement: "left",
    type: "action",
    target: "[data-tutorial-target='piece-name-input']",
  },
  {
    id: "design-white",
    title: "Design the White Version",
    description:
      "Use the pixel canvas to draw your white piece. Pick colors from the palette, adjust brush size, and paint pixel by pixel. Don't worry about perfection — you can always come back to it.",
    placement: "bottom",
    type: "action",
    target: "[data-tutorial-target='pixel-canvas']",
    showOverlay: false,
  },
  {
    id: "invert-piece",
    title: "Auto-Create the Black Version",
    description:
      "One click and the black version writes itself. The Invert tool mirrors your white design so both colors match instantly. Click it now to see the magic.",
    placement: "left",
    type: "action",
    target: "[data-tutorial-target='invert-button']",
  },
  {
    id: "switch-to-moves",
    title: "Define Movement Rules",
    description:
      "A piece without movement is just decoration. Switch to the 'Moves' tab in the sidebar to program how your piece travels across the board.",
    placement: "left",
    type: "action",
    target: "[data-tutorial-target='mode-toggle-moves']",
  },

  // ── Movement Programming (piece-editor, moves mode) ──
  {
    id: "move-rules-explained",
    title: "Understanding Move Rules",
    description:
      "Move rules are built from conditions. Each rule says: 'if these conditions are met, the move is legal (or illegal).' Conditions use coordinates — diffX and diffY describe how many squares the piece moves in each direction. Combine conditions with AND/OR to create any movement pattern.",
    placement: "center",
    type: "info",
    target: "[data-tutorial-target='move-editor']",
  },
  {
    id: "build-knight",
    title: "Build a Knight Move",
    description:
      "Let's create a knight together. Add a condition: absDiffX = 1 AND absDiffY = 2, with movement type 'Jump' (pieces can leap over obstacles). Then add a catch-all rule marked 'Illegal' so it can't go anywhere else.",
    placement: "center",
    type: "action-with-solution",
    target: "[data-tutorial-target='move-editor']",
    solution:
      "Rule 1: absDiffX = 1 AND absDiffY = 2 → Legal (Jump)\nRule 2: absDiffX = 2 AND absDiffY = 1 → Legal (Jump)\nFallback: Any → Illegal\n\nTip: 'Abs' makes the condition work in both positive and negative directions!",
  },
  {
    id: "go-advanced-logic",
    title: "Unlock Advanced Logic",
    description:
      "Ready for more power? Click the Advanced Logic button below to add triggers (on-move, on-capture) and effects (teleport, explode, win conditions). The tutorial follows you there.",
    placement: "left",
    type: "info",
    target: "[data-tutorial-target='advanced-logic-button']",
    navigateTo: "/logic",
  },

  // ── Advanced Logic (piece-editor/:id/logic page) ──
  {
    id: "triggers-explained",
    title: "Triggers & Effects",
    description:
      "Triggers fire when something happens — your piece moves, captures, or is threatened. Effects let you react: teleport to a square, explode nearby pieces, apply cooldowns, or declare victory. Drag blocks from the palette and connect them to build unique behaviors.",
    placement: "center",
    type: "info",
  },
  {
    id: "explore-advanced",
    title: "Experiment Freely",
    description:
      "Now it's your turn. Drag blocks, connect them, and see what you can create. Need help? Click the AI Assistant (sparkles icon in the sidebar) — it can answer questions, suggest logic patterns, and help debug your designs.",
    placement: "center",
    type: "explore",
    showOverlay: false,
  },

  // ── Transition: advanced logic → square-editor ──
  {
    id: "navigate-to-square-editor",
    title: "Next Up: Square Rules",
    description:
      "Let's move on to the Square Editor. Click the Square Editor icon in the sidebar to program special behaviors for individual board squares. The tutorial follows you there.",
    placement: "left",
    type: "info",
    target: "[data-tutorial-target='nav-square-editor']",
    navigateTo: "square-editor",
  },

  // ── Square Rules (square-editor page) ──
  {
    id: "square-rules-explained",
    title: "What Are Square Rules?",
    description:
      "Square rules let you program special behaviors for specific board squares. Landing on a 'lava' square? Trigger an explosion. Standing on a 'throne' square? Win the game. Each square can have its own triggers and effects, making every game unique.",
    placement: "center",
    type: "info",
  },
  {
    id: "explore-square",
    title: "Explore Square Logic",
    description:
      "Same approach as the Advanced Logic editor — drag triggers and effects onto the workspace, connect them to squares, and build interesting board interactions. The AI Assistant is here to help whenever you need it.",
    placement: "center",
    type: "explore",
    showOverlay: false,
  },

  // ── Transition: square-editor → project overview ──
  {
    id: "navigate-to-project",
    title: "Back to Your Project",
    description:
      "You've explored all the editors! Click the back arrow or the project name to return to your project overview. The tutorial follows you there for the final steps.",
    placement: "left",
    type: "info",
    target: "[data-tutorial-target='nav-project-overview']",
    navigateTo: "/editor/[^/]+$",
  },

  // ── Finishing Up (project overview) ──
  {
    id: "action-buttons",
    title: "Play, Share & Export",
    description:
      "From your project overview you can play your variant solo (Play Local), invite friends for an online match (Play with Friends), or export it to share with the community. Give your creation a try!",
    placement: "center",
    type: "info",
  },
  {
    id: "final-cta",
    title: "You're Ready!",
    description:
      "That's the full tour. If there's something you can't achieve with the tools, we'd love to hear about it — join our Discord, report ideas on GitHub, or use the feedback form. Now go create something amazing — have fun!",
    placement: "center",
    type: "info",
  },
]
