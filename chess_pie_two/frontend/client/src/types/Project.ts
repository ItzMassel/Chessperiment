import { CustomPiece, SquareLogicDefinition } from "./firestore";

export interface Project {
  id?: string;
  userId: string;
  name: string;
  description?: string;
  isStarred: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Board configuration
  rows: number;
  cols: number;
  gridType?: 'square' | 'hex';
  activeSquares: string[];
  placedPieces: Record<string, { type: string; color: string; movement?: 'run' | 'jump' }>;
  
  // Custom pieces for this project
  customPieces: CustomPiece[];
  squareLogic?: Record<string, SquareLogicDefinition>;
  history?: string[];
}
