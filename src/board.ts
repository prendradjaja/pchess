type Nullable<T> = T | undefined;

interface Piece {
  color: Color;
  type: PieceType;
}
type PieceType = "k" | "q" | "r" | "b" | "n" | "p";

type FenPiece =
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

type Color = "w" | "b";
interface CastlingRights {
  w: { short: boolean; long: boolean };
  b: { short: boolean; long: boolean };
}

// zero-indexed
type SquareCoords = { r: number; c: number };

type FileName = "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h";
type OneIndexedCoordinate = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
type SquareName = `${FileName}${OneIndexedCoordinate}`;

export function demo() {
  console.log(new Board().ascii());
}

export class Board {
  private board: Nullable<Piece>[][] = this.makeInitialBoard();
  private turn: Color = "w";
  private castlingRights: CastlingRights = this.makeInitialCastlingRights();
  private enPassantTarget?: SquareCoords;
  private halfMoveClock = 0;
  private fullMoveNumber = 50;

  constructor() {}

  public ascii(): string {
    return this.board
      .map((row) =>
        row.map((piece) => (piece ? this.toFenPiece(piece) : ".")).join(" ")
      )
      .join("\n");
  }

  private makeInitialBoard(): Nullable<Piece>[][] {
    const nil = undefined;
    return (
      [
        ["r", "n", "b", "q", "k", "b", "n", "r"],
        ["p", "p", "p", "p", "p", "p", "p", "p"],
        [nil, nil, nil, nil, nil, nil, nil, nil],
        [nil, nil, nil, nil, nil, nil, nil, nil],
        [nil, nil, nil, nil, nil, nil, nil, nil],
        [nil, nil, nil, nil, nil, nil, nil, nil],
        ["P", "P", "P", "P", "P", "P", "P", "P"],
        ["R", "N", "B", "Q", "K", "B", "N", "R"],
      ] as FenPiece[][]
    ).map((row) =>
      row.map((piece) => (piece ? this.fromFenPiece(piece) : undefined))
    );
  }

  private fromFenPiece(fenPiece: FenPiece): Piece {
    const isWhite = fenPiece.toUpperCase() === fenPiece;
    return {
      type: fenPiece.toLowerCase() as PieceType,
      color: isWhite ? "w" : "b",
    };
  }

  private toFenPiece(piece: Piece): FenPiece {
    return (
      piece.color === "w" ? piece.type.toUpperCase() : piece.type
    ) as FenPiece;
  }

  private makeInitialCastlingRights(): CastlingRights {
    return {
      w: { short: true, long: true },
      b: { short: true, long: true },
    };
  }
}
