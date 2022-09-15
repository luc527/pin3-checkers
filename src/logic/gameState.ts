import * as bo from "./board";
import { generateMoves } from "./moveGeneration";

export function makeInitialState() {
  return {
    board: bo.makeInitialBoard(),
    whiteToMove: true,
  };
}

export function getActions(state) {
  const positions = bo.getPlayerPiecePositions(state.board, state.whiteToMove);
  if (positions.length == 0) {
    return [];
  }
  return generateMoves(state.board, positions);
}

export function actionDo(state, action) {
  const undoInfo = bo.fullMoveDo(state.board, action.from, action.sequence);
  state.whiteToMove = !state.whiteToMove;
  return undoInfo;
}

export function actionUndo(state, action, undoInfo) {
  bo.fullMoveUndo(state.board, action.from, action.sequence, undoInfo);
  state.whiteToMove = !state.whiteToMove;
}

/**
 * Returns true if white wins, false if black wins, null if no one wins yet.
 * This means the return value needs to be compared with ===.
 */
export function getWinner(state) {
  const WHITE = true;
  const BLACK = false;
  const NONE = null;

  const count = bo.countPieces(state.board);
  if (count.black == 0) return WHITE;
  if (count.white == 0) return BLACK;

  if (getActions(state).length == 0) {
    return state.whiteToMove ? BLACK : WHITE;
  }

  return NONE;
}
