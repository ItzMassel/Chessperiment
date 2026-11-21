import { CustomPiece, SquareLogicDefinition } from "./firestore";

/** A piece that starts off the board, waiting on the bench until a player drops it. */
export interface BenchPiece {
  type: string;
  color: string;
  movement?: 'run' | 'jump';
}

export interface Project {
  id?: string;
  userId: string;
  name: string;
  description?: string;
  isStarred: boolean;
  forkedFrom?: { marketplaceId: string; creatorHandle: string };
  createdAt: Date;
  updatedAt: Date;
  
  // Board configuration
  rows: number;
  cols: number;
  gridType?: 'square' | 'hex';
  activeSquares: string[];
  placedPieces: Record<string, { type: string; color: string; movement?: 'run' | 'jump' }>;
  // Pieces that are not on the board at the start (the "bench"). Order is kept; duplicates are fine.
  benchPieces?: BenchPiece[];
  
  // Custom pieces for this project
  customPieces: CustomPiece[];
  squareLogic?: Record<string, SquareLogicDefinition>;
  history?: string[];
}
