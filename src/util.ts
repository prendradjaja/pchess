import { SquareCoords, SquareName } from "./types";

const files = "abcdefgh";
const ranks = "87654321";

export function inBounds(coords: SquareCoords): boolean {
  const { r, c } = coords;
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

export function toSquareName(coords: SquareCoords): SquareName {
  const { r, c } = coords;
  return (files[c] + ranks[r]) as SquareName;
}