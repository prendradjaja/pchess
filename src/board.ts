type Nullable<T> = T | undefined;

type ColoredPiece =
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
type UncoloredPiece = "k" | "q" | "r" | "b" | "n" | "p";

type Color = "w" | "b";
interface CastlingRights {
  w: { short: boolean; long: boolean };
  b: { short: boolean; long: boolean };
}

type ZeroCoordinate = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
type SquareCoords = { r: ZeroCoordinate; c: ZeroCoordinate };

type FileName = "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h";
type OneCoordinate = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
type SquareName = `${FileName}${OneCoordinate}`;

export function demo() {
  console.log(new Board().ascii());
}

export class Board {
  private board: Nullable<ColoredPiece>[][] = this.makeInitialBoard();
  private turn: Color = "w";
  private castlingRights: CastlingRights = this.makeInitialCastlingRights();
  private enPassantTarget?: SquareCoords;
  private halfMoveClock = 0;
  private fullMoveNumber = 50;

  constructor() {}

  public ascii(): string {
    return this.board
      .map((row) => row.map((piece) => piece || ".").join(" "))
      .join("\n");
  }

  private makeInitialBoard(): Nullable<ColoredPiece>[][] {
    const nil = undefined;
    return [
      ["r", "n", "b", "q", "k", "b", "n", "r"],
      ["p", "p", "p", "p", "p", "p", "p", "p"],
      [nil, nil, nil, nil, nil, nil, nil, nil],
      [nil, nil, nil, nil, nil, nil, nil, nil],
      [nil, nil, nil, nil, nil, nil, nil, nil],
      [nil, nil, nil, nil, nil, nil, nil, nil],
      ["P", "P", "P", "P", "P", "P", "P", "P"],
      ["R", "N", "B", "Q", "K", "B", "N", "R"],
    ];
  }

  private makeInitialCastlingRights(): CastlingRights {
    return {
      w: { short: true, long: true },
      b: { short: true, long: true },
    };
  }
}
