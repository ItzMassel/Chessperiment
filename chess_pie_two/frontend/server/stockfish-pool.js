// server/stockfish-pool.ts
import path from "path";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const loadEngine = require("./loadEngine");
class StockfishPool {
    constructor() {
        this.engine = null;
        this.isInitialized = false;
        this.isProcessing = false;
        this.queue = [];
        this.initializeEngine();
    }
    initializeEngine() {
        try {
            const stockfishPath = path.join(process.cwd(), "node_modules", "stockfish", "src", "stockfish-17.1-lite-single-03e3232.js" // Use LITE version for lower memory
            );
            this.engine = loadEngine(stockfishPath);
            if (!this.engine) {
                console.error("[Stockfish Pool] Failed to load engine");
                return;
            }
            // Configure with memory limits
            this.engine.send("uci", () => {
                if (!this.engine)
                    return;
                // CRITICAL: Set hash table to 32MB (good balance for server)
                this.engine.send("setoption name Hash value 32", () => {
                    if (!this.engine)
                        return;
                    // Limit threads to 2 for better multi-game handling
                    this.engine.send("setoption name Threads value 2", () => {
                        this.isInitialized = true;
                        console.log("[Stockfish Pool] Engine initialized with memory limits");
                        this.processQueue();
                    });
                });
            });
        }
        catch (error) {
            console.error("[Stockfish Pool] Failed to initialize engine:", error);
        }
    }
    processQueue() {
        if (this.queue.length > 0 && !this.isProcessing) {
            const next = this.queue.shift();
            if (next)
                next();
        }
    }
    async getBestMove(fen, difficulty) {
        return new Promise((resolve) => {
            const executeMove = () => {
                if (!this.engine || !this.isInitialized) {
                    console.error("[Stockfish Pool] Engine not ready");
                    resolve(null);
                    this.isProcessing = false;
                    this.processQueue();
                    return;
                }
                this.isProcessing = true;
                let hasResponded = false;
                const timeout = setTimeout(() => {
                    if (!hasResponded) {
                        console.error("[Stockfish Pool] Move timeout");
                        hasResponded = true;
                        this.isProcessing = false;
                        resolve(null);
                        this.processQueue();
                    }
                }, 10000); // 10 second timeout
                const skillLevel = Math.max(0, Math.min(20, Math.floor((difficulty - 400) / 100)));
                const depth = Math.max(1, Math.min(15, Math.floor(difficulty / 150)));
                this.engine.send(`setoption name Skill Level value ${skillLevel}`, () => {
                    if (!this.engine)
                        return;
                    this.engine.send("ucinewgame", () => {
                        if (!this.engine)
                            return;
                        this.engine.send(`position fen ${fen}`, () => {
                            if (!this.engine)
                                return;
                            // Add movetime limit for safety
                            this.engine.send(`go depth ${depth} movetime 5000`, (result) => {
                                if (hasResponded)
                                    return;
                                clearTimeout(timeout);
                                hasResponded = true;
                                const match = result.match(/bestmove\s+(\S+)/);
                                const bestMove = match ? match[1] : null;
                                this.isProcessing = false;
                                resolve(bestMove && bestMove !== "(none)" ? bestMove : null);
                                this.processQueue();
                            });
                        });
                    });
                });
            };
            if (!this.isProcessing && this.isInitialized) {
                executeMove();
            }
            else {
                this.queue.push(executeMove);
            }
        });
    }
    shutdown() {
        try {
            this.engine?.quit();
        }
        catch (error) {
            console.error("[Stockfish Pool] Error shutting down:", error);
        }
    }
}
// Singleton instance
export const stockfishPool = new StockfishPool();
// Cleanup on process exit
process.on("SIGINT", () => {
    stockfishPool.shutdown();
    process.exit();
});
