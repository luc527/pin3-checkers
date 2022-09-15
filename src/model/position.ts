import type { Piece } from "./piece";

export type Position = {
  col: number;
  row: number;
  piece?: Piece;
};
