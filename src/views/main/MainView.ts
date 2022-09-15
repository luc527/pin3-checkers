import { defineComponent } from "vue";

import { positionString } from "@/logic/board";
import { createBoardTable, renderBoard } from "@/logic/boardRender";
import {
  actionDo,
  getActions,
  getWinner,
  makeInitialState,
  type GameAction,
} from "@/logic/gameState";
import { heuristicCountPieces, Minimax } from "@/logic/minimax";

const MainView = defineComponent({
  name: "main-view",

  mounted() {
    // First player = white = human

    const state = makeInitialState();

    let humanMovementChoices: GameAction[] = [];

    const depth = 7;
    const minimax = new Minimax(false, heuristicCountPieces, depth);
    const board = this.$refs["board-table"] as HTMLTableElement;

    const elemMatrix = createBoardTable(board);
    renderBoard(state.board, elemMatrix);

    const log = document.querySelector("#log")!;
    const prompt = document.querySelector("#prompt")!;
    const btn = document.querySelector("#btn")!;

    function generateAndLogCurrentMoves() {
      humanMovementChoices = getActions(state);

      let movString =
        "Current moves (" + (state.whiteToMove ? "white" : "black") + ")\n";
      for (let i = 0; i < humanMovementChoices.length; i++) {
        const mov = humanMovementChoices[i];
        movString +=
          "" +
          i +
          ") " +
          ([mov.from, ...mov.sequence].map(positionString).join(", ") + ".\n");
      }
      log.innerHTML += movString;
      log.innerHTML += "Enter your choice\n";
      log.scrollTop = log.scrollHeight;
    }

    generateAndLogCurrentMoves();

    const fmt = Intl.NumberFormat("pt");

    btn.addEventListener("click", () => {
      const choice = parseInt((prompt as HTMLInputElement).value);
      if (choice < 0 || choice >= humanMovementChoices.length) {
        log.innerHTML += "Invalid choice\n";
        return;
      }

      const moveTaken = humanMovementChoices[choice];
      actionDo(state, moveTaken);
      renderBoard(state.board, elemMatrix);

      const whiteWins = getWinner(state);
      if (whiteWins !== null) {
        log.innerHTML += (whiteWins ? "White" : "Black") + " wins!";
        btn.setAttribute("disabled", "disabled");
      }

      btn.setAttribute("disabled", "disabled");
      setTimeout(() => {
        minimax.resetLeafCount();
        const { action: aiAction } = minimax.val(state);
        console.log("leafCount", fmt.format(minimax.getLeafCount()));

        if (aiAction) {
          actionDo(state, aiAction);
          renderBoard(state.board, elemMatrix);
        }

        const whiteWins = getWinner(state);
        if (whiteWins !== null) {
          log.innerHTML += (whiteWins ? "White" : "Black") + " wins!";
          btn.setAttribute("disabled", "disabled");
        } else {
          generateAndLogCurrentMoves();
          btn.removeAttribute("disabled");
        }
      }, 50);
    });
  },
});

export default MainView;
