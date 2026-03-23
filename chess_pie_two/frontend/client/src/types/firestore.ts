export interface GameResult {
    userId: string
    result: "win" | "loss" | "draw"
    opponent?: string
    timestamp: Date
    roomId?: string
    id?: string
}

export interface UserStats {
    userId: string
    gamesPlayed: number
    wins: number
    losses: number
    draws: number
    rating: number
}

export interface SavedBoard {
    id?: string
    userId: string
    name: string
    description?: string
    isStarred: boolean
    projectId?: string // Reference to parent project (new architecture)
    forkedFrom?: { marketplaceId: string; creatorHandle: string }
    
    // Topology (NEW)
    topologyType?: 'rectangular' | 'hex' | 'custom-graph'
    topologyParams?: {
        // For rectangular: { width: number, height: number }
        // For hex: { radius: number }
        // For custom-graph: { adjacencyMap: Record<string, string[]> }
        [key: string]: any
    }
    
    // Legacy fields (for backward compatibility)
    rows: number
    cols: number
    gridType?: 'square' | 'hex'
    activeSquares: string[] // Legacy used a list of square IDs or similar
    placedPieces: Record<string, { type: string; color: string }>
    
    // Square states (NEW)
    squareStates?: Record<string, {
        tags: string[]
        disabled: boolean
        customProps: Record<string, any>
    }>
    
    // Versioning (NEW)
    version?: number
    
    createdAt: Date
    updatedAt: Date
}

export interface PieceSet {
    id?: string
    userId: string
    name: string
    description?: string
    isStarred: boolean
    projectId?: string // Reference to parent project (new architecture)
    forkedFrom?: { marketplaceId: string; creatorHandle: string }
    createdAt: Date
    updatedAt: Date
}

export interface CustomPiece {
    id?: string
    setId: string // Reference to parent set (legacy)
    projectId?: string // Reference to parent project (new architecture)
    userId: string
    name: string
    description?: string
    pixelsWhite: string[][] // Grid for white version
    pixelsBlack: string[][] // Grid for black version
    imageWhite?: string // Non-pixelated image for white version
    imageBlack?: string // Non-pixelated image for black version
    moves: any[] // Move logic
    logic?: any // Logic blocks (triggers/effects)
    variables?: { id: string, name: string }[] // Custom variable definitions
    
    // Multi-cell shape (NEW)
    shape?: {
        anchor: [number, number]
        extensions: [number, number][]
    }
    
    createdAt: Date
    updatedAt: Date
    color?: string // Legacy
    pixels?: string[][] // Legacy
}

export interface SquareLogicDefinition {
    id?: string;
    projectId: string;
    userId: string;
    squareId: string; // The coordinate or ID of the square
    logic: any[]; // Logic blocks
    variables?: { id: string, name: string, value: any }[]; // Local variables
    createdAt: Date;
    updatedAt: Date;
}
