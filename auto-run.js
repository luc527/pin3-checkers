import * as fs from 'fs'
import * as minimax from './assets/js/minimax.js'
import { CheckersState, Status } from './assets/js/game-state.js'
import { CaptureOptions } from './assets/js/move-generation.js'

function statusToString(status) {
  switch (status) {
    case Status.whiteWon:
      return 'white'
    case Status.blackWon:
      return 'black'
    case Status.draw:
      return 'draw'
  }
}

function ruleToString(rule) {
  switch (rule) {
    case CaptureOptions.notMandatory:
      return 'notMandatory';
    case CaptureOptions.mandatory:
      return 'mandatory';
    case CaptureOptions.bestMandatory:
      return 'bestMandatory';
  }
}

class GameResult {
  // params: { whiteHeur, whiteDepth, blackHeur, blackDepth, rule }
  // winner: 'white' | 'black' | 'draw"
  // moves: int
  // pieceCount: { whitePawns, whiteKings, blackPawns, blackKings }
  constructor(params, winner, moves, pieceCount) {
    this.params = params
    this.winner = winner
    this.moves = moves
    this.pieceCount = pieceCount
  }

  toCSV() {
    return [
      this.params.whiteHeur,
      this.params.whiteDepth,
      this.params.blackHeur,
      this.params.blackDepth,
      ruleToString(this.params.rule),
      this.winner,
      this.moves,
      this.pieceCount.whitePawns,
      this.pieceCount.whiteKings,
      this.pieceCount.blackPawns,
      this.pieceCount.blackKings,
    ].join(',');
  }
}

function runGame(whiteHeur, whiteDepth, blackHeur, blackDepth, captureOptions) {

  console.log('runGame', whiteHeur, whiteDepth, blackHeur, blackDepth, captureOptions)

  const whiteHeurFunction = minimax[whiteHeur]
  const blackHeurFunction = minimax[blackHeur]

  const whitePlayer = new minimax.Minimax(true, whiteHeurFunction, whiteDepth)
  const blackPlayer = new minimax.Minimax(false, blackHeurFunction, blackDepth)
  const state = new CheckersState(captureOptions)

  let moves = 0
  let currentPlayer = whitePlayer

  while (state.status == Status.playing) {
    const { action } = currentPlayer.val(state)
    state.actionDo(action)
    moves++
    currentPlayer = currentPlayer == whitePlayer ? blackPlayer : whitePlayer
  }

  return {
    winner: statusToString(state.status),
    moves,
    pieceCount: state.pieceCount
  }
}

const inputPath = process.argv[2] ?? 'config.json'
let gameConfigArray = JSON.parse(fs.readFileSync(inputPath, 'utf8'))

if (!Array.isArray(gameConfigArray)) {
  gameConfigArray = [gameConfigArray];
}

const results = []

for (const config of gameConfigArray) {
  const whiteHeur = config.players['white'].function
  const whiteDepth = config.players['white'].depth
  const blackHeur = config.players['black'].function
  const blackDepth = config.players['black'].depth
  const rule = config.rule

  const params = { whiteHeur, whiteDepth, blackHeur, blackDepth, rule }

  const runs = config.runs

  for (let run = 1; run <= runs; run++) {
    const { winner, moves, pieceCount } = runGame(whiteHeur, whiteDepth, blackHeur, blackDepth, rule)
    const result = new GameResult(params, winner, moves, pieceCount)
    results.push(result)
  }
}

// import to sqlite:
// .read schema.sql
// .separator ","
// .import results.csv game_results

let output = 'first-ai-function, first-ai-depth,second-ai-function, second-ai-depth, game-rule, winner, moves, white-pawns, white-kings, black-pawns, black-kings\n'
for (const result of results) {
  output += result.toCSV() + '\n'
}

const outputPath = process.argv[3] ?? './results.csv'
fs.writeFileSync(outputPath, output)
