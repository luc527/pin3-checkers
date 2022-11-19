import * as fs from 'fs'

const depths = [
  3,
  5,
  7,
  9,
  11,
  13,
]

const rules = [
  0, //CaptureOptions.notMandatory,
  1, //CaptureOptions.mandatory,
  3, //CaptureOptions.bestMandatory,
]

const heuristicPairs = [
  [ 'heuristicCountPiecesWeighted', 'heuristicClusters' ],
  [ 'heuristicCountPiecesWeighted', 'heuristicWeighDistance' ],
  [ 'heuristicClusters', 'heuristicWeighDistance' ],
]

const runs = 50

const configArray = []

for (const rule of rules) {
  for (const depth of depths) {
    for (const [ whiteHeur, blackHeur ] of heuristicPairs) {
      const config = {
        runs,
        players: {
          white: { function: whiteHeur, depth },
          black: { function: blackHeur, depth },
        },
        rule
      }
      configArray.push(config)
    }
  }
}

const outputFile = process.argv[2] ?? './config.json'

fs.writeFileSync(outputFile, JSON.stringify(configArray, null, '  '))
