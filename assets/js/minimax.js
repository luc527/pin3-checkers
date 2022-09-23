import { Status } from './game-state.js'

export class Minimax {
  constructor(maximizeWhite, valueHeuristic, cutoffDepth) {
    this.maximizeWhite = maximizeWhite
    this.valueHeuristic = valueHeuristic
    this.cutoffDepth = cutoffDepth
    this.leafCount = 0
  }

  // leafCount for debugging, could be removed later

  resetLeafCount() {
    this.leafCount = 0
  }

  getLeafCount() {
    return this.leafCount
  }

  val(state, depth=0, alpha=-Infinity, beta=+Infinity) {
    if (depth >= this.cutoffDepth) {
      this.leafCount++
      return { value: this.valueHeuristic(state, this.maximizeWhite) }
    }

    if (state.status != Status.playing) { //terminal
      let value
      const WIN = +1000
      const LOSS = -1000
      switch (state.status) {
        case Status.draw: value = 0; break;
        case Status.whiteWon: value = this.maximizeWhite ? WIN : LOSS; break;
        case Status.blackWon: value = this.maximizeWhite ? LOSS : WIN; break;
      }

      this.leafCount++
      return { value }
    }

    const actions = state.actions

    if (depth == 0 && actions.length == 1) { //no choice
      this.leafCount++
      return { action: actions[0], value: 0 }
    }

    const maximizing = state.whiteToMove == this.maximizeWhite

    let value = maximizing ? -Infinity : +Infinity
    let actionTaken = null

    for (const action of actions) {
      state.actionDo(action)

      const { value: subValue } = this.val(state, depth+1, alpha, beta)

      if (maximizing) {
        if (subValue > value) {
          actionTaken = action
          value = subValue
        }

        alpha = Math.max(alpha, subValue)

        if (subValue >= beta) {
          state.actionUndo(action)
          this.leafCount++
          return { value, action: actionTaken };
        }
      } else {
        if (subValue < value) {
          actionTaken = action
          value = subValue
        }
        
        beta = Math.min(beta, subValue)

        if (subValue <= alpha) {
          state.actionUndo(action)
          this.leafCount++
          return { value, action: actionTaken }
        }
      }

      state.actionUndo(action)
    }

    this.leafCount++
    return { value, action: actionTaken }
  }
}

export const valueHeuristicFunctions = {
  'heuristicCountPieces': heuristicCountPieces,
  'heuristicClusters': heuristicClusters,
}

// TODO doc
export function heuristicCountPieces(state, maximizeWhite) {
  const board = state.board

  let boardValue = 0

  for (let i=0; i<8; i++) {
    for (let j=0; j<8; j++) {
      if (!board[i][j]) continue
      const piece = board[i][j]
      const value = piece.king ? 2 : 1
      const sign = piece.white === maximizeWhite ? 1 : -1
      boardValue += sign * value
    }
  }

  return boardValue
}

// TODO doc -- not a heuristic, but used in heuristicClusters
function sameColorPieceClusters(board) {
  // for using positions as keys in the clusterOf Map
  function k(row, col) { return row * 8 + col }
  // for retrieving positions objects from keys
  function p(key) { return { row: Math.floor(key / 8), col: key % 8} }

  const clusterOf = new Map()
  let clusterCount = 0

  function dfs(row, col, white) {
    clusterOf.set(k(row, col), clusterCount)
    for (const rowOffset of [-1, 1]) {
      for (const colOffset of [-1, 1]) {
        // neighbour position
        const nrow = row + rowOffset 
        const ncol = col + colOffset
        if (nrow < 0 || nrow > 7 || ncol < 0 || ncol > 7) continue

        const npiece = board[nrow][ncol]
        if (npiece && npiece.white == white && !clusterOf.has(k(nrow, ncol))) {
          dfs(nrow, ncol, white)
        }
      }
    }
  }

  for (let i=0; i<8; i++) {
    for (let j=0; j<8; j++) {
      const piece = board[i][j]
      if (!piece) continue
      if (clusterOf.has(k(i, j))) continue
      dfs(i, j, piece.white)
      clusterCount++
    }
  }

  const clusters = Array(clusterCount)
  for (let i=0; i<clusterCount; i++) {
    clusters[i] = []
  }

  for (const [key, clusterId] of clusterOf.entries()) {
    clusters[clusterId].push(p(key))
  }

  return clusters
}

// TODO doc
export function heuristicClusters(state, maximizeWhite) {

  let value = 0

  for (const cluster of sameColorPieceClusters(state.board)) {
    let pieceCountValue = 0
    for (const {row, col} of cluster) {
      pieceCountValue += state.board[row][col].king ? 2 : 1
    }

    // this makes clusters VERY valuable
    // const clusterFactor = cluster.length

    // divided by 12 makes it so clusters are never more valuable than a piece
    // (e.g. if we had clusterFactor=1+cluster.length/3
    // then a cluster of 4 pieces would be more valuable than 5 piece far apart)
    // but it's enough for a clustered configuration of n pieces to be more valuable than n pieces far apart
    const clusterFactor = 1 + cluster.length / 12
    // maybe could 'damp' the cluster.length/12 factor, because very large clusters aren't that much better than smaller clusters
    // or do something like 1 + Math.min(4, cluster.length) / 4, so clusters bigger than 4 aren't better than clusters of size 4

    // clusterFactor=1 in particular makes this heuristic equal to heuristicCountPieces

    const fst = cluster[0]
    const sign = state.board[fst.row][fst.col].white == maximizeWhite ? 1 : -1

    value += sign * clusterFactor * pieceCountValue
  }

  return value
}