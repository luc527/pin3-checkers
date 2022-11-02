import BoardView from '/assets/js/BoardView.js'
import {makeInitialBoard} from '/assets/js/board.js'

export default class GameHistoryView {

  #actions
  #boardView
  #currentAction = -1

  constructor(actions, container) {
    this.#actions = actions

    container.append(Object.assign(document.createElement('button'), {
      type: 'button',
      innerText: 'Prev',
      onclick: () => {
        this.prev()
      }
    }))

    container.append(Object.assign(document.createElement('button'), {
      type: 'button',
      innerText: 'Next',
      onclick: () => {
        this.next()
      }
    }))

    // TODO make better layout
    const cellPx = 32
    const transitionMs = 100
    this.#boardView = new BoardView(makeInitialBoard(), container, cellPx, transitionMs)
  }

  next() {
    const view = this.#boardView
    const actions = this.#actions

    if (this.#currentAction < actions.length-1 && !view.inAnimation()) {
      view.animateActionDo(actions[++this.#currentAction])
    }
  }

  prev() {
    const view = this.#boardView
    const actions = this.#actions

    if (this.#currentAction >= 0 && !view.inAnimation()) {
      view.animateActionUndo(actions[this.#currentAction--])
    }
  }
}