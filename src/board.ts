import { inBounds, toSquareName } from "./util";
import {
  Nullable,
  Piece,
  PieceType,
  Move,
  FenPiece,
  Color,
  CastlingRights,
  SquareCoords,
  FileName,
  OneIndexedCoordinate,
  SquareName,
  Offset,
} from "./types";

const directions: { [key: string]: Offset } = {
  N: { dr: -1, dc: 0 },
  NE: { dr: -1, dc: 1 },
  E: { dr: 0, dc: 1 },
  SE: { dr: 1, dc: 1 },
  S: { dr: 1, dc: 0 },
  SW: { dr: 1, dc: -1 },
  W: { dr: 0, dc: -1 },
  NW: { dr: -1, dc: -1 },
};

const ALL_DIRECTIONS = Object.values(directions);

export function demo() {
  const exampleFen = "6k1/8/8/8/8/8/5PP1/6K1 w - - 0 1";
  const board = new Board();
  board.load(exampleFen);
  console.log(board.ascii());
  console.log(board.moves());
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

  public load(fen: string): void {
    // '6k1/8/6K1/8/8/8/8/R7 w - - 0 1';
    const parts = fen.split(" ");
    if (parts.length !== 6) {
      throw `Invalid FEN: Expected 6 parts but got ${parts.length}`;
    }
    const [boardString, turn, castling, enPassant, halfMoves, fullMoves] =
      parts;
    this.board = this.parseFenBoard(boardString);
    this.turn = turn as Color; // TODO Validate
    // TODO Everything else
  }

  public loadAscii(boardString: string, options: { turn: Color }): void {
    this.board = this.parseAsciiBoard(boardString);
    this.turn = options.turn;
    // TODO Add and implement other options -- What parts should be required?
    // Should some be optional? (For those: Reset to defaults? Leave unchanged?
    // Infer?)
  }

  public moves(): string[];
  public moves(verbose: false): string[];
  public moves(verbose: true): Move[];
  public moves(verbose?: boolean): string[] | Move[] {
    // TODO Check legality
    const candidates = this.generatePseudolegalMoves();
    if (verbose) {
      return candidates;
    } else {
      return candidates.map((move) => this.toAlgebraicMove(move));
    }
  }

  private parseFenBoard(boardString: string): Nullable<Piece>[][] {
    const board: Nullable<Piece>[][] = boardString
      .split("/")
      .map((rowString) => this.parseFenRow(rowString));
    if (board.length !== 8) {
      throw `Invalid FEN: Expected 8 ranks but got ${board.length}`;
    }
    return board;
  }

  private parseFenRow(rowString: string): Nullable<Piece>[] {
    const row: Nullable<Piece>[] = [];
    for (let char of rowString) {
      if ("12345678".includes(char)) {
        const count = +char;
        for (let i = 0; i < count; i++) {
          row.push(undefined);
        }
      } else {
        row.push(this.fromFenPiece(char as FenPiece /* TODO Validate */));
      }
    }
    if (row.length !== 8) {
      throw `Invalid row of FEN (has incorrect number of squares): ${rowString}`;
    }
    return row;
  }

  private parseAsciiBoard(boardString: string): Nullable<Piece>[][] {
    const board: Nullable<Piece>[][] = boardString
      .trim()
      .split("\n")
      .map((rowString) => this.parseAsciiRow(rowString));
    if (board.length !== 8) {
      throw `Invalid ASCII board: Expected 8 ranks but got ${board.length}`;
    }
    return board;
  }

  private parseAsciiRow(rowString: string): Nullable<Piece>[] {
    const row: Nullable<Piece>[] = [];
    for (let char of rowString.split(" ")) {
      if (char === ".") {
        row.push(undefined);
      } else {
        row.push(this.fromFenPiece(char as FenPiece /* TODO Validate */));
      }
    }
    if (row.length !== 8) {
      throw `Invalid row of ASCII board (has incorrect number of squares): ${rowString}`;
    }
    return row;
  }

  private generatePseudolegalMoves(): Move[] {
    const results = [];
    for (let [r, row] of this.board.entries()) {
      for (let [c, piece] of row.entries()) {
        if (piece && piece.color == this.turn) {
          for (let move of this.generateMovesForPiece(r, c, piece)) {
            results.push(move);
          }
        }
      }
    }
    return results;
  }

  private *generateMovesForPiece(
    r: number,
    c: number,
    piece: Piece
  ): Generator<Move> {
    if (piece.type === "k") {
      yield* this.generateKingMoves(r, c, piece);
    } else if (piece.type === "q") {
      yield* this.generateQueenMoves(r, c, piece);
    } else if (piece.type === "r") {
      yield* this.generateRookMoves(r, c, piece);
    } else if (piece.type === "n") {
      yield* this.generateKnightMoves(r, c, piece);
    } else if (piece.type === "b") {
      yield* this.generateBishopMoves(r, c, piece);
    } else if (piece.type === "p") {
      yield* this.generatePawnMoves(r, c, piece);
    }
  }

  private *generateKingMoves(
    r: number,
    c: number,
    piece: Piece
  ): Generator<Move> {
    for (let offset of ALL_DIRECTIONS) {
      const targetSquare = {
        r: r + offset.dr,
        c: c + offset.dc,
      };
      if (!inBounds(targetSquare)) {
        continue;
      }
      const targetPiece: Piece | undefined =
        this.board[targetSquare.r][targetSquare.c];
      if (!targetPiece || targetPiece.color !== piece.color) {
        yield {
          piece,
          start: { r, c },
          target: targetSquare,
          isEnPassant: false,
          isCastling: false,
          capturedPiece: targetPiece,
        };
      }
    }
    // TODO Castling
  }

  private *generateQueenMoves(
    r: number,
    c: number,
    piece: Piece
  ): Generator<Move> {
    // TODO
  }

  private *generateRookMoves(
    r: number,
    c: number,
    piece: Piece
  ): Generator<Move> {
    // TODO
  }

  private *generateKnightMoves(
    r: number,
    c: number,
    piece: Piece
  ): Generator<Move> {
    // TODO
  }

  private *generateBishopMoves(
    r: number,
    c: number,
    piece: Piece
  ): Generator<Move> {
    // TODO
  }

  private *generatePawnMoves(
    r: number,
    c: number,
    piece: Piece
  ): Generator<Move> {
    // TODO
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

  private toAlgebraicMove(move: Move): string {
    const piece = move.piece.type.toUpperCase();
    const capture = move.capturedPiece ? "x" : "";
    const target = toSquareName(move.target);
    return piece + capture + target;
    // TODO Disambiguation, check, mate promotion
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
