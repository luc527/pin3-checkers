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
      zIndex: 3,
      width: '100%',
      height: '100%',
    })
    container.append(this.marksLayer)

    this.piecesLayer = document.createElement('div')
    Object.assign(this.piecesLayer.style, {
      position: 'absolute',
      zIndex: 2,
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

  }

  mark(positions) {
    this.currentMarks?.foreach(m => m.remove())
    this.currentMarks = []

    for (const { row, col } of positions) {
      const mark = document.createElement('div')
      mark.classList.add('board-mark')
      Object.assign(mark.style, {
        width: `${this.cellPx}px`,
        height: `${this.cellPx}px`,
        top: `${this.cellPx * row}px`,
        left: `${this.cellPx * col}px`,
      })

      this.marksLayer.append(mark)
      this.currentMarks.push(mark)
    }
  }

  move(from, to, crown, capture) {
    console.log('move')
    const piece = this.pieces[from.row][from.col]
    this.pieces[from.row][from.col] = null
    this.pieces[to.row][to.col] = piece

    Object.assign(piece.style, {
      top:  `${this.cellPx * to.row}px`,
      left: `${this.cellPx * to.col}px`
    })

    return new Promise((resolve) => {
      setTimeout(() => {
        if (!crown && !capture) {
          resolve()
        } else {
          if (crown) {
            piece.classList.remove('pawn')
            piece.classList.add('king')
          }
          if (capture) {
            const captured = this.pieces[capture.row][capture.col]
            this.pieces[capture.row][capture.col] = null
            captured.style.opacity = 0
            setTimeout(() => {
              captured.remove()
            }, this.transitionMs)
          }
          setTimeout(() => {
            resolve()
          }, this.transitionMs)
        }
      }, this.transitionMs)
    })
  }
}