import { readFileSync, createWriteStream } from 'fs'
import * as minimax from './assets/js/minimax.js'
import { CheckersState, Status } from './assets/js/game-state.js'
import { captureOptionsFromBools } from './assets/js/move-generation.js'
import { format } from 'util'
import path from 'path'

const logStdout = process.stdout
const now = Math.round(+new Date() / 1000)
const outPutLogFile = createWriteStream(`${path.resolve()}/logs/run-${now}.log`)

console.log = (value) => {
  outPutLogFile.write(`${format(value)}\n`)
  logStdout.write(`${format(value)}\n`)
}

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

  // TODO: migrate to CSV or JSON on output, so it can be easily managed on sheets / excel

  const gamesWon = {
    white: 0,
    black: 0,
    draw: 0,
  }

  for (let run = 1; run < runs; run++) {
    let moves = 0;
    const state = new CheckersState(captureOptions)

    const randomMoves = gameConfig.random
    for (let i = 0; i < randomMoves; i++) {
      const rand = Math.floor(Math.random() * state.actions.length)
      const action = state.actions[rand]
      state.actionDo(action)
      moves++;
    }

    while (state.status == Status.playing) {
      const mm = state.whiteToMove ? aiWhite : aiBlack;
      const { action } = mm.val(state)
      state.actionDo(action)
      moves++;
    }

    gamesWon.black += state.status == Status.blackWon
    gamesWon.white += state.status == Status.whiteWon
    gamesWon.draw += state.Status == Status.draw

    if (state.status == Status.draw) {
      console.log(`Draw. Run: ${run}, after ${moves} moves.`)
    } else {
      console.log(`${state.status == Status.whiteWon ? 'White' : 'Black'} Won! Run: ${run}, after ${moves} moves.`)
    }
  }
  console.log(gamesWon)
  console.log('------------------')
}
