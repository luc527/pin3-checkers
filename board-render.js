/**
 * Takes an empty table and creates the rows/cells to represent a board
 * Already creates a piece element in all board cells
 * so to render a particular board we just toggle the visibility and classes of the pieces.
 * 
 * @param {HTMLTableElement} tableElem
 * @param {boolean} overlayCoords Whether to overlay coordinates over the cells (like "r0 c7")
 * 
 * @return {Array} Piece elements indexed by position
 */
export function createBoardTable(tableElem, overlayCoords=true) {
  tableElem.setAttribute('cellspacing', 0)
  const elemMatrix = Array(8)

  for (let i = 0; i < 8; i++) {
    elemMatrix[i] = Array(8)

    const rowElem = document.createElement('tr')
    rowElem.classList.add('board-row')

    for (let j = 0; j < 8; j++) {
      const cellElem = document.createElement('td');
      const cellColorClass = (i + j + 1) % 2 == 0 ? 'white' : 'black';
      cellElem.classList.add('board-cell', cellColorClass)

      const pieceElem = document.createElement('div')
      pieceElem.classList.add('piece')
      pieceElem.style.visibility = 'hidden'

      elemMatrix[i][j] = pieceElem

      cellElem.append(pieceElem)

      if (overlayCoords) {
        const text = document.createElement('span')
        text.classList.add('cell-text')
        text.innerHTML = `r${i}<br>c${j}`;
        cellElem.append(text)
      }

      rowElem.append(cellElem)
    }

    tableElem.append(rowElem)
  }

  return elemMatrix
}

/**
 * @param {Array} board
 * @param {HTMLTableElement} table
 */
export function renderBoard(board, elemMatrix) {
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const elem = elemMatrix[i][j]
      const piece = board[i][j]

      if (!piece) {
        elem.style.visibility = 'hidden'
      } else {
        elem.style.visibility = 'visible'

        elem.classList.remove(piece.king ? 'man' : 'king')
        elem.classList.add(piece.king ? 'king' : 'man')

        elem.classList.remove(piece.white ? 'black' : 'white')
        elem.classList.add(piece.white ? 'white' : 'black')
      }
    }
  }
}