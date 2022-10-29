import { readFileSync, createWriteStream } from 'fs'
import * as minimax from './assets/js/minimax.js'
import { CheckersState, Status } from './assets/js/game-state.js'
import { captureOptionsFromBools } from './assets/js/move-generation.js'
import { format } from 'util'
import path from 'path'

const logStdout = process.stdout
const now = Math.round(+new Date() / 1000)
const outPutLogFile = createWriteStream(`${path.resolve()}/logs/run-${now}.json`)

console.log = (value) => {
  outPutLogFile.write(`${format(value)}\n`)
  logStdout.write(`${format(value)}\n`)
}

const statusToWinner = (status) => {
  switch (status) {
    case 1:
      return 'white'
    case 2:
      return 'black'
    case 3:
      return 'draw'
  }
}

const filePath = process.argv.slice(2)[0]
let gameConfigArray = JSON.parse(readFileSync(filePath, 'utf8'))

if (!Array.isArray(gameConfigArray)) {
  gameConfigArray = [gameConfigArray];
}

const configLogs = []

for (const gameConfig of gameConfigArray) {
  const configLog = {
    config: {},
    runs: [],
    gamesWon: {}
  }
  configLog.config = gameConfig

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

  const runsLog = []

  for (let run = 1; run <= runs; run++) {
    const runLog = {
      run: run,
      winner: undefined,
      pieceCount: {},
      moves: 0
    }
    const state = new CheckersState(captureOptions)

    const randomMoves = gameConfig.random
    for (let i = 0; i < randomMoves; i++) {
      const rand = Math.floor(Math.random() * state.actions.length)
      const action = state.actions[rand]
      state.actionDo(action)
      runLog.moves++;
    }

    while (state.status == Status.playing) {
      const mm = state.whiteToMove ? aiWhite : aiBlack;
      const { action } = mm.val(state)
      state.actionDo(action)
      runLog.moves++;
    }

    gamesWon.black += state.status == Status.blackWon
    gamesWon.draw += state.status == Status.draw
    gamesWon.white += state.status == Status.whiteWon
 
    runLog.pieceCount = state.pieceCount
    runLog.winner = statusToWinner(state.status)
    runsLog.push(runLog)
  }
  configLog.runs = runsLog
  configLog.gamesWon = gamesWon

  configLogs.push(configLog)
}

console.log(JSON.stringify(configLogs, null, '\t'))
