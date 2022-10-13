import {serializePosition, positionBetween} from '/assets/js/board.js'
export default class BoardView {

  constructor(board, container, cellPx=64, transitionMs=500) {

    this.transitionMs = transitionMs

    // Container has width and height set
    // so layers can have width: 100% and height: 100%
    // so pieces can have heights and widths relative to the board size (like calc(1/8 * 1/2 * 100%)))

    Object.assign(container.style, {
      position: 'relative',
      width: `${cellPx * 8}px`,
      height: `${cellPx * 8}px`,
    });

    const table = document.createElement('table')
    table.classList.add('board-table')
    table.setAttribute('cellspacing', 0)

    this.cellPx = cellPx

    this.marksLayer = document.createElement('div')
    Object.assign(this.marksLayer.style, {
      position: 'absolute',
      zIndex: 30,
      width: '100%',
      height: '100%',
    })
    container.append(this.marksLayer)

    this.currentMarks = []
    this.isMarked = new Set()

    this.piecesLayer = document.createElement('div')
    Object.assign(this.piecesLayer.style, {
      position: 'absolute',
      zIndex: 20,
      width: '100%',
      height: '100%',
    })
    container.append(this.piecesLayer)

    container.append(table)

    this.cells = Array(8)
    this.pieces = Array(8)

    for (let i=0; i<8; i++) {
      const row = document.createElement('tr')
      table.append(row)

      row.classList.add('board-row')

      this.cells[i] = Array(8)
      this.pieces[i] = Array(8)

      for (let j=0; j<8; j++) {
        const cell = document.createElement('td')
        row.append(cell)

        cell.classList.add('board-cell')
        cell.style.width = `${cellPx}px`;
        cell.style.height = `${cellPx}px`;
        cell.style.maxWidth = `${cellPx}px`;
        cell.style.maxHeight = `${cellPx}px`;

        cell.classList.add((i + j) % 2 == 0 ? 'cell-light' : 'cell-dark')

        this.cells[i][j] = cell
        this.pieces[i][j] = null

        if (board[i][j]) {
          this.#addPiece(board[i][j], i, j)
        }
      }
    }

    this.container = container
  }

  #addPiece(piece, row, col) {
    const { white, king } = piece

    const elem = document.createElement('div')
    elem.classList.add(
      'piece',
      white ? 'white' : 'black',
      king ? 'king' : 'pawn'
    )
    Object.assign(elem.style, {
      top: `${this.cellPx * row}px`,
      left: `${this.cellPx * col}px`,
      transition: `all ${this.transitionMs}ms ease-in-out`,
    });

    this.pieces[row][col] = elem
    this.piecesLayer.append(elem)

    return elem
  }

  clearMarks() {
    this.currentMarks.forEach(m => m.remove())
    this.isMarked.clear()
    this.currentMarks = []
  }

  addMark(position) {
    const serializedPosition = serializePosition(position)
    if (this.isMarked.has(serializedPosition)) return
    this.isMarked.add(serializePosition(position))

    const mark = document.createElement('div')
    mark.classList.add('board-mark')
    Object.assign(mark.style, {
      width: `${this.cellPx}px`,
      height: `${this.cellPx}px`,
      top: `${this.cellPx * position.row}px`,
      left: `${this.cellPx * position.col}px`,
    })

    this.marksLayer.append(mark)
    this.currentMarks.push(mark)
  }

  hasMark(position) {
    return this.isMarked.has(serializePosition(position))
  }

  resetMarks(positions) {
    this.clearMarks()
    positions.forEach(pos => this.addMark(pos))
  }

  onClick(callback) {
    this.container.addEventListener('click', event => {
      // this call goes inside, the container coordinates might change if the window is resized!
      const { x: containerX, y: containerY } = this.container.getBoundingClientRect()
      if (event.button === 0) {
        const row = Math.trunc((event.clientY - containerY) / this.cellPx)
        const col = Math.trunc((event.clientX - containerX) / this.cellPx)
        const marked = this.isMarked.has(serializePosition({ row, col }))
        callback(row, col, marked, event)
      }
    });
  }

  #animateSingle(item) {
    switch (item.type) {
      case 'move': {
        const { from, to } = item

        const moved = this.pieces[from.row][from.col]
        this.pieces[from.row][from.col] = null
        this.pieces[to.row][to.col] = moved

        Object.assign(moved.style, {
          top:  `${this.cellPx * to.row}px`,
          left: `${this.cellPx * to.col}px`
        })
      } break;
      case 'crown': {
        const { row, col } = item
        const piece = this.pieces[row][col]
        piece.classList.remove('pawn')
        piece.classList.add('king')
      } break;
      case 'uncrown': {
        const { row, col } = item
        const piece = this.pieces[row][col]
        piece.classList.remove('king')
        piece.classList.add('pawn')
      } break;
      case 'remove': {
        const { row, col } = item
        const piece = this.pieces[row][col]
        piece.style.opacity = 0;
        return () => piece.remove()
      } break;
      case 'restore': {
        const { row, col, piece } = item
        const elem = this.#addPiece(piece, row, col)
        elem.style.opacity = 0
        setTimeout(() => elem.style.opacity = 1, 10)
      } break;
    }
  }

  animate(...items) {
    if (!items) return Promise.resolve();
    const postActions = items.map(it => this.#animateSingle(it)).filter(it => it)
    return new Promise(resolve => {
      setTimeout(() => {
        postActions.forEach(it => it())
        resolve()
      }, this.transitionMs)
    })
  }

  async animateActionDo(action) {
    let { from } = action
    const { sequence } = action
    const { crowned } = action.undoInfo
    const captured = Array.from(action.undoInfo.captured)
    // ^ make a copy so we don't corrupt action.undoInfo

    for (const to of sequence) {
      const items = [ { type: 'move', from, to } ]
      const toCapture = captured.length > 0 && positionBetween(captured[0], from, to)
                      ? captured.shift()
                      : null
      if (toCapture) {
        items.push({ type: 'remove', ...toCapture })
      }
      await this.animate(...items)

      from = to
    }

    const toCrown = crowned ? sequence[sequence.length-1] : null
    if (toCrown) {
      await this.animate({ type: 'crown', ...toCrown })
    }
  }

  async animateActionUndo(action) {
    const { from, sequence } = action
    const { crowned } = action.undoInfo
    const captured = Array.from(action.undoInfo.captured)

    if (crowned) {
      const { row, col } = sequence[sequence.length-1]
      await this.animate({ type: 'uncrown', row, col })
    }

    const reversedSequence = sequence.slice(0, sequence.length-1).reverse()
    reversedSequence.push(from)

    let src = sequence[sequence.length-1]
    for (const dest of reversedSequence) {
      const items = [ { type: 'move', from: src, to: dest }]

      const n = captured.length
      const toRestore = n > 0 && positionBetween(captured[n-1], src, dest)
                      ? captured.pop()
                      : null
      if (toRestore) {
        items.push({ type: 'restore', ...toRestore })
      }

      await this.animate(...items)

      src = dest
    }
  }
}