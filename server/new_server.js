import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import { Chess } from "chess.js";
import path from "path";
import { createRequire } from "module";
import * as os from "os";
import { fileURLToPath } from "url";
import { createClient } from "redis";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);
// Engine imports - BoardClass, Piece, and EngineGame are used for custom game logic
import { BoardClass } from "./engine/board.js";
import { Piece } from "./engine/piece.js";
import { EngineGame } from "./engine/game.js";

// Import Stockfish pool for efficient engine management
import { stockfishPool } from "./stockfish-pool.js";

// Redis client initialization (optional for development)
let redisClient = null;
let redisEnabled = false;

async function initRedis() {
  return new Promise((resolve) => {
    let client = null;
    let timeoutReached = false;
    let connectionSucceeded = false;

    const timeout = setTimeout(() => {
      timeoutReached = true;
      if (!connectionSucceeded) {
        console.warn(
          "⚠️  Redis connection timeout - running without persistence. Multiplayer matchmaking will be disabled.",
        );
        console.warn(
          "   For full functionality, start Redis: docker run -d -p 6379:6379 redis",
        );
        // Disconnect the client if still trying
        if (client) {
          try {
            client.disconnect().catch(() => {});
          } catch (e) {}
        }
        resolve(false);
      }
    }, 3000); // 3 second timeout

    (async () => {
      try {
        client = createClient({
          url: process.env.REDIS_URL || "redis://localhost:6379",
        });

        client.on("error", (err) => {
          // Suppress error logs - we'll handle connection failure gracefully
          if (!timeoutReached && !redisEnabled) {
            // Only log the first error
            console.debug("Redis connection attempt failed");
          }
        });

        await client.connect();
        connectionSucceeded = true;

        if (!timeoutReached) {
          clearTimeout(timeout);
          redisClient = client;
          redisEnabled = true;
          console.log("✅ Connected to Redis");
          resolve(true);
        } else {
          // Connection succeeded after timeout - disconnect it
          try {
            await client.disconnect();
          } catch (e) {}
          resolve(false);
        }
      } catch (err) {
        if (!timeoutReached) {
          clearTimeout(timeout);
          console.warn(
            "⚠️  Redis not available - running without persistence. Multiplayer matchmaking will be disabled.",
          );
          console.warn(
            "   For full functionality, start Redis: docker run -d -p 6379:6379 redis",
          );
          resolve(false);
        }
      }
    })();
  });
}

await initRedis();

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  maxHttpBufferSize: 1e8, // 100 MB for custom assets
});
class Game {
  constructor(creatorPlayerId, customData = null) {
    this.roomId = uuidv4().substring(0, 8).trim().toUpperCase();
    this.players = { white: creatorPlayerId };
    this.status = "waiting";
    this.board_fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    this.history = [];
    this.chatMessages = [];
    this.pendingMove = null;
    this.rematchRequests = [];
    this.lastActivity = Date.now(); // Track last activity for cleanup
    this.customData = customData;
    this.isCustom = !!customData;
    this.turn = "w"; // Track turn for custom games
    this.engine = null; // BoardClass instance for custom games
    this.gameEngine = null; // Game engine wrapper for custom games
    this.boardState = null; // Serialized board state for custom games

    if (this.isCustom && this.customData) {
      this.initializeEngine();
    }
  }

  initializeEngine() {
    try {
      const data = this.customData;
      const placedPieces = data.placedPieces || {};
      const customPieces = data.customPieces || [];
      const boardHeight = data.rows || 8;

      // Convert coordinate-format positions to algebraic notation (e.g. "4,1" → "e7")
      const toAlgebraic = (coord) => {
        if (typeof coord !== 'string' || !coord.includes(',')) return coord;
        const [x, y] = coord.split(',').map(Number);
        const file = String.fromCharCode(97 + x);
        const rank = boardHeight - y;
        return `${file}${rank}`;
      };

      // Build lookup for custom piece definitions (match by id, type, or name)
      const customDefMap = new Map();
      for (const cp of customPieces) {
        if (cp.id) customDefMap.set(cp.id, cp);
        if (cp.type) customDefMap.set(cp.type, cp);
        if (cp.name && cp.name !== cp.type) customDefMap.set(cp.name, cp);
      }

      // Deserialize placedPieces into proper Piece instances with normalized positions
      const initialSquares = {};
      for (const [sq, pData] of Object.entries(placedPieces)) {
        const normalizedSq = toAlgebraic(sq);
        const pieceId = `${normalizedSq}_${pData.color}_${pData.type}`;
        const customDef = customDefMap.get(pData.type) || customDefMap.get(pData.id);

        const rules = customDef ? (customDef.rules || customDef.moves || []) : [];
        const logic = customDef ? (customDef.logic || []) : [];
        const name = customDef ? (customDef.name || pData.type) : pData.type;

        const piece = Piece.create(pieceId, pData.type, pData.color, normalizedSq, rules, logic, name);
        if (piece) {
          initialSquares[normalizedSq] = piece;
        }
      }

      // Normalize active squares from coordinate to algebraic notation
      const rawActiveSquares = data.activeSquares || [];
      const normalizedActiveSquares = rawActiveSquares.map(sq => toAlgebraic(sq));

      // Normalize square logic keys from coordinate to algebraic notation
      const rawSquareLogic = data.squareLogic || {};
      const normalizedSquareLogic = {};
      for (const [sqId, def] of Object.entries(rawSquareLogic)) {
        normalizedSquareLogic[toAlgebraic(sqId)] = def;
      }

      const board = new BoardClass(
        Object.keys(initialSquares).length > 0 ? initialSquares : undefined,
        normalizedActiveSquares.length > 0 ? normalizedActiveSquares : undefined,
        data.cols || 8,
        boardHeight,
        data.gridType || "square",
        Object.keys(normalizedSquareLogic).length > 0 ? normalizedSquareLogic : {}
      );

      this.engine = board;
      this.gameEngine = new EngineGame(board);
      console.log(`[Engine] Initialized custom board for room ${this.roomId} with ${Object.keys(initialSquares).length} pieces`);
    } catch (err) {
      console.error(
        `[Engine] Failed to initialize for room ${this.roomId}:`,
        err,
      );
    }
  }

