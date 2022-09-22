import * as mm from'./minimax.js'

onmessage = (event) => {
  const [ state, params ] = event.data
  const [ maximizeWhite, valueHeuristic, cutoffDepth ] = params
  try {
    postMessage(processEvent(state, maximizeWhite, valueHeuristic, cutoffDepth));
  } catch (err) {
    postMessage(err)
  }
}

const processEvent = (state, maximizeWhite, valueHeuristic, cutoffDepth) => {
  const minimax = new mm.Minimax(maximizeWhite, mm.valueHeuristicFunctions[valueHeuristic], cutoffDepth)
  return minimax.val(state)
}
