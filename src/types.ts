export type Nullable<T> = T | undefined;

export interface Piece {
  color: Color;
  type: PieceType;
}
export type PieceType = "k" | "q" | "r" | "b" | "n" | "p";

export interface Move {
  piece: Piece;
  start: SquareCoords;
  target: SquareCoords;
  isEnPassant: boolean;
  isCastling: boolean;
  promotion?: PieceType;
  capturedPiece?: Piece;
}

export type FenPiece =
  | "k"
  | "q"
  | "r"
  | "b"
  | "n"
  | "p"
  | "K"
  | "Q"
  | "R"
  | "B"
  | "N"
  | "P";

export type Color = "w" | "b";
export interface CastlingRights {
  w: { short: boolean; long: boolean };
  b: { short: boolean; long: boolean };
}

// zero-indexed
export type SquareCoords = { r: number; c: number };

export type FileName = "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h";
export type OneIndexedCoordinate = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type SquareName = `${FileName}${OneIndexedCoordinate}`;
