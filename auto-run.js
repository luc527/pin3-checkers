import { readFileSync } from 'fs'
import * as minimax from './assets/js/minimax.js'
import { CheckersState, Status } from './assets/js/game-state.js'
import { captureOptionsFromBools } from './assets/js/move-generation.js';

const filePath = process.argv.slice(2)[0]
let gameConfigArray = JSON.parse(readFileSync(filePath, 'utf8'))

if (!Array.isArray(gameConfigArray)) {
  gameConfigArray = [gameConfigArray];
}

for (const gameConfig of gameConfigArray) {

  console.log(gameConfig);

  const heur1 = minimax[gameConfig.players['white'].function]
  const depth1 = gameConfig.players['white'].depth
  const aiWhite = new minimax.Minimax(true, heur1, depth1)

  const heur2 = minimax[gameConfig.players['black'].function]
  const depth2 = gameConfig.players['black'].depth
  const aiBlack = new minimax.Minimax(false, heur2, depth2)

  const mandatory = gameConfig.rule == 'capturesMandatory'
  const bestMandatory = gameConfig.rule == 'bestCapturesMandatory'
  const captureOptions = captureOptionsFromBools(mandatory, bestMandatory)

  let runs = gameConfig.runs ?? 1;

  // TODO more statistics
  // - count # of moves until end of game
  // - aggregate at the end: how many games each player won

  // TODO output results as JSON to file

  while (runs-- > 0) {
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
  }
}


