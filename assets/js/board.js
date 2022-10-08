/**
 * Functions that create / read / alter board states
 */

/**
 * --- Board definition:
 * 8x8 matrix
 * null represents an empty cell
 * { white: boolean, king: boolean } represents a cell containing a piece
 */

export function makeEmptyBoard() {
  const board = Array(8)
  for (let i = 0; i < 8; i++) {
    board[i] = Array(8)
  }
  return board
}

export function makeInitialBoard() {
  const board = makeEmptyBoard()

  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 8; j++) {
      if ((i + j) % 2 != 0) {
        board[i][j] = { white: false, king: false }
      }
    }
  }

  for (let i = 5; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      if ((i + j) % 2 != 0) {
        board[i][j] = { white: true, king: false }
      }
    }
  }

  return board
}

export function copyBoard(b0) {
  const b1 = new Array(8)
  for (let i = 0; i < 8; i++) {
    b1[i] = new Array(8)
  }

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const p0 = b0[i][j];
      b1[i][j] = p0 == null ? null : { white: p0.white, king: p0.king }
    }
  }

  return b1
}

export function areBoardsEqual(b0, b1) {
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const p0 = b0[i][j];
      const p1 = b1[i][j];

      if (p0 == null && p1 == null) return true
      if (p0 == null) return false
      if (p1 == null) return false
      if (p0.white != p1.white) return false
      if (p0.king != p1.king) return false
    }
  }
  return true
}

/**
 * --- Move do-ing and undo-ing
 */

// First, some helpers for better error messages

// We can turn off (comment out) the "validate ..." functions for efficiency once we're confident the functions they test work correctly

export function inbounds(pos) {
  return pos.row >= 0 && pos.row <= 7 && pos.col >= 0 && pos.col <= 7
}

export function positionString(pos) {
  return `{row: ${pos.row}, col: ${pos.col}}`
}

export function validatePosition(pos, name) {
  if (!inbounds(pos)) {
    throw new Error(`position ${ name ? name+' ' : '' }out of bounds`)
  }
}

export function validatePositionList(list, listName) {
  for (let i=0; i<list.length; i++) {
    validatePosition(list[i], listName+'['+i+']')
  }
}

export function validateMove(board, src, dst) {
  validatePosition(src, 'source')
  validatePosition(dst, 'destination')
  const diagonal = Math.abs(src.row - dst.row) == Math.abs(src.col - dst.col)
  if (!diagonal) {
    throw new Error(`move from ${positionString(src)} to ${positionString(dst)} is not diagonal`)
  }
  if (board[src.row][src.col] == null) {
    throw new Error(`moving empty piece from >${positionString(src)}< to ${positionString(dst)} in\n`+ encodeBoard(board))
  }
  if (board[dst.row][dst.col]) {
    throw new Error(`moving onto non-empty piece from ${positionString(src)} to >${positionString(dst)}< in\n`+ encodeBoard(board))
  }
}

/**
 * A single move is just a movement between a pair of positions.
 * They are not always valid game moves. The functions are used
 * to perform the 'full' moves, which are valid game moves, and
 * also for generating them (see getCaptureSequencesImpl).
 */

/**
 * Performs a move from 'src' to 'dst' modifying the given board.
 * Also captures the piece between 'src' and 'dst', and returns its info ({ row, col, { white, king } })
 */
export function singleMoveDo(board, src, dst) {
  validateMove(board, src, dst)

  let captured = null
  if (Math.abs(src.row - dst.row) > 1) {
    const rowStep = dst.row > src.row ? 1 : -1
    const colStep = dst.col > src.col ? 1 : -1
    // find captured piece, save it, and make the capture
    const mid = { row: src.row + rowStep, col: src.col + colStep }
    while (mid.row != dst.row) {
      const midPiece = board[mid.row][mid.col]
      if (midPiece != null) {
        captured = { row: mid.row, col: mid.col, piece: midPiece }
        break
      }
      mid.row += rowStep
      mid.col += colStep
    }
  }
  if (captured != null) {
    board[captured.row][captured.col] = null
  }

  const piece = board[src.row][src.col]
  board[dst.row][dst.col] = piece
  board[src.row][src.col] = null

  return captured
}

/**
 * Un-does a move from 'src' to 'dst', also un-doing the capture described in 'captured'.
 */
export function singleMoveUndo(board, src, dst, captured) {
  validateMove(board, dst, src)

  if (captured != null) {
    board[captured.row][captured.col] = captured.piece
  }
  const piece = board[dst.row][dst.col]
  board[dst.row][dst.col] = null
  board[src.row][src.col] = piece
}