  addPlayer(playerId) {
    if (!this.players.black) {
      this.players.black = playerId;
    }
  }
  getColorForPlayer(playerId) {
    if (this.players.white === playerId) return "w";
    if (this.players.black === playerId) return "b";
    return null;
  }
  updateActivity() {
    this.lastActivity = Date.now();
  }
}
const games = new Map();
const playerToRoom = new Map();

// Redis helpers
async function saveGame(game) {
  if (!game || !game.roomId || !redisEnabled || !redisClient) return;
  try {
    const gameData = JSON.stringify({
      roomId: game.roomId,
      players: game.players,
      status: game.status,
      board_fen: game.board_fen,
      history: game.history,
      chatMessages: game.chatMessages,
      pendingMove: game.pendingMove,
      rematchRequests: game.rematchRequests || [],
      customData: game.customData,
      isCustom: game.isCustom,
      turn: game.turn,
    });
    await redisClient.set(`game:${game.roomId}`, gameData, {
      EX: 3600 * 24, // Expire after 24 hours
    });
  } catch (err) {
    console.error("Error saving game to Redis:", err);
  }
}

async function getGame(roomId) {
  if (games.has(roomId)) return games.get(roomId);
  if (!redisEnabled || !redisClient) return null;
  try {
    const data = await redisClient.get(`game:${roomId}`);
    if (data) {
      const parsed = JSON.parse(data);
      const game = new Game(parsed.players.white, parsed.customData);
      Object.assign(game, parsed);

      // Ensure engine is initialized if it's a custom game
      if (game.isCustom && game.customData && !game.gameEngine) {
        game.initializeEngine();
      }

      games.set(roomId, game);
      // Re-map players
      if (game.players.white) playerToRoom.set(game.players.white, roomId);
      if (game.players.black) playerToRoom.set(game.players.black, roomId);
      return game;
    }
  } catch (err) {
    console.error("Error getting game from Redis:", err);
  }
  return null;
}

const socketToPlayer = new Map();
const playerToSocket = new Map();

// Redis search queue helper
async function addToSearchQueue(playerId) {
  if (!redisEnabled || !redisClient) {
    console.warn("Matchmaking disabled - Redis not available");
    return;
  }
  try {
    await redisClient.rPush("searchQueue", playerId);
  } catch (err) {
    console.error("Error adding to search queue:", err);
  }
}

async function removeFromQueue(playerId) {
  if (!redisEnabled || !redisClient) return;
  try {
    // Note: LREM removes occurrences. 0 means all.
    await redisClient.lRem("searchQueue", 0, playerId);
    console.log("Removed player from search queue:", playerId);
    const sid = playerToSocket.get(playerId);
    if (sid) io.to(sid).emit("search_cancelled");
  } catch (err) {
    console.error("Error removing from search queue:", err);
  }
}

