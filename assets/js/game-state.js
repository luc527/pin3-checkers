import * as bo from './board.js'
import { generateMoves } from './move-generation.js'

export const Status = Object.freeze({
  playing: 0,
  whiteWon: 1,
  blackWon: 2,
  draw: 3
})
export class CheckersState {

  constructor() {
    this.board = bo.makeInitialBoard()
    this.whiteToMove = true
    this.actions = this.#generateActions()
    this.status = Status.playing

    this.roundsSinceCapture = 0
    this.roundsSinceManMove = 0
  }

  // copy() and equals() methods are just for debugging
  // in them, we deep-copy 'board' because it changes in actionDo
  // but we just shallow-copy 'actions' because it's not supposed to be modified

  copy() {
    const copy = new CheckersState()
    Object.assign(copy, this)
    copy.board = bo.copyBoard(this.board)
    return copy
  }

  equals(that) {
    if (!bo.areBoardsEqual(this.board, that.board)) {
      return false;
    }
    for (const key of Object.getOwnPropertyNames(this)) {
      if (key == 'board') continue
      if (that[key] !== this[key]) {
        return false;
      }
    }
    return true;
  }

  // Stores the undo info in the given action object
  actionDo(action) {
    action.undoInfo = {
      roundsSinceCapture: this.roundsSinceCapture,
      roundsSinceManMove: this.roundsSinceManMove,
      status: this.status,
      actions: this.actions
    }

    const manMoved = !this.board[action.from.row][action.from.col].king
    if (manMoved) this.roundsSinceManMove = 0
    else          this.roundsSinceManMove++

    const isCapture = Math.abs(action.from.row - action.sequence[0].row) > 1
    if (isCapture) this.roundsSinceCapture = 0
    else           this.roundsSinceCapture++

    const moveUndoInfo = bo.fullMoveDo(this.board, action.from, action.sequence)
    Object.assign(action.undoInfo, moveUndoInfo)
    
    this.whiteToMove = !this.whiteToMove

    this.handleChange()
  }

  actionUndo(action) {
    bo.fullMoveUndo(this.board, action.from, action.sequence, action.undoInfo)
    this.whiteToMove = !this.whiteToMove

    const undoInfo = action.undoInfo
    this.actions            = undoInfo.actions
    this.roundsSinceManMove = undoInfo.roundsSinceManMove
    this.roundsSinceCapture = undoInfo.roundsSinceCapture
    this.status             = undoInfo.status
  }
  
  handleChange() {
    this.actions = this.#generateActions()
    this.status = this.#calculateStatus()
  }

  #calculateStatus() {
    if (this.status != Status.playing) {
      return this.states
    }

    // TODO: Finais de: 2 damas contra 2 damas; 2 damas contra uma; 2 damas contra uma dama e uma pedra; uma dama contra
    // uma dama e uma dama contra uma dama e uma pedra, são declarados empatados após 5 lances de cada jogador.
    // ^ requires a different count for each kind of piece, which we could do once in actionDo, cache in a property, and undo in actionUndo

    // both >= 20
    if (this.roundsSinceManMove + this.prevRoundsSinceCapture >= 40) {
      return Status.draw;
    }

    const count = bo.countPieces(this.board)

    if (count.black == 0) return Status.whiteWon
    if (count.white == 0) return Status.blackWon
    if (this.actions.length == 0) {
      return this.whiteToMove ? Status.blackWon : Status.whiteWon
    }

    return this.state
  }

  #generateActions() {
    const positions = bo.getPlayerPiecePositions(this.board, this.whiteToMove)
    if (positions.length == 0) return []
    const actions = generateMoves(this.board, positions)
    return actions
  }
}