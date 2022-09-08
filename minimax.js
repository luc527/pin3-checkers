import * as s from './game-state.js'
import * as bo from './board.js'

export class Minimax {
  constructor(maximizeWhite, heuristicFunction, cutoffDepth) {
    this.maximizeWhite = maximizeWhite
    this.heuristicFunction = heuristicFunction
    this.cutoffDepth = cutoffDepth
    // this.dbgStack = []
    this.leafCount = 0
  }

  resetLeafCount() {
    this.leafCount = 0
  }

  getLeafCount() {
    return this.leafCount
  }

  get(state, depth=0) {
    // this.dbgStack.push(bo.encodeBoard(state.board))

    if (depth >= this.cutoffDepth) {
      // this.dbgStack.pop()
      this.leafCount++
      return { value: this.heuristicFunction(state, this.maximizeWhite) }
    }

    const actions = s.getActions(state)

    if (actions.length == 0) { //terminal
      const count = bo.countPieces(state.board)

      const WIN = +1000
      const LOSS = -1000

      let value

      if (count.white == 0) {
        value = this.maximizeWhite ? LOSS : WIN
      } else if (count.black == 0) {
        value = this.maximizeWhite ? WIN : LOSS
      } else {
        // current player has pieces but can't move, so loses
        if (state.whiteToMove) {
          value = this.maximizeWhite ? LOSS : WIN
        } else {
          value = this.maximizeWhite ? WIN : LOSS
        }
      }

      // this.dbgStack.pop()
      this.leafCount++
      return { value }
    }

    if (depth == 0 && actions.length == 1) { //no choice
      // this.dbgStack.pop()
      this.leafCount++
      return { action: actions[0], value: 0 }
    }

    const maximizing = state.whiteToMove == this.maximizeWhite

    let value = maximizing ? -Infinity : +Infinity
    let actionTaken = null

    for (const action of actions) {
      const undoInfo = s.actionDo(state, action)

      const { value: subValue } = this.get(state, depth+1)

      if ((maximizing && subValue > value) || (!maximizing && subValue < value)) {
        actionTaken = action
        value = subValue
      }

      s.actionUndo(state, action, undoInfo)
    }

    // this.dbgStack.pop()
    this.leafCount++
    return { value: value, action: actionTaken }
  }
}

export function heuristicCountPieces(state, maximizeWhite) {
  const board = state.board

  let boardValue = 0

  for (let i=0; i<8; i++) {
    for (let j=0; j<8; j++) {
      if (!board[i][j]) continue
      const piece = board[i][j]
      const value = piece.king ? 2 : 1
      const sign = piece.white === maximizeWhite ? 1 : -1
      boardValue += sign * value
    }
  }

  return boardValue
}