import { runGame, GameResult } from './game-result.js'
import * as fs from 'fs'


const depths = [
  4,
  5,
  6,
  7,
  8,
  9,
  10
];

const heuristicPairs = [
  [ 'heuristicCountPiecesWeighted', 'heuristicCountPieces' ],
  [ 'heuristicCountPiecesWeighted', 'heuristicWeighDistance' ],
  [ 'heuristicCountPiecesWeighted', 'heuristicClusters' ],

  [ 'heuristicCountPieces', 'heuristicWeighDistance' ],
  [ 'heuristicCountPieces', 'heuristicClusters' ],

  [ 'heuristicWeighDistance', 'heuristicClusters' ],
];

const rules = [
  1,
  3
];

const runs = 50;

const results = [];

const totalConfigs = depths.length * heuristicPairs.length * rules.length;
const totalGames = totalConfigs * runs;

let currGame = 1;

for (const depth of depths) {
  for (const [ whiteHeur, blackHeur ] of heuristicPairs) {
    for (const rule of rules) {
      for (let run = 0; run < runs; run++) {
        const progressPercentage = ((currGame / totalGames) * 100).toFixed(1) + '%';
        const progress = `${progressPercentage} (${currGame}/${totalGames})`;
        console.log(`${progress} ${whiteHeur}  x  ${blackHeur}, depth ${depth}, rule ${rule}`);

        const { winner, moves, pieceCount, duration } = runGame(whiteHeur, depth, blackHeur, depth, rule);
        const params = {
          whiteHeur,
          whiteDepth: depth,
          blackHeur,
          blackDepth: depth,
          rule,
        }
        const result = new GameResult(params, winner, moves, pieceCount, duration);
        results.push(result);

        currGame++;
      }
    }
  }
}

let output = '';
for (const result of results) {
  output += result.toCSV() + '\n';
}

const outpath = process.argv[2] ?? './against-eachother-results.csv';

fs.writeFileSync(outpath, output);
