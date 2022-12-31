import * as bo from './board.js'
import { CaptureOptions, generateMoves } from './move-generation.js'

// TODO current problem with this code:
// actions are generated for _every_ state, as you can see in #handleChange
// the problem with this is that it generates actions even for states in the leaves of the Minimax tree
// which is a lot of unnecessary work! -- when working with depth x, it'll actually generate the tree down to depth x+1

// one possible solution is a .generateActions() method that does what #generateActions does but caches the result
// so only when we need the actions we call .generateActions()
// make the method lazy instead of eager, basically

// the problem is that we actually do use the .actions array even for those leaf states
// in order to detect when a player has no moves available and lost the game

// but we could replace that with a more specialized method hasAvailableMoves()
// which just has to report whether the board has simple moves or simple captures available for some piece

// although this does introduce some overhead for the nodes that are not leaves:
// they will call _both_ hasAvailableMoves() and generateActions() instead of just calling generateActions() and checking whether it's empty

// we'd need to check which is worst: the overhead (with the benefit of not generating actions for leaf states) or keeping it the way it currently is, generating actions for leaf states

// BUT we also could tell the CheckersState whether it's a leaf state so it just calls hasAvailableMoves() for leaf states
// but my intuition is that it would make the code awkward
// but the code could also be redesigned to be less awkward, maybe inlining some stuff and seeing which patterns actually emerge that indicate a better abstraction to use

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