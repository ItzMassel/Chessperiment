import { Square } from './types';
import { toCoords, toSquare } from './utils';

/**
 * Topology type - represents the shape of the board.
 */
export type TopologyType = 'rectangular' | 'hex' | 'custom';

/**
 * Immutable board topology - represents the structural graph of the board.
 * This never changes during gameplay; all runtime state lives in SquareState.
 */
export interface BoardTopology {
    type: TopologyType;
    
    // For generated boards (rectangular/hex) - store parameters only
    params?: {
        width: number;
        height: number;
        radius?: number; // For hex boards
    };
    
    // For custom graphs only - store explicit adjacency map
    adjacencyMap?: Record<Square, Square[]>;
    
    // Rendering bounds
    bounds: {
        width: number;
        height: number;
    };
}

/**
 * Builder for creating board topologies.
 * Topologies are pure structure with no runtime state.
 */
export class TopologyBuilder {
    /**
     * Create a rectangular board topology.
     * Adjacency is computed on-the-fly, not stored.
     */
    static fromRectangular(width: number, height: number): BoardTopology {
        return {
            type: 'rectangular',
            params: { width, height },
            bounds: { width, height }
        };
    }

    /**
     * Create a hexagonal board topology.
     * Uses axial coordinates (q, r).
     */
    static fromHex(radius: number): BoardTopology {
        return {
            type: 'hex',
            params: { width: radius * 2 + 1, height: radius * 2 + 1, radius },
            bounds: { width: radius * 2 + 1, height: radius * 2 + 1 }
        };
    }

    /**
     * Create a custom graph-based topology.
     * Adjacency map is explicit and stored.
     */
    static fromCustomGraph(
        adjacencyMap: Record<Square, Square[]>,
        bounds?: { width: number; height: number }
    ): BoardTopology {
        // Calculate bounds if not provided
        if (!bounds) {
            let minX = Infinity, maxX = -Infinity;
            let minY = Infinity, maxY = -Infinity;
            
            for (const square in adjacencyMap) {
                const [x, y] = toCoords(square);
                minX = Math.min(minX, x);
                maxX = Math.max(maxX, x);
                minY = Math.min(minY, y);
                maxY = Math.max(maxY, y);
            }
            
            bounds = {
                width: maxX - minX + 1,
                height: maxY - minY + 1
            };
        }
        
        return {
            type: 'custom',
            adjacencyMap,
            bounds
        };
    }

    /**
     * Get all valid squares in a topology.
     */
    static getAllSquares(topology: BoardTopology): Square[] {
        if (topology.type === 'custom') {
            return Object.keys(topology.adjacencyMap || {}) as Square[];
        }
        
        const { width, height } = topology.params!;
        const squares: Square[] = [];
        
        if (topology.type === 'rectangular') {
            for (let x = 0; x < width; x++) {
                for (let y = 0; y < height; y++) {
                    squares.push(toSquare([x, y], true));
                }
            }
        } else if (topology.type === 'hex') {
            const radius = topology.params!.radius!;
            for (let q = -radius; q <= radius; q++) {
                for (let r = -radius; r <= radius; r++) {
                    if (Math.abs(q + r) <= radius) {
                        squares.push(`${q},${r}` as Square);
                    }
                }
            }
        }
        
        return squares;
    }
}

/**
 * Utilities for working with topologies.
 */
export class TopologyUtils {
    /**
     * Get adjacent squares for a given square in a topology.
     */
    static getAdjacent(square: Square, topology: BoardTopology): Square[] {
        // Custom topology: use explicit adjacency map
        if (topology.type === 'custom') {
            return topology.adjacencyMap?.[square] || [];
        }
        
        // Generated topologies: compute adjacency
        const [x, y] = toCoords(square);
        const useAlgebraic = !square.includes(',');
        
        if (topology.type === 'rectangular') {
            return this.getRectangularAdjacent(x, y, topology, useAlgebraic);
        } else if (topology.type === 'hex') {
            return this.getHexAdjacent(x, y, topology);
        }
        
        return [];
    }

