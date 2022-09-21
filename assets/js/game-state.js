import * as bo from './board.js'
import { generateMoves } from './move-generation.js'

export const Status = {
  playing: 0,
  whiteWon: 1,
  blackWon: 2,
  draw: 3
}

Object.freeze(Status)

export function makeInitialState() {
  return {
    board: bo.makeInitialBoard(),
    whiteToMove: true,
    kingMoveCount: 0,
    roundsSinceCapture: 0,
    roundsSinceManMove: 0,
    status: Status.playing
  }
}

export function copyState(s) {
  return {
    board: bo.copyBoard(s.board),
    whiteToMove: s.whiteToMove,
    kingMoveCount: s.kingMoveCount,
    roundsSinceCapture: s.roundsSinceCapture,
    roundsSinceManMove: s.roundsSinceManMove,
    status: s.status
  }
}

export function areStatesEqual(s0, s1) {
  return bo.areBoardsEqual(s0.board, s1.board)
      && s0.whiteToMove === s1.whiteToMove
      && s0.roundsSinceCapture === s1.roundsSinceCapture
      && s0.roundsSinceManMove === s1.roundsSinceManMove
      && s0.status === s1.status;
}

export function getActions(state) {
  const positions = bo.getPlayerPiecePositions(state.board, state.whiteToMove)
  if (positions.length == 0) {
    return []
  }
  return generateMoves(state.board, positions)
}

export function actionDo(state, action) {
  const undoInfo = {
    prevRoundsSinceCapture: state.roundsSinceCapture,
    prevRoundsSinceManMove: state.roundsSinceManMove,
    prevStatus: state.status
  }

  const manMoved = !state.board[action.from.row][action.from.col].king
  if (manMoved) {
    state.roundsSinceManMove = 0
  } else {
    state.roundsSinceManMove++
  }

  const isCapture = Math.abs(action.from.row - action.sequence[0].row) > 1
  if (isCapture) {
    state.roundsSinceCapture = 0
  } else {
    state.roundsSinceCapture++
  }

  Object.assign(undoInfo, bo.fullMoveDo(state.board, action.from, action.sequence))
  state.whiteToMove = !state.whiteToMove

  updateStatus(state)

  return undoInfo
}

export function actionUndo(state, action, undoInfo) {
  bo.fullMoveUndo(state.board, action.from, action.sequence, undoInfo)
  state.whiteToMove = !state.whiteToMove

  state.roundsSinceManMove = undoInfo.prevRoundsSinceManMove
  state.roundsSinceCapture = undoInfo.prevRoundsSinceCapture
  state.status             = undoInfo.prevStatus
}

function updateStatus(state) {
  if (state.status == Status.playing) {
    // TODO: Finais de: 2 damas contra 2 damas; 2 damas contra uma; 2 damas contra uma dama e uma pedra; uma dama contra
    // uma dama e uma dama contra uma dama e uma pedra, são declarados empatados após 5 lances de cada jogador.
    // ^ requires a different count for each kind of piece, which we could do once in actionDo, cache in a property, and undo in actionUndo
    if (state.roundsSinceManMove >= 20 && roundsSinceCapture >= 20) {
      state.status = Status.draw;
    } else {
      const count = bo.countPieces(state.board)
      if      (count.black == 0) state.status = Status.whiteWon
      else if (count.white == 0) state.status = Status.blackWon
      // TODO not nice to call getActions again here, should cache the available actions in the state
      else if (getActions(state).length == 0) {
        state.status = state.whiteToMove ? Status.blackWon : Status.whiteWon
      }
    }
    // ^ the state is getting a lot more properties here, maybe it's time to refactor into a class
  }
}