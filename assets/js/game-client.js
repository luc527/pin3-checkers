import { arePositionsEqual } from '/assets/js/board.js';
import BoardView from '/assets/js/BoardView.js';
import { Status, CheckersState } from '/assets/js/game-state.js'
import * as mm from '/assets/js/minimax.js'

export function setupGame(againstAI, captureOptions, aiParameters, container) {
  new GameClient(againstAI, captureOptions, aiParameters, container)
}

// TODO redo as a just a function
// TODO undo/redo
//  against AI undo will need to go back two steps

class GameClient {

  constructor(againstAI, captureOptions, container, aiParameters={}) {
    const checkers = new CheckersState(captureOptions);
    if (againstAI) {
      const maximizeWhite = false // player is white
      const heuristic = mm[aiParameters.heuristic]
      const depth = aiParameters.depth
      const minimax = new mm.Minimax(maximizeWhite, heuristic, depth)
      this.minimax = minimax;
    }

    const view = new BoardView(checkers.board, container);
    view.onClick((row, col, marked) => {
      if (!this.selectedSource) {
        if (marked) {
          this.waitDestinationSelection(row, col)
        }
      } else {
        if (!marked) {
          this.waitSourceSelection()
        } else {
          this.handleDestinationSelection(row, col)
        }
      }
    })

    this.againstAI = againstAI
    this.checkers = checkers
    this.view = view

    this.waitSourceSelection()
  }

  waitSourceSelection() {
    console.log('waitSourceSelection')
    this.selectedSource = null
    this.view.resetMarks(this.checkers.actions.map(it => it.from))
  }

  waitDestinationSelection(row, col) {
    console.log('waitDestinationSelection', row, col)
    this.selectedSource = { row, col }
    this.view.resetMarks(
      this.checkers.actions
      .filter(it => arePositionsEqual(it.from, this.selectedSource))
      .map(it => it.sequence[it.sequence.length-1])
    )
  }

  checkStatus() {
    if (this.checkers.status == Status.playing) return
    let msg = ''
    switch (this.checkers.status) {
      case Status.whiteWon: msg = 'White won!'; break
      case Status.blackWon: msg = 'Black won!'; break
      case Status.draw: msg = 'Draw...'; break
    }
    alert(msg)
    location.reload()
  }

  handleDestinationSelection(row, col) {
    console.log('handleDestinationSelection', row, col)

    const source = this.selectedSource
    const destination = { row, col }
    const possibleActions = this.checkers.actions.filter(it => {
      return arePositionsEqual(it.from, source) && arePositionsEqual(it.sequence[it.sequence.length-1], destination)
    })
    const actionTaken = possibleActions[0]
    
    this.checkers.actionDo(actionTaken)
    this.view.clearMarks()
    this.view.animateActionDo(actionTaken).then(() => {
      this.checkStatus()

      if (this.againstAI) {
        const { action: aiAction } = this.minimax.val(this.checkers)
        this.checkers.actionDo(aiAction)
        this.view.animateActionDo(aiAction).then(() => {
          this.checkStatus()
          this.waitSourceSelection()
        })
      } else {
        this.waitSourceSelection()
      }

    })
  }

}