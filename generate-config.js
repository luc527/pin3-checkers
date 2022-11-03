import * as fs from 'fs'

const depths = [...Array(20).keys()]

// const depths = [
//   3,
//   5,
//   7,
//   9,
//   11,
//   13,
//   15,
//   17,
// ]

const rules = [
  0, //CaptureOptions.notMandatory,
  1, //CaptureOptions.mandatory,
  3, //CaptureOptions.bestMandatory,
]

const heuristicPairs = [
  [ 'heuristicCountPieces', 'heuristicClusters' ],
  [ 'heuristicCountPieces', 'heuristicWeighDistance' ],
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