async function matchmake() {
  if (!redisEnabled || !redisClient) return;
  try {
    const queueLen = await redisClient.lLen("searchQueue");
    if (queueLen < 2) return;

    const p1 = await redisClient.lPop("searchQueue");
    const p2 = await redisClient.lPop("searchQueue");

    if (!p1 || !p2) {
      if (p1) await redisClient.rPush("searchQueue", p1);
      if (p2) await redisClient.rPush("searchQueue", p2);
      return;
    }

    const s1Id = playerToSocket.get(p1);
    const s2Id = playerToSocket.get(p2);
    const socket1 = s1Id ? io.sockets.sockets.get(s1Id) : null;
    const socket2 = s2Id ? io.sockets.sockets.get(s2Id) : null;

    if (!socket1) {
      await redisClient.rPush("searchQueue", p2);
      return;
    }
    if (!socket2) {
      await redisClient.rPush("searchQueue", p1);
      return;
    }

    const game = new Game(p1);
    game.addPlayer(p2);
    game.status = "playing";
    games.set(game.roomId, game);
    await saveGame(game);
    await savePlayerRoom(p1, game.roomId);
    await savePlayerRoom(p2, game.roomId);

    const p1IsWhite = Math.random() > 0.5;
    if (!p1IsWhite) {
      game.players.white = p2;
      game.players.black = p1;
      await saveGame(game);
    }

    socket1.join(game.roomId);
    socket2.join(game.roomId);

    io.to(s1Id).emit("match_found", {
      roomId: game.roomId,
      color: p1IsWhite ? "white" : "black",
      fen: game.board_fen,
      status: "playing",
    });
    io.to(s2Id).emit("match_found", {
      roomId: game.roomId,
      color: p1IsWhite ? "black" : "white",
      fen: game.board_fen,
      status: "playing",
    });

    // Check if more can be matched
    matchmake();
  } catch (err) {
    console.error("Error in matchmaking:", err);
  }
}

const checkGameStatus = (game) => {
  try {
    if (!game) return false;
    const chess = new Chess(game.board_fen);
    if (chess.isCheckmate()) {
      const winner = chess.turn() === "w" ? "Black" : "White";
      game.status = "ended";
      return {
        gameInfo: `Checkmate! ${winner} wins!`,
        result: chess.turn() === "w" ? "b" : "w",
      };
    }
    if (chess.isStalemate()) {
      game.status = "ended";
      return { gameInfo: "Draw by Stalemate", result: "0" };
    }
    if (chess.isThreefoldRepetition()) {
      game.status = "ended";
      return { gameInfo: "Draw by Repetition", result: "0" };
    }
    if (chess.isInsufficientMaterial()) {
      game.status = "ended";
      return { gameInfo: "Draw by Insufficient Material", result: "0" };
    }
    if (chess.isDraw()) {
      game.status = "ended";
      return { gameInfo: "Draw", result: "0" };
    }
    if (chess.isCheck()) {
      return { gameInfo: "Check!", result: "playing" };
    }
    return false;
  } catch (e) {
    console.error("checkGameStatus error:", e);
    return false;
  }
};

// Redis mapping helper
async function savePlayerRoom(playerId, roomId) {
  playerToRoom.set(playerId, roomId);
  if (!redisEnabled || !redisClient) return;
  try {
    await redisClient.set(`playerRoom:${playerId}`, roomId, {
      EX: 3600 * 24,
    });
  } catch (err) {
    console.error("Error saving playerRoom to Redis:", err);
  }
}

async function getPlayerRoom(playerId) {
  if (playerToRoom.has(playerId)) return playerToRoom.get(playerId);
  if (!redisEnabled || !redisClient) return null;
  try {
    const roomId = await redisClient.get(`playerRoom:${playerId}`);
    if (roomId) {
      playerToRoom.set(playerId, roomId);
      return roomId;
    }
  } catch (err) {
    console.error("Error getting playerRoom from Redis:", err);
  }
  return null;
}

