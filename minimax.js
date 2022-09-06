import * as s from './game-state.js'

export class Minimax {
  constructor(maximizeWhite, utilityFunction, cutoffDepth) {
    this.maximizeWhite = maximizeWhite
    this.utilityFunction = utilityFunction
    this.cutoffDepth = cutoffDepth
    // this.dbgStack = []
  }

  get(state, depth=0) {
    // this.dbgStack.push(bo.encodeBoard(state.board))

    if (depth == this.cutoffDepth) {
      // this.dbgStack.pop()
      return { value: this.utilityFunction(state, this.maximizeWhite) }
    }

    const actions = s.getActions(state)

    if (actions.length == 0) { //terminal
      // this.dbgStack.pop()
      return { value: this.utilityFunction(state, this.maximizeWhite) }
    }

    if (depth == 0 && actions.length == 1) { //no choice
      return { action: actions[0], value: 0 }
    }

    const maximizing = state.whiteToMove === this.maximizeWhite

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
    return { value: value, action: actionTaken }
  }
}

export function utilityCountPieces(state, maximizeWhite) {
  const board = state.board

  let utility = 0

  let blackHasPieces = false
  let whiteHasPieces = false

  for (let i=0; i<8; i++) {
    for (let j=0; j<8; j++) {
      if (!board[i][j]) continue
      const piece = board[i][j]
      const value = piece.king ? 2 : 1
      const sign = piece.white === maximizeWhite ? 1 : -1
      utility += sign * value

      if (piece.white) whiteHasPieces = true
      else blackHasPieces = true
    }
  }

  if (maximizeWhite) {
    if (!blackHasPieces) return +1000
    if (!whiteHasPieces) return -1000
  } else {
    if (!blackHasPieces) return -1000
    if (!whiteHasPieces) return +1000
  }

  return utility
}