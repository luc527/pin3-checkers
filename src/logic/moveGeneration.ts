/**
 * --- Move generation
 */

import type { Position } from "@/model/position";
import {
  inbounds,
  positionString,
  singleMoveDo,
  singleMoveUndo,
  validatePosition,
  type Board,
  type Sequence,
} from "./board";

// First some helpers for more helpful error messages

function validateMoveSource(board: Board, src: Position) {
  validatePosition(src);
  if (board[src.row][src.col] == null) {
    console.trace(`empty move source position ${positionString(src)}`);
    throw {};
  }
}

/**
 * Simple moves are non-capture moves. For men pieces, this
 * means moving just one diagonal forward, left or right. On the
 * other hand, king pieces can move arbitrarily along their four
 * diagonals until reaching the end of the board or bumping into
 * another piece.
 */

/**
 * Returns an array of the positions the piece at 'src' can end up
 * as a consequence of a regular move in the given board.
 */
function getSimpleMoveDestinations(board: Board, src: Position) {
  validateMoveSource(board, src);

  const srcPiece = board[src.row][src.col];
  if (!srcPiece) return [];

  const colSteps = [-1, 1];
  const rowSteps = srcPiece.king ? [-1, 1] : srcPiece.white ? [-1] : [1];

  const result = [];
  const reach = srcPiece.king ? 100 : 1;

  for (const rowStep of rowSteps) {
    for (const colStep of colSteps) {
      const pos = { row: src.row + rowStep, col: src.col + colStep };
      for (let dist = 1; dist <= reach; dist++) {
        if (pos.row < 0 || pos.row > 7 || pos.col < 0 || pos.col > 7) {
          break;
        }

        const piece = board[pos.row][pos.col];
        if (piece != null) {
          break;
        }

        result.push({ row: pos.row, col: pos.col });

        pos.row += rowStep;
        pos.col += colStep;
      }
    }
  }

  return result;
}

/**
 * Returns an array of the positions the piece at 'src' can
 * end up if it performs a single capture along each of its
 * four diagonals. For men pieces, this is at most four positions.
 * For king pieces, every position after an enemy piece in each
 * diagonal counts.
 */
function getSingleCaptureDestinations(board: Board, src: Position) {
  validateMoveSource(board, src);

  const srcPiece = board[src.row][src.col];
  if (srcPiece == null) return [];

  const destinations = [];

  // Arbitrary large number for unlimited reach
  const reach = srcPiece.king ? 100 : 2;

  // Iterate through all four diagonals
  for (const rowStep of [-1, 1]) {
    for (const colStep of [-1, 1]) {
      let didCapture = false;
      const pos = { row: src.row + rowStep, col: src.col + colStep };

      for (let dist = 1; dist <= reach; dist++) {
        if (!inbounds(pos)) {
          break;
        }

        const piece = board[pos.row][pos.col];

        if (piece != null) {
          if (didCapture) break;
          else if (piece.white == srcPiece.white) break;
          else didCapture = true;
        } else if (didCapture) {
          // Every empty space after the captured piece and within reach is a possible destination
          destinations.push({ row: pos.row, col: pos.col });
        }

        pos.row += rowStep;
        pos.col += colStep;
      }
    }
  }

  return destinations;
}

/**
 * In checkers, every player is obliged to make the move that captures the most
 * pieces at each turn. This means sequential captures are mandatory, so the single
 * captures described above are not always valid moves. A 'full' capture is one
 * that makes sequential captures until there are no pieces available to capture
 * in the position it ended up.
 */

/**
 * Return an array of all 'full' captures the piece at 'src' can perform in the given board.
 * It includes sequential captures, but also returns simple captures (just between a pair of positions), despite the name.
 * getCaptureSequencesImpl is the real implementation, but it has to take some extra state arguments.
 * getCaptureSequences is the interface used to call it, providing the initial empty state for those arguments.
 */
export function getCaptureSequences(board: Board, src: Position) {
  // in principle shouldn't be exported, but is currently for testing
  validateMoveSource(board, src);

  const result: Sequence[] = [];
  getCaptureSequencesImpl(board, src, [], result);
  return result;
}

/**
 * The implementation is a depth-first traversal of the tree where
 * each node is a game state and has one children for each single
 * capture destination available at the current position. This traversal
 * is not done by literally creating this tree (making brand new states),
 * but by performing the single capture on the way down and undoing it
 * on the way up the tree -- backtracking.
 */
function getCaptureSequencesImpl(
  board: Board,
  src: Position,
  previousPositions: Sequence,
  result: Sequence[]
) {
  validateMoveSource(board, src);

  const destinations = getSingleCaptureDestinations(board, src);

  if (destinations.length == 0) {
    if (previousPositions.length > 0) {
      result.push([...previousPositions, src].slice(1));
    }
  } else {
    for (const dest of destinations) {
      const captured = singleMoveDo(board, src, dest);
      getCaptureSequencesImpl(board, dest, [...previousPositions, src], result);
      if (captured) {
        singleMoveUndo(board, src, dest, captured);
      }
    }
  }
}

/**
 * Generates the moves available for each of the pieces in the given positions.
 * In particular, generateMoves(board, getPlayerPiecePositions(board, player)) will
 * return the moves available for the given player. This is *the* move generation function.
 * This is where all the previous functions come together. This says what the state transition
 * possibilities are for a given state. Some details:
 * - Only returns simple moves if no captures are available
 * - Only returns the longest captures
 */
export function generateMoves(board: Board, piecePositions: Position[]) {
  for (const src of piecePositions) {
    validateMoveSource(board, src);
  }

  const result = [];
  for (const src of piecePositions) {
    const captureSequences = getCaptureSequences(board, src);
    for (const sequence of captureSequences) {
      result.push({ from: src, sequence });
    }
  }

  if (result.length == 0) {
    // No captures, so return the simple moves
    for (const src of piecePositions) {
      const destinations = getSimpleMoveDestinations(board, src);
      for (const dst of destinations) {
        result.push({ from: src, sequence: [dst] });
      }
    }
    return result;
  } else {
    // Remove suboptimal moves
    let longestMoveLength = 0;
    for (const move of result) {
      if (move.sequence.length > longestMoveLength) {
        longestMoveLength = move.sequence.length;
      }
    }
    return result.filter((move) => move.sequence.length == longestMoveLength);
  }
}
