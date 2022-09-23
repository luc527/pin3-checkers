export default class BoardView {

  constructor(tableElem, overlayCoords = false) {
    tableElem.setAttribute('cellspacing', 0)
    const pieceMatrix = Array(8)

    for (let i = 0; i < 8; i++) {
      pieceMatrix[i] = Array(8)

      const rowElem = document.createElement('tr')
      rowElem.classList.add('board-row')

      for (let j = 0; j < 8; j++) {
        const cellElem = document.createElement('td');
        cellElem.id = `${i}-${j}`
        const cellColorClass = (i + j) % 2 == 0 ? 'white' : 'black'
        cellElem.classList.add('board-cell', cellColorClass)

        const pieceElem = document.createElement('div')
        pieceElem.classList.add('piece')
        pieceElem.style.visibility = 'hidden'

        pieceMatrix[i][j] = pieceElem

        cellElem.append(pieceElem)

        if (overlayCoords) {
          const text = document.createElement('span')
          text.classList.add('cell-text')
          text.innerHTML = `r${i}<br>c${j}`
          cellElem.append(text)
        }

        rowElem.append(cellElem)
      }

      tableElem.append(rowElem)
    }

    this.pieceMatrix = pieceMatrix
  }

  render(board) {
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const elem = this.pieceMatrix[i][j]
        const piece = board[i][j]

        if (!piece) {
          elem.style.visibility = 'hidden'
        } else {
          elem.style.visibility = 'visible'

          elem.classList.remove(piece.king ? 'pawn' : 'king')
          elem.classList.add(piece.king ? 'king' : 'pawn')

          elem.classList.remove(piece.white ? 'black' : 'white')
          elem.classList.add(piece.white ? 'white' : 'black')
        }
      }
    }
  }
}