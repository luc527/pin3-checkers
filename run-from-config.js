import * as fs from 'fs'
import { runGame, GameResult } from './game-result.js'

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

for (const result of results) {
  output += result.toCSV() + '\n'
}

const outputPath = process.argv[3] ?? './results.csv'
fs.writeFileSync(outputPath, output)
