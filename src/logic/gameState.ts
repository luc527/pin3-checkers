import type { Position } from "@/model/position";
import {
  countPieces,
  fullMoveDo,
  fullMoveUndo,
  getPlayerPiecePositions,
  makeInitialBoard,
  type Board,
  type Sequence,
  type UndoInfo,
} from "./board";
import { generateMoves } from "./moveGeneration";

export type GameState = { board: Board; whiteToMove: boolean };
export type GameAction = {
  from: Position;
  sequence: Sequence;
};

export function makeInitialState() {
  return {
    board: makeInitialBoard(),
    whiteToMove: true,
  };
}

export function getActions(state: GameState): GameAction[] {
  const positions = getPlayerPiecePositions(state.board, state.whiteToMove);
  if (positions.length == 0) {
    return [];
  }
  return generateMoves(state.board, positions);
}

export function actionDo(state: GameState, action: GameAction) {
  const undoInfo = fullMoveDo(state.board, action.from, action.sequence);
  state.whiteToMove = !state.whiteToMove;
  return undoInfo;
}

export function actionUndo(
  state: GameState,
  action: GameAction,
  undoInfo: UndoInfo
) {
  fullMoveUndo(state.board, action.from, action.sequence, undoInfo);
  state.whiteToMove = !state.whiteToMove;
}

/**
 * Returns true if white wins, false if black wins, null if no one wins yet.
 * This means the return value needs to be compared with ===.
 */
export function getWinner(state: GameState) {
  const WHITE = true;
  const BLACK = false;
  const NONE = null;

  const count = countPieces(state.board);
  if (count.black == 0) return WHITE;
  if (count.white == 0) return BLACK;

  if (getActions(state).length == 0) {
    return state.whiteToMove ? BLACK : WHITE;
  }

  return NONE;
}
