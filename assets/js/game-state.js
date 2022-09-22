import * as bo from './board.js'
import { generateMoves } from './move-generation.js'

export const Status = {
  playing: 0,
  whiteWon: 1,
  blackWon: 2,
  draw: 3
}

Object.freeze(Status)

export class CheckersState {

  constructor() {
    this.board = bo.makeInitialBoard()
    this.whiteToMove = true
    
    this.status = Status.playing
    this.roundsSinceCapture = 0
    this.roundsSinceManMove = 0
    this.actions = this.#generateActions()
  }

  copy() {
    // TODO test if this works
    const copy = new CheckersState()
    Object.assign(copy, this)
    copy.board = bo.copyBoard(this.board)
    return copy
  }

  equals(that) {
    if (!bo.areBoardsEqual(this.board, that.board)) {
      return false;
    }
    // TODO test if this works
    for (const key in this) {
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

    // must come before updateStatus
    this.actions = this.#generateActions() 

    this.#updateStatus()
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

  #updateStatus() {
    if (this.status != Status.playing) return

    // TODO: Finais de: 2 damas contra 2 damas; 2 damas contra uma; 2 damas contra uma dama e uma pedra; uma dama contra
    // uma dama e uma dama contra uma dama e uma pedra, são declarados empatados após 5 lances de cada jogador.
    // ^ requires a different count for each kind of piece, which we could do once in actionDo, cache in a property, and undo in actionUndo

    // both >= 20
    if (this.roundsSinceManMove + this.prevRoundsSinceCapture >= 40) {
      this.status = Status.draw;
      return
    }

    const count = bo.countPieces(this.board)
    if      (count.black == 0) this.status = Status.whiteWon
    else if (count.white == 0) this.status = Status.blackWon
    else if (this.actions.length == 0) {
      this.status = this.whiteToMove ? Status.blackWon : Status.whiteWon
    }
  }

  #generateActions() {
    const positions = bo.getPlayerPiecePositions(this.board, this.whiteToMove)
    if (positions.length == 0) return []
    const actions = generateMoves(this.board, positions)
    Object.freeze(actions)  //TODO test
    return actions
  }
}

//TODO remove dead code below

//export function makeInitialState() {
  //return {
    //board: bo.makeInitialBoard(),
    //whiteToMove: true,
    //roundsSinceCapture: 0,
    //roundsSinceManMove: 0,
    //status: Status.playing,
    //actions: []
  //}
//}

//export function copyState(s) {
  //return {
    //board: bo.copyBoard(s.board),
    //whiteToMove: s.whiteToMove,
    //roundsSinceCapture: s.roundsSinceCapture,
    //roundsSinceManMove: s.roundsSinceManMove,
    //status: s.status,
    //actions: s.actions //! copy by reference, but here this is fine
  //}
//}

//export function areStatesEqual(s0, s1) {
  //return bo.areBoardsEqual(s0.board, s1.board)
      //&& s0.whiteToMove === s1.whiteToMove
      //&& s0.roundsSinceCapture === s1.roundsSinceCapture
      //&& s0.roundsSinceManMove === s1.roundsSinceManMove
      //&& s0.status === s1.status
      //&& s0.actions === s1.actions; //! again, comparing by reference, which is fine for now
//}

//export function generateActions(state) {
  //const positions = bo.getPlayerPiecePositions(state.board, state.whiteToMove)
  //if (positions.length == 0) {
    //return []
  //}
  //return generateMoves(state.board, positions)
//}

//export function actionDo(state, action) {
  //const undoInfo = {
    //prevRoundsSinceCapture: state.roundsSinceCapture,
    //prevRoundsSinceManMove: state.roundsSinceManMove,
    //prevStatus: state.status
  //}

  //const manMoved = !state.board[action.from.row][action.from.col].king
  //if (manMoved) {
    //state.roundsSinceManMove = 0
  //} else {
    //state.roundsSinceManMove++
  //}

  //const isCapture = Math.abs(action.from.row - action.sequence[0].row) > 1
  //if (isCapture) {
    //state.roundsSinceCapture = 0
  //} else {
    //state.roundsSinceCapture++
  //}

  //Object.assign(undoInfo, bo.fullMoveDo(state.board, action.from, action.sequence))
  //state.whiteToMove = !state.whiteToMove

  //updateStatus(state)

  //return undoInfo
//}

//export function actionUndo(state, action, undoInfo) {
  //bo.fullMoveUndo(state.board, action.from, action.sequence, undoInfo)
  //state.whiteToMove = !state.whiteToMove

  //state.roundsSinceManMove = undoInfo.prevRoundsSinceManMove
  //state.roundsSinceCapture = undoInfo.prevRoundsSinceCapture
  //state.status             = undoInfo.prevStatus
//}

//function updateStatus(state) {
  //if (state.status == Status.playing) {
    //// TODO: Finais de: 2 damas contra 2 damas; 2 damas contra uma; 2 damas contra uma dama e uma pedra; uma dama contra
    //// uma dama e uma dama contra uma dama e uma pedra, são declarados empatados após 5 lances de cada jogador.
    //// ^ requires a different count for each kind of piece, which we could do once in actionDo, cache in a property, and undo in actionUndo
    //if (state.roundsSinceManMove >= 20 && roundsSinceCapture >= 20) {
      //state.status = Status.draw;
    //} else {
      //const count = bo.countPieces(state.board)
      //if      (count.black == 0) state.status = Status.whiteWon
      //else if (count.white == 0) state.status = Status.blackWon
      //// TODO not nice to call generateActions again here, should cache the available actions in the state
      //else if (generateActions(state).length == 0) {
        //state.status = state.whiteToMove ? Status.blackWon : Status.whiteWon
      //}
    //}
    //// ^ the state is getting a lot more properties here, maybe it's time to refactor into a class
  //}
//}