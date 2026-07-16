# Archived Playing Logic

This directory contains legacy code for the custom board and piece "Play" functionality.

## Contents

- `game/`: The original gameplay UI and components (e.g., `Board.tsx`).
- `logic/LogicRunner.ts`: The core movement and trigger evaluation engine for custom pieces.
- `lib_socket.ts`: Original socket.io handlers for online multiplayer.

## Why it was archived

The application has transitioned to a **Project-Based Architecture**. The legacy playing code was designed around the older `SavedBoard` and `PieceSet` data models. To maintain a clean codebase during the redesign, these components have been moved here for preservation.

## Future Re-integration

When the "Play" feature is ready to be updated for the new `Project` data model:

1. Refactor `Board.tsx` to accept a `Project` object instead of a `roomId` or legacy FEN/board data.
2. Update `LogicRunner.ts` to utilize pieces stored within the project structure.
3. Re-integrate socket handlers to support project-scoped games.

Ensure all imports are updated from `@/app/[locale]/game/...` or `@/engine/logic/...` to their new locations if reused.
