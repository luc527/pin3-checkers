import { arePositionsEqual, serializePosition, decodeBoard } from '/assets/js/board.js';
import BoardView from '/assets/js/BoardView.js';
import { Status, CheckersState } from '/assets/js/game-state.js'
import * as mm from '/assets/js/minimax.js'

function detectOverlap(possibleActions) {
  const set = new Set()
  for (const action of possibleActions) {
    for (const position of action.sequence) {
      const pos = serializePosition(position)
      if (set.has(pos)) return true
      set.add(pos)
    }
  }
  return false
}

export class GameClient {

  animating = false

  constructor(againstAI, captureOptions, container, aiParameters={}) {

    const initialBoard = decodeBoard([
      '.....@..',
      '........',
      '...x....',
      '........',
      '.....x..',
      '..x.....',
      '.....x..',
      '........',
    ].join('\n'));

    const checkers = new CheckersState(captureOptions, initialBoard);

    if (againstAI) {
      const maximizeWhite = false // player is white
      const heuristic = mm[aiParameters.heuristic]
      const depth = aiParameters.depth
      const minimax = new mm.Minimax(maximizeWhite, heuristic, depth)
      this.minimax = minimax;
    }

    const view = new BoardView(checkers.board, container);
    view.onClick((row, col, marked) => {
      if (!this.possibleActions) {
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

    document.addEventListener('wheel', (e) => {
      console.log('wheel')
      if (this.possibleActionIndex == null) return
      const up = e.deltaY < 0
      if (up) this.showPrevPossibleAction()
      else this.showNextPossibleAction()
    });

    this.againstAI = againstAI
    this.checkers = checkers
    this.view = view
    this.actionStack = []

    this.waitSourceSelection()
  }

  waitSourceSelection() {
    this.animating = false
    this.possibleActions = null
    this.possibleActionIndex = null
    this.view.useBlueMarks(false)
    this.view.resetMarks(this.checkers.actions.map(it => it.from))
  }

  waitDestinationSelection(row, col) {
    const src = { row, col }
    this.possibleActions = this.checkers.actions.filter(it => arePositionsEqual(it.from, src))
    if (detectOverlap(this.possibleActions)) {
      this.view.useBlueMarks(true)
      this.possibleActionIndex = 0
      this.showCurrentPossibleAction()
    } else {
      this.view.resetMarks(this.possibleActions.map(it => it.sequence[it.sequence.length-1]))
    }
  }

  showCurrentPossibleAction() {
    const action = this.possibleActions[this.possibleActionIndex]
    const dest = action.sequence[action.sequence.length-1]
    this.view.resetMarks([dest])
  }

  showNextPossibleAction() {
    this.possibleActionIndex = (this.possibleActionIndex + 1) % this.possibleActions.length
    this.showCurrentPossibleAction()
  }

  showPrevPossibleAction() {
    this.possibleActionIndex--;
    if (this.possibleActionIndex < 0) this.possibleActionIndex = this.possibleActions.length-1;
    this.showCurrentPossibleAction()
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

    const destination = { row, col }
    const actionTaken
      = this.possibleActionIndex == null
      ? this.possibleActions.find(it => arePositionsEqual(it.sequence[it.sequence.length-1], destination))
      : this.possibleActions[this.possibleActionIndex];
    
    this.#actionDo(actionTaken)
    this.view.clearMarks()

    this.animating = true
    this.view.animateActionDo(actionTaken).then(() => {
      this.checkStatus()

      if (this.againstAI) {
        const { action: aiAction } = this.minimax.val(this.checkers)
        this.#actionDo(aiAction)
        this.view.animateActionDo(aiAction).then(() => {
          this.checkStatus()
          this.waitSourceSelection()
        })
      } else {
        this.waitSourceSelection()
      }

    })
  }

  #actionDo(action) {
    this.checkers.actionDo(action)
    this.actionStack.push(action)
  }

  #prevActionUndo() {
    if (this.actionStack.length == 0) return
    const action = this.actionStack.pop()
    this.checkers.actionUndo(action)
    return action
  }

  undo() {
    if (this.animating) return
    if (this.actionStack.length == 0) return

    this.view.clearMarks()

    this.animating = true
    const action = this.#prevActionUndo()
    this.view.animateActionUndo(action).then(() => {
      if (this.againstAI) {
        const action = this.#prevActionUndo()
        this.view.animateActionUndo(action).then(() => {
          this.waitSourceSelection()
        })
      } else {
        this.waitSourceSelection()
      }
    })
  }

}