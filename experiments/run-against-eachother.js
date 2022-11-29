import { runGame, GameResult } from './game-result.js'
import * as fs from 'fs'


const depthRunsPairs = [
    [  7, 101 ],
    [  8,  71 ],
    [  9,  41 ],
    [ 10,  11 ]
];

const heuristics = [
    'heuristicCountPieces',
    'heuristicCountPiecesWeighted',
    'heuristicClusters',
    'heuristicWeighDistance',
];

const heuristicPairs = [];

for (const whiteHeur of heuristics) {
    for (const blackHeur of heuristics) {
        if (whiteHeur == blackHeur) continue
        heuristicPairs.push([ whiteHeur, blackHeur ])
    }
}

const rules = [
  1,
  3
];

const results = [];

const totalGames =
    rules.length *
    heuristicPairs.length *
    depthRunsPairs.reduce((a, [d, r]) => a + r, 0);

let currGame = 1;

for (const [ depth, runs ] of depthRunsPairs) {
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
