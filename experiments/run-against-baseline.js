import { runGame, GameResult } from './game-result.js'
import * as fs from 'fs'

const depths = [
  5,
  6,
  7,
  8,
  9,
  10,
]

const heuristics = [
  'heuristicCountPiecesWeighted',
  'heuristicWeighDistance',
  'heuristicClusters'
]

const baselineHeuristic = 'heuristicCountPieces'

const rules = [
  // 0,  // notMandatory  // too slow!
  1,  // mandatory
  3,  // bestMandatory
]

const runs = 50

const results = []

for (const depth of depths) {
  for (const heuristic of heuristics) {
    for (const rule of rules) {
      for (let i = 0; i < runs; i++) {
        const whiteHeur = baselineHeuristic
        const blackHeur = heuristic

        const params = {
          whiteHeur,
          whiteDepth: depth,
          blackHeur,
          blackDepth: depth,
          rule
        }

        console.log(`Playing against ${heuristic}, depth ${depth}, rule ${rule}`)
        
        const { winner, moves, pieceCount } = runGame(whiteHeur, depth, blackHeur, depth, rule)
        const result = new GameResult(params, winner, moves, pieceCount)
        results.push(result)

      }
    }
  }
}

let output = ''
for (const result of results) {
  output += result.toCSV() + '\n'
}

const outputPath = process.argv[2] ?? './against-baseline-results.csv'

fs.writeFileSync(outputPath, output)