    private static getRectangularAdjacent(
        x: number,
        y: number,
        topology: BoardTopology,
        useAlgebraic: boolean
    ): Square[] {
        const { width, height } = topology.params!;
        const adjacent: Square[] = [];
        
        // 8 directions
        const directions = [
            [-1, -1], [0, -1], [1, -1],
            [-1,  0],          [1,  0],
            [-1,  1], [0,  1], [1,  1]
        ];
        
        for (const [dx, dy] of directions) {
            const nx = x + dx;
            const ny = y + dy;
            
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                adjacent.push(toSquare([nx, ny], useAlgebraic));
            }
        }
        
        return adjacent;
    }

    private static getHexAdjacent(q: number, r: number, topology: BoardTopology): Square[] {
        const radius = topology.params!.radius!;
        const adjacent: Square[] = [];
        
        // 6 hex directions in axial coordinates
        const directions = [
            [1, 0], [1, -1], [0, -1],
            [-1, 0], [-1, 1], [0, 1]
        ];
        
        for (const [dq, dr] of directions) {
            const nq = q + dq;
            const nr = r + dr;
            
            // Check if within bounds
            if (Math.abs(nq) <= radius && Math.abs(nr) <= radius && Math.abs(nq + nr) <= radius) {
                adjacent.push(`${nq},${nr}` as Square);
            }
        }
        
        return adjacent;
    }

    /**
     * Find path between two squares using BFS.
     * Returns array of squares from 'from' to 'to' (inclusive), or null if no path.
     */
    static findPath(
        from: Square,
        to: Square,
        topology: BoardTopology,
        canJump: boolean = false,
        isBlocked?: (square: Square) => boolean
    ): Square[] | null {
        if (from === to) return [from];
        
        const queue: Square[] = [from];
        const visited = new Set<Square>([from]);
        const parent = new Map<Square, Square>();
        
        while (queue.length > 0) {
            const current = queue.shift()!;
            
            if (current === to) {
                // Reconstruct path
                const path: Square[] = [];
                let sq: Square | undefined = to;
                while (sq) {
                    path.unshift(sq);
                    sq = parent.get(sq);
                }
                return path;
            }
            
            const adjacent = this.getAdjacent(current, topology);
            for (const next of adjacent) {
                if (visited.has(next)) continue;
                
                // Check if blocked (if blocker function provided)
                if (!canJump && isBlocked && isBlocked(next)) continue;
                
                visited.add(next);
                parent.set(next, current);
                queue.push(next);
            }
        }
        
        return null; // No path found
    }

    /**
     * Get distance between two squares (minimum number of steps).
     */
    static getDistance(from: Square, to: Square, topology: BoardTopology): number {
        const path = this.findPath(from, to, topology, true);
        return path ? path.length - 1 : Infinity;
    }

    /**
     * Check if a square is valid in the topology.
     */
    static isValidSquare(square: Square, topology: BoardTopology): boolean {
        if (topology.type === 'custom') {
            return square in (topology.adjacencyMap || {});
        }
        
        const [x, y] = toCoords(square);
        const { width, height } = topology.params!;
        
        if (topology.type === 'rectangular') {
            return x >= 0 && x < width && y >= 0 && y < height;
        } else if (topology.type === 'hex') {
            const radius = topology.params!.radius!;
            return Math.abs(x) <= radius && Math.abs(y) <= radius && Math.abs(x + y) <= radius;
        }
        
        return false;
    }

    /**
     * Get all neighbors within a certain distance.
     */
    static getNeighborsInRange(
        square: Square,
        range: number,
        topology: BoardTopology
    ): Square[] {
        if (range === 0) return [square];
        
        const neighbors = new Set<Square>();
        const frontier = new Set<Square>([square]);
        
        for (let i = 0; i < range; i++) {
            const nextFrontier = new Set<Square>();
            
            for (const sq of Array.from(frontier)) {
                const adjacent = this.getAdjacent(sq, topology);
                for (const adj of adjacent) {
                    if (!neighbors.has(adj) && adj !== square) {
                        nextFrontier.add(adj);
                        neighbors.add(adj);
                    }
                }
            }
            
            frontier.clear();
            for (const sq of Array.from(nextFrontier)) {
                frontier.add(sq);
            }
        }
        
        return Array.from(neighbors);
    }
}
