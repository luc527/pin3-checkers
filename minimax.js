import * as bo from './board.js'
import * as s from './game-state.js'

export class Minimax {
  constructor(maximizeWhite, utilityFunction) {
    this.maximizeWhite = maximizeWhite
    this.utilityFunction = utilityFunction
    this.leafCount = 0
  }

  resetLeafCount() {
    this.leafCount = 0
  }

  get(state, depthLeft) {
    if (depthLeft == 0) { //cutoff
      this.leafCount++
      return { value: this.utilityFunction(state, this.maximizeWhite) }
    }

    const actions = s.getActions(state)

    if (actions.length == 0) { //terminal
      this.leafCount++
      return { value: this.utilityFunction(state, this.maximizeWhite) }
    }

    const maximizing = state.whiteToMove === this.maximizeWhite

    let value = maximizing ? -Infinity : +Infinity
    let actionTaken = null

    for (const action of actions) {
      const undoInfo = s.actionDo(state, action)

      const { value: subValue } = this.get(state, depthLeft-1)

      if ((maximizing && subValue > value) || (!maximizing && subValue < value)) {
        actionTaken = action
        value = subValue
      }

      s.actionUndo(state, action, undoInfo)
    }

    return { value: value, action: actionTaken }
  }
}

export function utilityCountPieces(state, maximizeWhite) {
  const board = state.board

  let utility = 0

  for (let i=0; i<8; i++) {
    for (let j=0; j<8; j++) {
      if (!board[i][j]) continue
      const piece = board[i][j]
      const value = piece.king ? 2 : 1
      const sign = piece.white === maximizeWhite ? 1 : -1
      utility += sign * value
    }
  }

  return utility
}