/**
 * Performs a move starting at 'src' and moving to each position in 'sequence'
 * by modifying the given board. Performs captures and crowns the piece if it
 * ends up at the opposite last row. Returns {crowned, captured}, where
 * 'crowned' is the position the piece ended up (last of 'sequence') if it turned into a king, null otherwise (can be used as a boolean), and
 * 'captured' is a {row, col, {white, king}} array describing the pieces that got captured. */
export function fullMoveDo(board, src, sequence) {
  validatePosition(src, 'src')
  validatePositionList(sequence, 'sequence')

  const captured = []
  let crowned = null

  const piece = board[src.row][src.col]

  for (const dst of sequence) {
    const singleCaptured = singleMoveDo(board, src, dst)
    if (singleCaptured != null) captured.push(singleCaptured)
    src = dst
  }

  const final = sequence[sequence.length-1]
  const crown = piece.white ? final.row == 0 : final.row == 7
  if (!piece.king && crown) {
    crowned = final
    board[final.row][final.col].king = true
  }

  return { crowned, captured }
}

/**
 * Un-does a move starting at 'src' moving to each position in 'sequence'.
 * Also demotes the piece if crowned=true and restores the captured pieces
 * in 'captured' (i.e. also un-does crownings and captures).
 */
export function fullMoveUndo(board, src, sequence, { crowned, captured }) {
  validatePosition(src, 'src')
  validatePositionList(sequence, 'sequence')

  const final = sequence[sequence.length-1]
  if (crowned) {
    board[final.row][final.col].king = false
  }
  // Restore
  if (src.row != final.row || src.col != final.col) {
    const piece = board[final.row][final.col]
    board[src.row][src.col] = piece
    board[final.row][final.col] = null
  }

  // This needs to be done after the restore
  // It's possible that the moving piece ends up on the same position a captured piece was ('final')
  // If we first run the loop below, it'll end up overwriting the moving piece at 'final'
  for (const cap of captured) {
    board[cap.row][cap.col] = cap.piece
  }
}

/**
 * Iterates through the given board to find which positions have pieces
 * of the given player. Returns these positions (whithout the pieces, i.e. a {row, col} array).
 */
export function getPlayerPiecePositions(board, playerWhite) {
  const result = []
  for (let row=0; row<8; row++) {
    for (let col=0; col<8; col++) {
      const piece = board[row][col]
      if (piece && piece.white == playerWhite) {
        result.push({row, col})
      }
    }
  }
  return result
}

/**
 * Counts pieces grouped by kind (white or black, pawn or king)
 */
export function countPieces(board) {
  let blackPawns = 0
  let blackKings = 0
  let whitePawns = 0
  let whiteKings = 0

  for (let i=0; i<8; i++) {
    for (let j=0; j<8; j++) {
      if (!board[i][j]) continue
      const piece = board[i][j]

      if (piece.white) {
        if (piece.king) whiteKings++; else whitePawns++;
      } else {
        if (piece.king) blackKings++; else blackPawns++;
      }
    }
  }
  return { blackPawns, blackKings, whitePawns, whiteKings };
}

/**
 * Encodes the given board as a string
 */
export function encodeBoard(board) {
  let enc = '';
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = board[i][j];
      if (piece) {
        if (piece.white) enc += piece.king ? '@' : 'o';
        else             enc += piece.king ? '#' : 'x';
      } else {
        enc += '.';
      }
    }
    if (i < 7) enc += '\n';
  }
  return enc
}

/**
 * Decodes the given string as a board
 */
export function decodeBoard(str) {
  const board = makeEmptyBoard()

  const rows = str.split('\n');
  const rowsLen = Math.min(8, rows.length);

  let i;
  for (i = 0; i < rowsLen; i++) {
    const cols = rows[i].split('');
    if (cols.length < 8) return null;

    for (let j = 0; j < 8; j++) {
      const ch = cols[j];
      switch (ch) {
        case 'x': board[i][j] = { white: false, king: false }; break;
        case '#': board[i][j] = { white: false, king: true }; break;
        case 'o': board[i][j] = { white: true,  king: false }; break;
        case '@': board[i][j] = { white: true,  king: true }; break;
        case '.': default: board[i][j] = null; break;
      }
    }
  }
  // explicitely fill the rest of the board, so it's null, not undefined
  for (; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      board[i][j] = null
    }
  }
  return board
}

/**
 * Functions on coordinates/positions
 */

export function serializePosition(pos) {
  return pos.row * 8 + pos.col;
}

export function deserializePosition(x) {
  return {
    row: Math.floor(x / 8),
    col: x % 8
  };
}

function numberBetween(x, a, b) {
  return (a < b && a < x && x < b)
      || (b < a && b < x && x < a)
}

export function positionBetween(x, a, b) {
  return numberBetween(x.row, a.row, b.row)
      && numberBetween(x.col, a.col, b.col)
}