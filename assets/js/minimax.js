import { Status } from './game-state.js'

export class Minimax {
  constructor(maximizeWhite, valueHeuristic, cutoffDepth) {
    this.maximizeWhite = maximizeWhite
    this.valueHeuristic = valueHeuristic
    this.cutoffDepth = cutoffDepth
    this.leafCount = 0
  }

  // leafCount just for getting an idea of how much work the algorithm is doing, could be removed later

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

// TODO could instead just do
//  import * as mm from '/assets/js/minimax.js'
//  const s = 'heuristicCountPieces'
//  mm[s]
export const valueHeuristicFunctions = {
  'heuristicCountPieces': heuristicCountPieces,
  'heuristicClusters': heuristicClusters,
  'heuristicWeighDistance': heuristicWeighDistance,
}

export function heuristicCountPieces(state, maximizeWhite) {
  const { blackPawns, blackKings, whitePawns, whiteKings } = state.pieceCount

  const whiteValue = whitePawns + 2 * whiteKings
  const blackValue = blackPawns + 2 * blackKings

  return maximizeWhite
       ? whiteValue - blackValue
       : blackValue - whiteValue
}

/** 
 * Returns positions containig pieces grouped by clusters (adjacent pieces of the same color) that they belong to.
 * It does so by treating the board as a graph and finding its connected components.
 * 
 * @param Array board The board (8x8 array of {white, king})
 * 
 * @return object Array of clusters, where each cluster is a list of positions
 */
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

export function heuristicWeighDistance({ board }, maximizeWhite) {
  let value = 0

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col]
      if (!piece) continue

      const crowningRow = piece.white ? 0 : 7
      const distance = Math.abs(crowningRow - row) // goes from 0 to 7

      const pieceValue = (piece.king ? 16 : 8) + distance
      const sign = piece.white == maximizeWhite ? 1 : -1

      value += sign * pieceValue
    }
  }

  return value
}

export function heuristicRandom() {
  return Math.random() * 2 - 1  // random number in [-1, 1]
}

export function getHeuristicOptions() {
  return [
    { functionName: 'heuristicCountPieces', title: 'Count pieces' },
    { functionName: 'heuristicClusters', title: 'Clusters' },
    { functionName: 'heuristicWeighDistance', title: 'Weigh distances' },
    { functionName: 'heuristicRandom', title: 'Random' },
  ]
}