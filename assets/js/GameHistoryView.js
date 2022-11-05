import BoardView from '/assets/js/BoardView.js'
import {makeInitialBoard} from '/assets/js/board.js'

export default class GameHistoryView {

  #actions
  #boardView
  #currentAction = -1

  constructor(actions, container) {
    this.#actions = actions

    const previousBtn = Object.assign(document.createElement('button'), {
      type: 'button',
      innerText: 'Previous',
      onclick: () => {
        this.prev()
    }})
    previousBtn.classList.add('btn-primary')

    const nextBtn = Object.assign(document.createElement('button'), {
      type: 'button',
      innerText: 'Next',
      onclick: () => {
        this.next()
      }
    })
    nextBtn.classList.add('btn-primary')

    const btnGroup = document.createElement('div')
    btnGroup.append(previousBtn)
    btnGroup.append(nextBtn)
    btnGroup.classList.add('history-container-btn-group')

    container.append(btnGroup)

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