io.on("connection", (socket) => {
  console.log("connected:", socket.id);
  // --- Server-Side Stockfish (POOLED - MEMORY EFFICIENT) ---
  socket.on("request_computer_move", async (data) => {
    console.log("Requested computer move");
    const { roomId, difficulty } = data;
    const playerId = socketToPlayer.get(socket.id);

    // SECURITY: Get state from server, NOT from client FEN
    const game = roomId ? await getGame(roomId) : null;

    if (!game) {
      console.error(`[Stockfish] Unauthorized or invalid room: ${roomId}`);
      return;
    }

    game.updateActivity();

    if (game.status !== "playing") {
      console.warn(`[Stockfish] Game not in progress: ${game.status}`);
      return;
    }

    // Verify it's actually the computer's turn
    const chess = new Chess(game.board_fen);
    const playerColor = game.getColorForPlayer(playerId);
    if (chess.turn() === playerColor) {
      console.warn(
        `[Stockfish] Computer move requested for room ${roomId} but it's ${playerColor}'s turn!`,
      );
      return;
    }

    console.log(
      `[Stockfish] Starting engine thinking for Room: ${roomId} (Diff: ${difficulty})`,
    );

    try {
      const bestMove = await stockfishPool.getBestMove(
        game.board_fen,
        difficulty,
      );

      if (bestMove) {
        console.log(
          `[Stockfish] Engine suggested move: ${bestMove} for Room: ${roomId}`,
        );

        // Apply the move to the server-side game state
        const chess = new Chess(game.board_fen);
        const moveResult = chess.move({
          from: bestMove.substring(0, 2),
          to: bestMove.substring(2, 4),
          promotion: bestMove.length > 4 ? bestMove.substring(4, 5) : "q",
        });

        if (moveResult) {
          game.board_fen = chess.fen();
          game.history.push(moveResult.san);

          const status = checkGameStatus(game);
          await saveGame(game);

          // Broadcast the move to everyone in the room
          io.to(roomId).emit("move", {
            from: moveResult.from,
            to: moveResult.to,
            promotion: moveResult.promotion,
            san: moveResult.san,
            fen: game.board_fen,
            gameStatus: game.status,
          });

          if (game.status === "ended" && status) {
            io.to(roomId).emit("game_ended", {
              reason: status.gameInfo,
              result: status.result,
              status: "ended",
            });
          }
        }

        socket.emit("computer_move_result", { bestMove });
      } else {
        socket.emit("computer_move_result", { bestMove: null });
      }
    } catch (error) {
      console.error("[Stockfish] Error processing move:", error);
      socket.emit("computer_move_result", { bestMove: null });
    }
  });

  socket.on("find_match", async () => {
    const playerId = socketToPlayer.get(socket.id);
    if (!playerId) return;
    console.log("Quick search requested from socket:", socket.id);
    console.log("✅ Player entered quick search:", playerId);
    await addToSearchQueue(playerId);
    socket.emit("quick_search_started");
    matchmake();
  });

  socket.on("cancel_search", async () => {
    const playerId = socketToPlayer.get(socket.id);
    if (playerId) await removeFromQueue(playerId);
  });

  socket.on("register_player", async (data) => {
    console.log("📥 register_player event received:", data);
    const playerId = data.playerId;
    const oldPlayerId = socketToPlayer.get(socket.id);
    if (oldPlayerId && oldPlayerId !== playerId) {
      console.log(
        `🔄 Identity transfer on socket ${socket.id}: ${oldPlayerId} -> ${playerId}`,
      );
      const roomId = await getPlayerRoom(oldPlayerId);
      if (roomId) {
        const game = await getGame(roomId);
        if (game) {
          if (game.players.white === oldPlayerId) game.players.white = playerId;
          if (game.players.black === oldPlayerId) game.players.black = playerId;
          await saveGame(game);
          await savePlayerRoom(playerId, roomId);
          playerToRoom.delete(oldPlayerId);
          if (redisEnabled && redisClient) {
            await redisClient.del(`playerRoom:${oldPlayerId}`);
          }
        }
      }
      // Note: searchQueue is now managed in Redis, not in-memory
    }
    const currentActiveSocket = playerToSocket.get(playerId);
    if (currentActiveSocket && currentActiveSocket !== socket.id) {
      socketToPlayer.delete(currentActiveSocket);
    }
    socketToPlayer.set(socket.id, playerId);
    playerToSocket.set(playerId, socket.id);
    console.log(
      `[Register] Player ${playerId} registered on socket ${socket.id}. Active games: ${games.size}`,
    );
    const roomId = await getPlayerRoom(playerId);
    if (roomId) {
      const game = await getGame(roomId);
      if (game && game.status !== "ended") {
        socket.join(roomId);
        const color = game.getColorForPlayer(playerId);
        console.log(
          `[Rejoin] Found room ${roomId} for player ${playerId}. Color: ${color}`,
        );
        socket.emit("rejoin_game", {
          roomId,
          color: color === "w" ? "white" : color === "b" ? "black" : "",
          fen: game.board_fen,
          status: game.status,
          history: game.history,
          chatMessages: game.chatMessages,
          customData: game.customData,
          isCustom: game.isCustom,
          turn: game.turn,
        });
      }
    }
  });

  socket.on("offer_draw", async () => {
    const playerId = socketToPlayer.get(socket.id);
    const roomId = playerId ? await getPlayerRoom(playerId) : null;
    if (roomId) socket.to(roomId).emit("draw_offered", { from: playerId });
  });
  socket.on("accept_draw", async () => {
    const playerId = socketToPlayer.get(socket.id);
    const roomId = playerId ? await getPlayerRoom(playerId) : null;
    const game = roomId ? await getGame(roomId) : null;
    if (game && game.status === "playing") {
      game.status = "ended";
      await saveGame(game);
      io.to(roomId).emit("game_ended", {
        reason: "Draw Accepted",
        result: "0",
        status: "ended",
      });
    }
  });
  socket.on("decline_draw", async () => {
    const playerId = socketToPlayer.get(socket.id);
    const roomId = playerId ? await getPlayerRoom(playerId) : null;
    if (roomId) socket.to(roomId).emit("draw_declined");
  });

  socket.on("request_fen", async () => {
    const playerId = socketToPlayer.get(socket.id);
    const roomId = playerId ? await getPlayerRoom(playerId) : null;
    const game = roomId ? await getGame(roomId) : null;
    if (game) socket.emit("receive_fen", { board_fen: game.board_fen });
  });
  socket.on("request_history", async () => {
    const playerId = socketToPlayer.get(socket.id);
    const roomId = playerId ? await getPlayerRoom(playerId) : null;
    const game = roomId ? await getGame(roomId) : null;
    if (game) socket.emit("receive_history", { history: game.history });
  });
  socket.on("request_game_status", async (callback) => {
    const playerId = socketToPlayer.get(socket.id);
    const roomId = playerId ? await getPlayerRoom(playerId) : null;
    const game = roomId ? await getGame(roomId) : null;
    if (game) callback(game.status);
  });

  socket.on("create_room", async (data) => {
    console.log("📥 create_room event received");
    const playerId = socketToPlayer.get(socket.id);
    console.log("Player ID:", playerId, "Socket ID:", socket.id);

    if (!playerId) {
      console.error("❌ No player ID found for socket");
      return;
    }

    await removeFromQueue(playerId);
    const game = new Game(playerId);

    // Use client-provided roomId if present — this makes shareable room codes work
    if (data && data.roomId) {
      const provided = data.roomId.trim().toUpperCase().substring(0, 12);
      if (provided.length >= 4) {
        game.roomId = provided;
      }
    }

    // Handle Custom Game Data
    if (data && data.customData) {
      console.log("🎮 Creating custom game with data");
      game.customData = data.customData;
      game.isCustom = true;
      // Optionally set initial FEN/turn if provided, otherwise default
      if (data.initialFen) game.board_fen = data.initialFen;

      // Initialize the engine now that we have customData
      game.initializeEngine();
    }

    games.set(game.roomId.toUpperCase(), game);
    await saveGame(game);
    await savePlayerRoom(playerId, game.roomId);
    socket.join(game.roomId);

    console.log("✅ Room created:", game.roomId, "isCustom:", game.isCustom);
    socket.emit("room_created", {
      roomId: game.roomId,
      color: "white",
      isCustom: game.isCustom,
      customData: game.customData || null,
    });
    console.log("📤 room_created event emitted");
  });

  socket.on("join_room", async (data) => {
    let playerId = socketToPlayer.get(socket.id);
    if (!playerId && data.pId) {
      playerId = data.pId;
      console.log(
        `[Join Room] Lazy-registering player ${playerId} on socket ${socket.id}`,
      );
      socketToPlayer.set(socket.id, playerId);
      playerToSocket.set(playerId, socket.id);
    }

    if (!playerId || !data.roomId) {
      socket.emit("error", {
        message: "Player not registered or no room ID provided",
      });
      return;
    }
    const roomId = data.roomId.trim().toUpperCase();

    // Handle computer games - Create a persistent server-side game object
    if (data.isComputer || roomId.startsWith("COMPUTER-")) {
      const compRoomId = roomId.startsWith("COMPUTER-")
        ? roomId
        : `COMPUTER-${playerId}`;

      let game = await getGame(compRoomId);

      // If no game exists OR if it was already ended OR if forced new
      // This ensures "Play Again" or fresh starts work correctly for Stockfish.
      if (!game || game.status === "ended" || data.forceNew) {
        console.log(
          `[Computer Game] Initializing fresh state for Room: ${compRoomId} (forceNew: ${data.forceNew})`,
        );
        game = new Game(playerId);
        game.roomId = compRoomId;
        game.players.black = "STOCKFISH";
        game.status = "playing";
        games.set(compRoomId, game);
      } else {
        console.log(
          `[Computer Game] Resuming existing game for Room: ${compRoomId}`,
        );
        // Ensure the current socket player is mapped to this room's white player
        if (compRoomId.includes(playerId)) {
          game.players.white = playerId;
        }
      }

      await saveGame(game);
      await savePlayerRoom(playerId, compRoomId);
      socket.join(compRoomId);
      socket.emit("joined_room", { roomId: compRoomId, color: "white" });

      // If rejoining, send current state
      if (game.history.length > 0) {
        socket.emit("rejoin_game", {
          roomId: compRoomId,
          color: "white",
          fen: game.board_fen,
          status: game.status,
          history: game.history,
          chatMessages: game.chatMessages,
          customData: game.customData,
          isCustom: game.isCustom,
        });
      }
      return;
    }

    const game = await getGame(roomId);
    console.log(
      `[Join Room Request] Room: ${roomId}, Player: ${playerId}. Game found: ${!!game}`,
    );
    if (!game) {
      console.log(
        `[Join Room] Room ${roomId} not found for player ${playerId}`,
      );
      socket.emit("room_not_found", { roomId });
      return;
    }
    const existingColor = game.getColorForPlayer(playerId);
    if (existingColor) {
      console.log(
        `[Join Room] Player ${playerId} already in room ${roomId}. Sending rejoin.`,
      );
      await savePlayerRoom(playerId, roomId);
      socket.join(roomId);
      socket.emit("rejoin_game", {
        roomId,
        color: existingColor === "w" ? "white" : "black",
        fen: game.board_fen,
        status: game.status,
        history: game.history,
        chatMessages: game.chatMessages,
        customData: game.customData,
        isCustom: game.isCustom,
        turn: game.turn,
      });
      return;
    }
    if (game.players.white && game.players.black) {
      console.log(
        `[Join Room] Room ${roomId} is full. Player ${playerId} joining as spectator.`,
      );
      socket.join(roomId);
      socket.emit("rejoin_game", {
        roomId,
        color: "",
        fen: game.board_fen,
        status: game.status,
        history: game.history,
        chatMessages: game.chatMessages,
        customData: game.customData,
        isCustom: game.isCustom,
        turn: game.turn,
        boardState:
          game.isCustom && game.engine ? game.engine.getSnapshot() : null,
      });
      return;
    }
    game.addPlayer(playerId);
    await saveGame(game);
    await savePlayerRoom(playerId, roomId);
    socket.join(roomId);
    await removeFromQueue(playerId);
    socket.emit("joined_room", {
      roomId,
      color: "black",
      customData: game.customData,
      isCustom: game.isCustom,
      boardState:
        game.isCustom && game.engine ? game.engine.getSnapshot() : null,
    });
    if (game.players.white && game.players.black) {
      game.status = "playing";
      await saveGame(game);
      io.to(roomId).emit("start_game", {
        roomId,
        fen: game.board_fen,
        status: "playing",
        customData: game.customData,
        isCustom: game.isCustom,
        boardState:
          game.isCustom && game.engine ? game.engine.getSnapshot() : null,
      });
    }
  });

  // Single-shot room probe (used by BoardRouter to decide standard vs custom rendering)
  socket.on("probe_room", async (data, callback) => {
    const playerId = socketToPlayer.get(socket.id);
    if (!playerId || !data?.roomId) { if (callback) callback(null); return; }
    const game = await getGame(data.roomId.trim().toUpperCase());
    if (!game) { if (callback) callback(null); return; }
    const color = game.getColorForPlayer(playerId);
    if (callback) callback({
      isCustom: !!game.isCustom,
      customData: game.customData || null,
      fen: game.board_fen,
      color: color ? (color === "w" ? "white" : "black") : "",
      boardState: game.isCustom && game.engine ? game.engine.getSnapshot() : null,
    });
  });

  socket.on("move", async (data) => {
    let playerId = socketToPlayer.get(socket.id);
    if (!playerId && data.pId) {
      playerId = data.pId;
      socketToPlayer.set(socket.id, playerId);
      playerToSocket.set(playerId, socket.id);
    }
    const roomId = playerId ? await getPlayerRoom(playerId) : null;
    const game = roomId ? await getGame(roomId) : null;
    if (!game || game.status !== "playing") return;
    const color = game.getColorForPlayer(playerId);
    if (!color) return;

    try {
      // --- CUSTOM GAME LOGIC ---
      if (game.isCustom) {
        console.log(`[Custom Move] Room ${roomId}, Player ${playerId}, Color ${color}, Move ${data.from}->${data.to}`);

        if (!game.gameEngine) {
          console.error(`[Custom Move] No engine for room ${roomId} — reinitializing`);
          game.initializeEngine();
        }

        if (game.gameEngine) {
          const boardTurn = game.gameEngine.getBoard().getTurn();
          console.log(`[Custom Move] Engine turn: ${boardTurn}, game.turn: ${game.turn}`);
        } else {
          console.error(`[Custom Move] STILL no engine after reinit!`);
        }

        const expectedTurn =
          game.turn ||
          (game.gameEngine
            ? game.gameEngine.getBoard().getTurn() === "white"
              ? "w"
              : "b"
            : "w");
        console.log(`[Custom Move] Expected turn: ${expectedTurn}, Player color: ${color}`);
        if (color !== expectedTurn) {
          console.warn(
            `[Custom Move Rejected] Wrong turn. Expected ${expectedTurn}, Got ${color}`,
          );
          socket.emit("error", { message: "Not your turn" });
          return;
        }

        if (!game.gameEngine) {
          console.error(`[Custom Move] No gameEngine, accepting move blindly`);
          socket.emit("error", { message: "Server not ready" });
          return;
        }

        console.log(`[Custom Move] Checking board.getPiece(${data.from}):`, game.gameEngine.getBoard().getPiece(data.from) ? 'found' : 'NOT FOUND');
        console.log(`[Custom Move] Active squares count:`, game.gameEngine.getBoard().stateManager.activeSquares?.size || 'all');
        console.log(`[Custom Move] isActive(${data.to}):`, game.gameEngine.getBoard().isActive(data.to));
        console.log(`[Custom Move] getPiece at ${data.from} color:`, game.gameEngine.getBoard().getPiece(data.from)?.color);
        console.log(`[Custom Move] getPiece at ${data.from} type:`, game.gameEngine.getBoard().getPiece(data.from)?.type);

        let success = false;
        if (game.gameEngine) {
          success = game.gameEngine.makeMove(data.from, data.to, data.promotion);
          console.log(`[Custom Move] makeMove result: ${success}`);
        } else {
          success = true;
        }

        if (success) {
          console.log(
            `[Custom Move] Room: ${roomId}, Move: ${data.from}->${data.to} (Success)`,
          );

          // Update game state
          if (data.fen) game.board_fen = data.fen;
          if (data.san) game.history.push(data.san);
          else game.history.push(`CUSTOM:${data.from}-${data.to}`);

          // Update turn from engine if possible
          if (game.gameEngine) {
            game.turn =
              game.gameEngine.getBoard().getTurn() === "white" ? "w" : "b";
          } else {
            game.turn = game.turn === "w" ? "b" : "w";
          }

          game.updateActivity();
          await saveGame(game);

          io.to(roomId).emit("move", {
            from: data.from,
            to: data.to,
            promotion: data.promotion,
            san: data.san || `${data.from} -> ${data.to}`,
            fen: game.board_fen,
            gameStatus: game.status,
            turn: game.turn,
            boardState: game.engine.getSnapshot(),
          });
        } else {
          console.warn(
            `[Custom Move Rejected] Invalid move: ${data.from}->${data.to}`,
          );
          socket.emit("error", { message: "Invalid move" });
        }
        return;
      }
      // -------------------------

      // Handle history rewind if historyIndex is provided
      let targetFen = game.board_fen;
      if (
        typeof data.historyIndex === "number" &&
        data.historyIndex >= -1 &&
        data.historyIndex < game.history.length
      ) {
        console.log(
          `[Move] Rewinding history to index ${data.historyIndex} in room ${roomId}`,
        );

        // Rebuild game state up to historyIndex
        const chess = new Chess();
        for (let i = 0; i <= data.historyIndex; i++) {
          chess.move(game.history[i]);
        }
        targetFen = chess.fen();

        // Truncate history
        game.history = game.history.slice(0, data.historyIndex + 1);
        game.board_fen = targetFen;
      }

      const chess = new Chess(targetFen);
      if (chess.turn() !== color) {
        console.warn(
          `[Move Rejected] Wrong turn in room ${roomId}. Expected: ${chess.turn()}, Got: ${color}`,
        );
        socket.emit("error", { message: "Not your turn" });
        socket.emit("receive_fen", { board_fen: game.board_fen });
        return;
      }
      const piece = chess.get(data.from);
      const toRank = parseInt(data.to.match(/\d+/)?.[0] || "0", 10);
      const boardHeight = game.customData?.rows || 8;
      const isPawnPromotion =
        piece &&
        piece.type === "p" &&
        ((piece.color === "w" && toRank === boardHeight) ||
          (piece.color === "b" && toRank === 1));
      console.log(
        `[Move Request] Room: ${roomId}, Player: ${playerId}, Move: ${data.from}->${data.to}, Promotion: ${data.promotion}, IsPromo: ${isPawnPromotion}`,
      );
      if (isPawnPromotion && !data.promotion) {
        console.log(
          `[Promotion Needed] Room: ${roomId}, Move: ${data.from}->${data.to}`,
        );
        socket.emit("promotion_needed", { from: data.from, to: data.to });
        game.pendingMove = { from: data.from, to: data.to };
        game.updateActivity();
        await saveGame(game);
        return;
      }
      const moveResult = chess.move({
        from: data.from,
        to: data.to,
        promotion: data.promotion,
      });
      if (moveResult) {
        console.log(`[Move Accepted] Room: ${roomId}, SAN: ${moveResult.san}`);
        game.board_fen = chess.fen();
        game.history.push(moveResult.san);
        game.pendingMove = null; // Clear any pending promotion
        game.updateActivity();
        const status = checkGameStatus(game);
        await saveGame(game);
        io.to(roomId).emit("move", {
          from: moveResult.from,
          to: moveResult.to,
          promotion: moveResult.promotion,
          san: moveResult.san,
          fen: game.board_fen,
          gameStatus: game.status,
          turn: chess.turn(),
        });
        if (game.status === "ended" && status) {
          io.to(roomId).emit("game_ended", {
            reason: status.gameInfo,
            result: status.result,
            status: "ended",
          });
        }
      } else {
        console.warn(
          `[Move Rejected] Invalid move attempted in room ${roomId}: ${data.from}-${data.to}`,
        );
        socket.emit("error", { message: "Invalid move" });
        socket.emit("receive_fen", { board_fen: game.board_fen }); // Resync client
      }
    } catch (err) {
      console.error(`[Move Error] Room ${roomId}:`, err);
      socket.emit("error", { message: "Move validation error" });
      const currentRoomGame = roomId ? await getGame(roomId) : null;
      if (currentRoomGame) {
        socket.emit("receive_fen", { board_fen: currentRoomGame.board_fen });
      }
    }
  });

  socket.on("resign", async () => {
    const playerId = socketToPlayer.get(socket.id);
    const roomId = playerId ? await getPlayerRoom(playerId) : null;
    const game = roomId ? await getGame(roomId) : null;
    if (game && game.status === "playing") {
      const myColor = game.getColorForPlayer(playerId);
      game.status = "ended";
      await saveGame(game);
      io.to(roomId).emit("game_ended", {
        reason: "Resigned",
        result: myColor === "w" ? "b" : "w",
        status: "ended",
      });
    }
  });
  socket.on("chat_message", async (data) => {
    const playerId = socketToPlayer.get(socket.id);
    const roomId = playerId ? await getPlayerRoom(playerId) : null;
    if (roomId) {
      const game = await getGame(roomId);
      if (game) {
        game.chatMessages.push({ message: data.message, playerId: playerId });
        await saveGame(game);
      }
      io.to(roomId).emit("chat_message", { message: data.message, playerId });
    }
  });

  socket.on("request_rematch", async () => {
    const playerId = socketToPlayer.get(socket.id);
    const roomId = playerId ? await getPlayerRoom(playerId) : null;
    const game = roomId ? await getGame(roomId) : null;

    if (!game || game.status !== "ended") return;

    if (!game.rematchRequests) game.rematchRequests = [];
    if (!game.rematchRequests.includes(playerId)) {
      game.rematchRequests.push(playerId);
      await saveGame(game);

      // Notify other player
      socket.to(roomId).emit("rematch_requested", { from: playerId });

      // Check if both agreed
      if (game.rematchRequests.length >= 2) {
        // Create new game - Swap colors
        const newGame = new Game(game.players.black); // winner of previous or just swap
        newGame.addPlayer(game.players.white);
        newGame.status = "playing";

        games.set(newGame.roomId.toUpperCase(), newGame);
        await saveGame(newGame);

        // Map players to new room
        await savePlayerRoom(newGame.players.white, newGame.roomId);
        await savePlayerRoom(newGame.players.black, newGame.roomId);

        io.to(roomId).emit("rematch_accepted", { newRoomId: newGame.roomId });
      }
    }
  });

  socket.on("find_next_game", async () => {
    const playerId = socketToPlayer.get(socket.id);
    if (!playerId) return;

    // Clean up old room if exists
    const oldRoomId = await getPlayerRoom(playerId);
    if (oldRoomId) {
      const oldGame = await getGame(oldRoomId);
      if (oldGame && oldGame.status === "ended") {
        // Delete the old game
        games.delete(oldRoomId);
        if (redisEnabled && redisClient) {
          await redisClient.del(`game:${oldRoomId}`);
        }
        console.log(`[Cleanup] Deleted ended game: ${oldRoomId}`);
      }
    }

    console.log("Find next game requested:", playerId);
    await addToSearchQueue(playerId);
    socket.emit("quick_search_started");
    matchmake();
  });

  socket.on("disconnect", () => {
    const playerId = socketToPlayer.get(socket.id);
    console.log("disconnected:", socket.id, playerId);
    if (playerId) {
      socketToPlayer.delete(socket.id);
      playerToSocket.delete(playerId);
    }
  });
});

