import * as bo from './board.js'
import { CaptureOptions, generateMoves } from './move-generation.js'

export const Status = Object.freeze({
  playing: 0,
  whiteWon: 1,
  blackWon: 2,
  draw: 3
})
export class CheckersState {

  constructor(captureOptions=CaptureOptions.bestMandatory, initialBoard=null, firstPlayerWhite=true) {
    this.captureOptions = captureOptions

    this.board = initialBoard ?? bo.makeInitialBoard()
    this.whiteToMove = firstPlayerWhite

    this.status = Status.playing

    // Computed only once for each state and stored (previously were functions called two or three times for each game state in different places)
    this.actions = this.#generateActions()
    this.pieceCount = bo.countPieces(this.board)

    // For detecting draws
    this.roundsSinceCapture = 0
    this.roundsSincePawnMove = 0
    this.roundsInSpecialEnding = -1
  }

  // copy() and equals() methods are just for debugging
  // in them, we deep-copy 'board' because it changes in actionDo
  // but we just shallow-copy 'actions' and 'pieceCount' because they're not supposed to be modified

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

  actionDo(action) {
    // Stores the undo info in the given action object
    // Expects the same object to be passed to actionUndo
    action.undoInfo = {
      roundsSinceCapture: this.roundsSinceCapture,
      roundsSincePawnMove: this.roundsSincePawnMove,
      roundsInSpecialEnding: this.roundsInSpecialEnding,
      status: this.status,
      actions: this.actions,
      pieceCount: this.pieceCount
    }

    const pawnMove = !this.board[action.from.row][action.from.col].king
    if (pawnMove) this.roundsSincePawnMove = 0
    else          this.roundsSincePawnMove++

    if (action.isCapture) this.roundsSinceCapture = 0
    else                  this.roundsSinceCapture++

    if (this.roundsInSpecialEnding != -1) {
      this.roundsInSpecialEnding++
    }

    const moveUndoInfo = bo.fullMoveDo(this.board, action.from, action.sequence)
    Object.assign(action.undoInfo, moveUndoInfo)
    Object.freeze(action.undoInfo)
    
    this.whiteToMove = !this.whiteToMove

    this.#handleChange()
  }

  actionUndo(action) {
    bo.fullMoveUndo(this.board, action.from, action.sequence, action.undoInfo)
    this.whiteToMove = !this.whiteToMove

    const undoInfo = action.undoInfo
    this.status                = undoInfo.status
    this.actions               = undoInfo.actions
    this.pieceCount            = undoInfo.pieceCount
    this.roundsSincePawnMove   = undoInfo.roundsSincePawnMove
    this.roundsSinceCapture    = undoInfo.roundsSinceCapture
    this.roundsInSpecialEnding = undoInfo.roundsInSpecialEnding

    // no handleChange here, undoInfo already has the appropriate actions/pieceCount/rounds count etc.
  }

  #handleChange() {
    this.actions = this.#generateActions()
    this.pieceCount = bo.countPieces(this.board)

    // detect if just got in a special ending
    if (this.roundsInSpecialEnding == -1 && this.#inSpecialEnding()) {
      this.roundsInSpecialEnding = 0
    }

    // #calculateStatus depends on actions and pieceCount being updated, so this order matters
    this.status = this.#calculateStatus()
  }

  #inSpecialEndingImpl(ourKings, ourPawns, theirKings, theirPawns) {
    // a) 2 damas vs 2 damas 
    // b) 2 damas vs 1 dama
    // c) 2 damas vs 1 dama e 1 pedra
    // d) 1 dama  vs 1 dama
    // e) 1 dama  vs 1 dama e 1 pedra
    //    ^ our   vs ^ their
    if (ourPawns > 0) return false;
    if (ourKings == 2) {
      return (theirPawns == 0 && (theirKings == 2 || theirKings == 1)) // a ou b
          || (theirPawns == 1 && theirKings == 1) // c
    }
    if (ourKings == 1) {
      return theirKings == 1 && (theirPawns == 0 || theirPawns == 1) // d ou e
    }
  }

  #inSpecialEnding() {
    const c = this.pieceCount
    return this.#inSpecialEndingImpl(c.whiteKings, c.whitePawns, c.blackKings, c.blackPawns)
        || this.#inSpecialEndingImpl(c.blackKings, c.blackPawns, c.whiteKings, c.whitePawns)
  }

  #calculateStatus() {
    if (this.status != Status.playing) {
      return this.status
    }

    const blackCount = this.pieceCount.blackPawns + this.pieceCount.blackKings
    const whiteCount = this.pieceCount.whitePawns + this.pieceCount.whiteKings

    if (blackCount == 0) return Status.whiteWon
    if (whiteCount == 0) return Status.blackWon
    if (this.actions.length == 0) {
      return this.whiteToMove ? Status.blackWon : Status.whiteWon
    }

    // only kings have moved 20+ times without captures
    if (this.roundsSincePawnMove >= 20 && this.roundsSinceCapture >= 20) {
      return Status.draw;
    }

    if (this.roundsInSpecialEnding == 5) {
      return Status.draw
    }

    return this.status
  }

  #generateActions() {
    const positions = bo.getPlayerPiecePositions(this.board, this.whiteToMove)
    if (positions.length == 0) return []
    const actions = generateMoves(this.board, positions, this.captureOptions)
    return actions
  }
}