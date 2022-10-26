import { readFileSync } from 'fs'
import * as minimax from './assets/js/minimax.js'
import { CheckersState, Status } from './assets/js/game-state.js'
import { captureOptionsFromBools } from './assets/js/move-generation.js';

const filePath = process.argv.slice(2)[0]
const gameConfig = JSON.parse(readFileSync(filePath, 'utf8'))
console.log(gameConfig)

const heur1 = minimax[gameConfig.config[0].function]
const depth1 = gameConfig.config[0].depth
const aiWhite = new minimax.Minimax(true, heur1, depth1)

const heur2 = minimax[gameConfig.config[1].function]
const depth2 = gameConfig.config[1].depth
const aiBlack = new minimax.Minimax(false, heur2, depth2)

const mandatory = gameConfig.rule == 'capturesMandatory'
const bestMandatory = gameConfig.rule == 'bestCapturesMandatory'
const captureOptions = captureOptionsFromBools(mandatory, bestMandatory)

const state = new CheckersState(captureOptions)

const randomMoves = gameConfig.random
for (let i = 0; i < randomMoves; i++) {
  const rand = Math.floor(Math.random() * state.actions.length)
  const action = state.actions[rand]
  state.actionDo(action)
}

while (state.status == Status.playing) {
  const mm = state.whiteToMove ? aiWhite : aiBlack;
  const { action } = mm.val(state)
  state.actionDo(action)
}

if (state.status == Status.draw) {
  console.log('Draw :/')
} else {
  console.log(`Winner is ${state.status == Status.whiteWon ? 'white' : 'black'}`)
}
