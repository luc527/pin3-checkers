import * as bo from './board.js'
import { generateMoves } from './move-generation.js'

export function makeInitialState() {
  return {
    board: bo.makeInitialBoard(),
    whiteToMove: true
  }
}

export function getActions(state) {
  const positions = bo.getPlayerPiecePositions(state.board, state.whiteToMove)
  if (positions.length == 0) {
    return []
  }
  return generateMoves(state.board, positions)
}

export function actionDo(state, action) {
  const undoInfo = bo.fullMoveDo(state.board, action.from, action.sequence)
  state.whiteToMove = !state.whiteToMove
  return undoInfo
}

export function actionUndo(state, action, undoInfo) {
  bo.fullMoveUndo(state.board, action.from, action.sequence, undoInfo)
  state.whiteToMove = !state.whiteToMove
}
