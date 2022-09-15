<template>
  <div class="about">
    <table id="board-table"></table>

    <textarea id="log" style="width: 500px; height: 200px"></textarea>
    <input type="text" id="prompt" />
    <button id="btn" type="button">Choose</button>
  </div>
</template>

<style scoped></style>

<script lang="ts">
import * as s from "../logic/gameState";
import * as bo from "../logic/board";
import * as gfx from "../logic/boardRender";
import * as mm from "../logic/minimax";

export default {
  setup() {
    // First player = white = human

    const state = s.makeInitialState();

    let humanMovementChoices = [];

    const depth = 7;
    const minimax = new mm.Minimax(false, mm.heuristicCountPieces, depth);

    const elemMatrix = gfx.createBoardTable(
      document.querySelector("#board-table")!
    );
    gfx.renderBoard(state.board, elemMatrix);

    const log = document.querySelector("#log")!;
    const prompt = document.querySelector("#prompt")!;
    const btn = document.querySelector("#btn")!;

    function generateAndLogCurrentMoves() {
      humanMovementChoices = s.getActions(state);

      let movString =
        "Current moves (" + (state.whiteToMove ? "white" : "black") + ")\n";
      for (let i = 0; i < humanMovementChoices.length; i++) {
        const mov = humanMovementChoices[i];
        movString +=
          "" +
          i +
          ") " +
          ([mov.from, ...mov.sequence].map(bo.positionString).join(", ") +
            ".\n");
      }
      log.innerHTML += movString;
      log.innerHTML += "Enter your choice\n";
      log.scrollTop = log.scrollHeight;
    }

    generateAndLogCurrentMoves();

    const fmt = Intl.NumberFormat("pt");

    btn.addEventListener("click", () => {
      const choice = prompt.value;
      if (choice < 0 || choice >= humanMovementChoices.length) {
        log.innerHTML += "Invalid choice\n";
        return;
      }

      const moveTaken = humanMovementChoices[choice];
      s.actionDo(state, moveTaken);
      gfx.renderBoard(state.board, elemMatrix);

      const whiteWins = s.getWinner(state);
      if (whiteWins !== null) {
        log.innerHTML += (whiteWins ? "White" : "Black") + " wins!";
        btn.setAttribute("disabled", "disabled");
      }

      btn.setAttribute("disabled", "disabled");
      setTimeout(() => {
        minimax.resetLeafCount();
        const { action: aiAction } = minimax.val(state);
        console.log("leafCount", fmt.format(minimax.getLeafCount()));

        s.actionDo(state, aiAction);
        gfx.renderBoard(state.board, elemMatrix);

        const whiteWins = s.getWinner(state);
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
};
</script>
