import { BoardTopology, TopologyType } from './topology';
import { Square, SquareState } from './types';
import { Piece, CustomPiece } from './piece';
import { BoardClass } from './board';

/**
 * Ruleset version for forward/backward compatibility.
 * Increment when making breaking changes to the serialization format.
 */
export const RULESET_VERSION = 1;

/**
 * Serialized ruleset format - the single source of truth for game state.
 */
export interface SerializedRuleset {
    version: number;
    metadata: {
        name: string;
        description?: string;
        author?: string;
        createdAt?: string;
    };
    topology: SerializedTopology;
    pieces: SerializedPiece[];
    squareStates: Record<Square, SerializedSquareState>;
    gameState: {
        turn: 'white' | 'black';
        winner?: 'white' | 'black' | null;
    };
}

/**
 * Serialized topology - immutable board structure.
 */
export interface SerializedTopology {
    type: TopologyType;
    params: {
        // For 'rectangular': { width: number, height: number }
        // For 'hex': { radius: number }
        // For 'custom-graph': { adjacencyMap: Record<Square, Square[]> }
        [key: string]: any;
    };
}

/**
 * Serialized piece with all metadata.
 */
export interface SerializedPiece {
    id: string;
    type: string;
    color: 'white' | 'black';
    position: Square;
    hasMoved: boolean;
    
    // Custom piece data
    rules?: any[];
    logic?: any[];
    variables?: Record<string, any>;
    
    // Multi-cell shape
    shape?: {
        anchor: [number, number];
        extensions: [number, number][];
    };
}

/**
 * Serialized square state - tags, disabled status, custom properties.
 */
export interface SerializedSquareState {
    tags: string[]; // Set → Array for JSON
    disabled: boolean;
    customProps: Record<string, any>;
}

/**
 * Serialization utilities for saving/loading game state.
 */
export class GameSerializer {
    /**
     * Serialize a board to a ruleset object.
     */
    static serialize(
        board: BoardClass,
        metadata: { name: string; description?: string; author?: string }
    ): SerializedRuleset {
        // Use board topology or create default based on dimensions
        const topology = board.topology || {
            type: 'rectangular' as TopologyType,
            params: { width: board.width, height: board.height },
            bounds: { width: board.width, height: board.height }
        };
        
        const serializedTopology = this.serializeTopology(topology);
        const pieces = this.serializePieces(board);
        const squareStates = this.serializeSquareStates(board);
        
        return {
            version: RULESET_VERSION,
            metadata: {
                ...metadata,
                createdAt: new Date().toISOString()
            },
            topology: serializedTopology,
            pieces,
            squareStates,
            gameState: {
                turn: board.getTurn(),
                winner: null // TODO: track winner in board state
            }
        };
    }
    
    /**
     * Deserialize a ruleset to a board instance.
     */
    static deserialize(ruleset: SerializedRuleset): BoardClass {
        // Version check
        if (ruleset.version > RULESET_VERSION) {
            throw new Error(
                `Ruleset version ${ruleset.version} is newer than supported version ${RULESET_VERSION}. ` +
                `Please update your engine.`
            );
        }
        
        // Apply migrations if needed
        const migratedRuleset = this.migrate(ruleset);
        
        // Reconstruct topology
        const topology = this.deserializeTopology(migratedRuleset.topology);
        
        // Create board
        const gridType = migratedRuleset.topology.type === 'hex' ? 'hex' : 'square';
        const width = topology.params?.width ?? 8;
        const height = topology.params?.height ?? 8;
        const board = new BoardClass(undefined, undefined, width, height, gridType);
        
        // Set topology
        board.topology = topology;
        
        // Restore pieces
        for (const serializedPiece of migratedRuleset.pieces) {
            const piece = this.deserializePiece(serializedPiece);
            if (piece) {
                board.setPiece(piece.position, piece);
            }
        }
        
        // Restore square states
        for (const [square, state] of Object.entries(migratedRuleset.squareStates)) {
            board.setSquareState(square as Square, {
                tags: new Set(state.tags),
                disabled: state.disabled,
                customProps: state.customProps
            });
        }
        
        // Restore game state
        (board as any).turn = migratedRuleset.gameState.turn;
        
        return board;
    }
    
    /**
     * Serialize topology to JSON-friendly format.
     */
    private static serializeTopology(topology: BoardTopology): SerializedTopology {
        return {
            type: topology.type,
            params: topology.params || {}
        };
    }
    
    /**
     * Deserialize topology from JSON.
     */
    private static deserializeTopology(serialized: SerializedTopology): BoardTopology {
        return {
            type: serialized.type,
            params: serialized.params as { width: number; height: number; radius?: number } | undefined,
            bounds: serialized.params ? 
                { width: serialized.params.width || 8, height: serialized.params.height || 8 } : 
                { width: 8, height: 8 }
        };
    }
    
    /**
     * Serialize all pieces on the board.
     */
    private static serializePieces(board: BoardClass): SerializedPiece[] {
        const pieces: SerializedPiece[] = [];
        const squares = board.getSquares();
        
        for (const [square, piece] of Object.entries(squares)) {
            if (!piece) continue;
            
            const serialized: SerializedPiece = {
                id: piece.id,
                type: piece.type,
                color: piece.color,
                position: square as Square,
                hasMoved: piece.hasMoved
            };
            
            // Custom piece data
            if (piece instanceof CustomPiece) {
                serialized.rules = piece.rules;
                serialized.logic = piece.logic;
                serialized.variables = piece.variables;
                serialized.shape = piece.shape;
            }
            
            pieces.push(serialized);
        }
        
        return pieces;
    }
    
    /**
     * Deserialize a single piece.
     */
    private static deserializePiece(serialized: SerializedPiece): Piece | null {
        const piece = Piece.create(
            serialized.id,
            serialized.type,
            serialized.color,
            serialized.position,
            serialized.rules,
            serialized.logic,
            undefined // name
        );
        
        if (!piece) return null;
        
        // Set shape for custom pieces
        if (piece instanceof CustomPiece && serialized.shape) {
            piece.shape = serialized.shape;
        }
        
        piece.hasMoved = serialized.hasMoved;
        
        // Restore custom piece variables
        if (piece instanceof CustomPiece && serialized.variables) {
            piece.variables = serialized.variables;
        }
        
        return piece;
    }
    
    /**
     * Serialize all square states.
     */
    private static serializeSquareStates(board: BoardClass): Record<Square, SerializedSquareState> {
        const states: Record<Square, SerializedSquareState> = {};
        
        // Only serialize non-default states to save space
        for (const square of Object.keys(board.getSquares()) as Square[]) {
            const state = board.getSquareState(square);
            
            // Skip default states
            if (state.tags.size === 0 && !state.disabled && Object.keys(state.customProps).length === 0) {
                continue;
            }
            
            states[square] = {
                tags: Array.from(state.tags),
                disabled: state.disabled,
                customProps: state.customProps
            };
        }
        
        return states;
    }
    
    /**
     * Migrate old rulesets to the current version.
     */
    private static migrate(ruleset: SerializedRuleset): SerializedRuleset {
        let current = ruleset;
        
        // v0 → v1 migration example (if needed in future)
        // if (current.version < 1) {
        //     current = this.migrateV0ToV1(current);
        // }
        
        return current;
    }
    
    /**
     * Export ruleset as JSON string.
     */
    static toJSON(ruleset: SerializedRuleset): string {
        return JSON.stringify(ruleset, null, 2);
    }
    
    /**
     * Import ruleset from JSON string.
     */
    static fromJSON(json: string): SerializedRuleset {
        return JSON.parse(json);
    }
}