// Periodic cleanup of inactive rooms (every 10 minutes)
setInterval(
  async () => {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
    let cleanedCount = 0;

    for (const [roomId, game] of games.entries()) {
      if (now - game.lastActivity > oneHour) {
        console.log(
          `[Cleanup] Deleting inactive room ${roomId} (last activity: ${new Date(game.lastActivity).toISOString()})`,
        );
        games.delete(roomId);

        // Clean up Redis if enabled
        if (redisEnabled && redisClient) {
          try {
            await redisClient.del(`game:${roomId}`);
            // Clean up player mappings
            if (game.players.white)
              await redisClient.del(`playerRoom:${game.players.white}`);
            if (game.players.black)
              await redisClient.del(`playerRoom:${game.players.black}`);
          } catch (err) {
            console.error(
              `[Cleanup] Error cleaning up Redis for room ${roomId}:`,
              err,
            );
          }
        }

        // Clean up in-memory player mappings
        if (game.players.white) playerToRoom.delete(game.players.white);
        if (game.players.black) playerToRoom.delete(game.players.black);

        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(
        `[Cleanup] Removed ${cleanedCount} inactive room(s). Active rooms: ${games.size}`,
      );
    }
  },
  10 * 60 * 1000,
); // Run every 10 minutes

// Periodic game state sync to all clients (every 5 seconds)
setInterval(() => {
    for (const [roomId, game] of games.entries()) {
        if (game.status === "playing" || game.status === "ended") {
            io.to(roomId).emit("receive_fen", { board_fen: game.board_fen });
        }
    }
}, 5000);

// DeepSeek chat proxy endpoint
app.use(express.json());
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "message is required" });
  }
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "DEEPSEEK_API_KEY not set on server" });
  }
  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: message }],
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data });
    }
    const reply = data.choices?.[0]?.message?.content ?? "";
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3002;
server.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port", PORT);
  const interfaces = os.networkInterfaces();
  for (const devName in interfaces) {
    const iface = interfaces[devName];
    if (iface) {
      for (const alias of iface) {
        if (
          alias.family === "IPv4" &&
          alias.address !== "127.0.0.1" &&
          !alias.internal
        ) {
          console.log(`📡 Local Network IP: http://${alias.address}:${PORT}`);
        }
      }
    }
  }
});
