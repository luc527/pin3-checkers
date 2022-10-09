import {serializePosition, positionBetween} from '/assets/js/board.js'
export default class BoardView {

  transitionMs = 500

  constructor(board, container, cellPx=64) {

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
          const { white, king } = board[i][j]

          const piece = document.createElement('div')
          piece.classList.add(
            'piece',
            white ? 'white' : 'black',
            king ? 'king' : 'pawn'
          )
          Object.assign(piece.style, {
            top: `${this.cellPx * i}px`,
            left: `${this.cellPx * j}px`,
            transition: `all ${this.transitionMs}ms ease-in-out`
          });

          this.pieces[i][j] = piece
          this.piecesLayer.append(piece)
        }
      }
    }

    this.container = container
  }

  clearMarks() {
    this.currentMarks.forEach(m => m.remove())
    this.isMarked.clear()
    this.currentMarks = []
  }

  addMark(position) {
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
    this.isMarked.add(serializePosition(position))
  }

  hasMark(position) {
    return this.isMarked.has(serializePosition(position))
  }

  resetMarks(positions) {
    this.clearMarks()
    positions.forEach(pos => this.addMark(pos))
  }

  onClick(callback) {
    const { x: containerX, y: containerY } = this.container.getBoundingClientRect()
    this.container.addEventListener('click', event => {
      if (event.button === 0) {
        const row = Math.trunc((event.clientY - containerY) / this.cellPx)
        const col = Math.trunc((event.clientX - containerX) / this.cellPx)
        const marked = this.isMarked.has(serializePosition({ row, col }))
        callback(row, col, marked, event)
      }
    });
  }

  transition(from, to, capture, crown) {
    if (!(from && to) && !crown && !capture) {
      return Promise.resolve()
    }

    let moved = null
    if (from && to) {
      moved = this.pieces[from.row][from.col]
      this.pieces[from.row][from.col] = null
      this.pieces[to.row][to.col] = moved

      Object.assign(moved.style, {
        top:  `${this.cellPx * to.row}px`,
        left: `${this.cellPx * to.col}px`
      })

      // So it moves _over_ captured pieces
      // TODO this doesn't seem to be working, but it doesn't look too bad with the opacity of the captured piece going down, so just remove it maybe?
      moved.style.zIndex = 5
    }

    if (crown) {
      const piece = this.pieces[crown.row][crown.col]
      piece.classList.remove('pawn')
      piece.classList.add('king')
    }

    let captured = null
    if (capture) {
      captured = this.pieces[capture.row][capture.col]
      this.pieces[capture.row][capture.col] = null
      captured.style.opacity = 0
    }

    return new Promise(resolve => {
      setTimeout(() => {
        captured?.remove()
        if (moved) delete moved.style.zIndex
        resolve()
      }, this.transitionMs)
    })
  }

  async animateMove(from, sequence, captures, crown) {
    let source = from

    for (const destination of sequence) {

      const toCapture = captures.length > 0 && positionBetween(captures[0], source, destination)
                      ? captures.shift()
                      : null

      await this.transition(source, destination, toCapture, null)

      source = destination
    }

    // Crown if needed, and also animate any leftover captures
    const toCrown = crown ? sequence[sequence.length-1] : null
    await this.transition(null, null, null, toCrown)
  }

  // shortcurt
  async animateAction(action) {
    return this.animateMove(action.from, action.sequence, action.undoInfo.captured, action.undoInfo.crowned)
  }
}