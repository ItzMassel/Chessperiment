/**
 * Game Serialization Utilities
 * Handles serialization/deserialization of BoardClass and custom game state
 * for Redis persistence and client-server communication
 */

const BoardClass = require("../engine/classes/Board");
const PieceClass = require("../engine/classes/Piece");

/**
 * Serializes a BoardClass instance to JSON
 * @param {BoardClass} board - The board instance to serialize
 * @returns {Object} Serialized board state
 */
function serializeBoard(board) {
  if (!board) return null;

  const serialized = {
    boardSize: board.boardSize,
    squares: {},
    pieces: [],
  };

  // Serialize squares
  for (const sqId in board.squares) {
    const square = board.squares[sqId];
    serialized.squares[sqId] = {
      id: square.id,
      row: square.row,
      col: square.col,
      disabled: square.disabled,
      logic: square.logic,
    };
  }

  // Serialize pieces
  for (const pieceId in board.pieces) {
    const piece = board.pieces[pieceId];
    serialized.pieces.push({
      id: piece.id,
      type: piece.type,
      color: piece.color,
      position: piece.position,
      logic: piece.logic,
      variables: piece.variables || {},
      cooldowns: piece.cooldowns || {},
      hasMoved: piece.hasMoved,
      isCustom: piece.isCustom,
      displayName: piece.displayName,
      image: piece.image,
      movement: piece.movement,
      captures: piece.captures,
      castling: piece.castling,
    });
  }

  return serialized;
}

/**
 * Deserializes JSON back to a BoardClass instance
 * @param {Object} data - Serialized board data
 * @param {Object} customPieces - Array of custom piece definitions from project
 * @returns {BoardClass} Reconstructed board instance
 */
function deserializeBoard(data, customPieces = []) {
  if (!data) return null;

  const board = new BoardClass(data.boardSize);

  // Reconstruct squares
  for (const sqId in data.squares) {
    const sqData = data.squares[sqId];
    const square = board.getSquare(sqData.row, sqData.col);
    if (square) {
      square.disabled = sqData.disabled;
      square.logic = sqData.logic;
    }
  }

  // Reconstruct pieces
  for (const pieceData of data.pieces) {
    // Find custom piece definition if it exists
    let pieceDef = null;
    if (pieceData.isCustom && customPieces) {
      pieceDef = customPieces.find((cp) => cp.type === pieceData.type);
    }

    const piece = new PieceClass({
      id: pieceData.id,
      type: pieceData.type,
      color: pieceData.color,
      position: pieceData.position,
      logic: pieceData.logic || (pieceDef ? pieceDef.logic : []),
      variables: pieceData.variables || (pieceDef ? pieceDef.variables : {}),
      cooldowns: pieceData.cooldowns || {},
      hasMoved: pieceData.hasMoved,
      isCustom: pieceData.isCustom,
      displayName:
        pieceData.displayName || (pieceDef ? pieceDef.name : pieceData.type),
      image: pieceData.image || (pieceDef ? pieceDef.image : null),
      movement: pieceData.movement || (pieceDef ? pieceDef.movement : []),
      captures: pieceData.captures || (pieceDef ? pieceDef.captures : []),
      castling:
        pieceData.castling || (pieceDef ? pieceDef.castling : undefined),
    });

    board.pieces[piece.id] = piece;
  }

  return board;
}

/**
 * Creates a BoardClass instance from a Project's saved board
 * @param {Object} project - The project object with customPieces and savedBoard
 * @returns {BoardClass} New board instance
 */
function createBoardFromProject(project) {
  if (!project || !project.savedBoard) return null;

  const boardSize = project.savedBoard.boardSize || 8;
  const board = new BoardClass(boardSize);

  // Set up squares
  if (project.savedBoard.squares) {
    for (const sqId in project.savedBoard.squares) {
      const sqData = project.savedBoard.squares[sqId];
      const square = board.getSquare(sqData.row, sqData.col);
      if (square) {
        square.disabled = sqData.disabled;
        square.logic = sqData.logic;
      }
    }
  }

  // Place pieces
  if (project.savedBoard.pieces) {
    for (const pieceData of project.savedBoard.pieces) {
      // Find custom piece definition
      let pieceDef = null;
      if (project.customPieces) {
        pieceDef = project.customPieces.find(
          (cp) => cp.type === pieceData.type,
        );
      }

      const piece = new PieceClass({
        id: pieceData.id,
        type: pieceData.type,
        color: pieceData.color,
        position: pieceData.position,
        logic: pieceDef ? pieceDef.logic : [],
        variables: pieceDef
          ? JSON.parse(JSON.stringify(pieceDef.variables || {}))
          : {},
        cooldowns: {},
        hasMoved: false,
        isCustom: !!pieceDef,
        displayName: pieceDef ? pieceDef.name : pieceData.type,
        image: pieceDef ? pieceDef.image : null,
        movement: pieceDef ? pieceDef.movement : [],
        captures: pieceDef ? pieceDef.captures : [],
        castling: pieceDef ? pieceDef.castling : undefined,
      });

      board.pieces[piece.id] = piece;
    }
  }

  return board;
}

module.exports = {
  serializeBoard,
  deserializeBoard,
  createBoardFromProject,
};
