import {
  inBounds,
  toSquareName,
  addOffset,
  fromSquareName,
  copyCastlingRights,
} from "./util";
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

const directionsByName: { [key: string]: Offset } = {
  N: { dr: -1, dc: 0 },
  NE: { dr: -1, dc: 1 },
  E: { dr: 0, dc: 1 },
  SE: { dr: 1, dc: 1 },
  S: { dr: 1, dc: 0 },
  SW: { dr: 1, dc: -1 },
  W: { dr: 0, dc: -1 },
  NW: { dr: -1, dc: -1 },
};

const ALL_DIRECTIONS = Object.values(directionsByName);
const ROOK_DIRECTIONS = [
  directionsByName.N,
  directionsByName.E,
  directionsByName.S,
  directionsByName.W,
];
const BISHOP_DIRECTIONS = [
  directionsByName.NE,
  directionsByName.SE,
  directionsByName.SW,
  directionsByName.NW,
];
const KNIGHT_MOVES = [
  { dr: -2, dc: -1 },
  { dr: -1, dc: -2 },
  { dr: -2, dc: 1 },
  { dr: -1, dc: 2 },
  { dr: 2, dc: 1 },
  { dr: 1, dc: 2 },
  { dr: 2, dc: -1 },
  { dr: 1, dc: -2 },
];

interface HistoryEntry {
  move: Move;
  // Unrecoverable state before this move
  castlingRights: CastlingRights;
  enPassantTarget: SquareCoords | undefined;
  halfMoveClock: number;
}

export class Board {
  private board: Nullable<Piece>[][] = this.makeInitialBoard();

  private turn: Color = "w";
  private castlingRights: CastlingRights = this.makeInitialCastlingRights();
  private enPassantTarget?: SquareCoords;
  private halfMoveClock = 0;
  private fullMoveNumber = 50;

  private history: HistoryEntry[] = [];

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

  /**
   * @param options: Provide any other state that can't be determined from
   * just the board position here. If an option is not provided, it is left
   * unchanged.
   * - options.castling: FEN format (e.g. "-" "KQkq" "K")
   */
  public loadAscii(
    boardString: string,
    options?: { turn?: Color; castling?: string }
  ): void {
    this.board = this.parseAsciiBoard(boardString);
    if (options) {
      if (options.turn) {
        this.turn = options.turn;
      }
      if (options.castling) {
        this.castlingRights = this.parseFenCastlingRights(options.castling);
      }
      // TODO Add other options
    }
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

  public move(_move: Move | string): void {
    let move;
    if ((_move as any).slice) {
      // TODO What's the right way to check for a string?
      // TODO Replace this with a real move parser
      let moveString = _move as string;
      const targetSquare = moveString.slice(-2);
      const pieceType =
        moveString.length === 2 ? "p" : moveString[0].toLowerCase();
      const matchedMove = this.moves(true).find(
        (m) =>
          toSquareName(m.target) === targetSquare && m.piece.type === pieceType
      );
      if (matchedMove) {
        move = matchedMove;
      } else {
        throw `move(string) fake parser couldn't find move ${moveString}`;
        // This could mean any of:
        // - Not a legal move
        // - Not valid algebraic notation
        // - Move is more complicated than the fake parser can handle
      }
    } else {
      move = _move as Move;
    }
    this.history.push(this.makeHistoryEntry(move));
    if (move.isCastling) {
      // TODO
    } else if (move.promotion) {
      // TODO, incl. capture
    } else if (move.isEnPassant) {
      // TODO
    } else {
      this.removePiece(move.start);
      this.setPiece(move.target, move.piece); // Replacing captured piece, if any
    }

    this.turn = this.otherPlayer();
  }

  public undo(): void {}

  public get(squareName: string): Piece | undefined {
    return this.getPiece(fromSquareName(squareName));
  }

  public getShort(squareName: string): FenPiece | undefined {
    const piece = this.getPiece(fromSquareName(squareName));
    return piece && this.toFenPiece(piece);
  }

  private applyHistoryEntry(entry: HistoryEntry): void {
    this.castlingRights = copyCastlingRights(entry.castlingRights);
    this.enPassantTarget = entry.enPassantTarget;
    this.halfMoveClock = entry.halfMoveClock;
  }

  private makeHistoryEntry(move: Move): HistoryEntry {
    return {
      move,
      castlingRights: copyCastlingRights(this.castlingRights),
      enPassantTarget: this.enPassantTarget,
      halfMoveClock: this.halfMoveClock,
    };
  }

  private getPiece(square: SquareCoords): Piece | undefined {
    return this.board[square.r][square.c];
  }

  private setPiece(square: SquareCoords, piece: Piece) {
    this.board[square.r][square.c] = piece;
  }

  private removePiece(square: SquareCoords) {
    this.board[square.r][square.c] = undefined;
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

  private parseFenCastlingRights(rights: string): CastlingRights {
    const result = {
      w: { short: false, long: false },
      b: { short: false, long: false },
    };
    for (let char of rights) {
      if (char === "K") {
        result.w.short = true;
      } else if (char === "Q") {
        result.w.long = true;
      } else if (char === "k") {
        result.b.short = true;
      } else if (char === "q") {
        result.b.long = true;
      }
    }
    return result;
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

  // Pseudolegal
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

  // Pseudolegal
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
      const capturedPiece: Piece | undefined =
        this.board[targetSquare.r][targetSquare.c];
      if (!capturedPiece || capturedPiece.color !== piece.color) {
        yield {
          piece,
          start: { r, c },
          target: targetSquare,
          isEnPassant: false,
          isCastling: false,
          capturedPiece,
        };
      }
    }
    yield* this.generateCastlingMoves(r, c, piece);
  }

  // Pseudolegal
  private *generateCastlingMoves(
    r: number,
    c: number,
    piece: Piece
  ): Generator<Move> {
    // TODO Don't allow if castling through check
    // TODO Don't allow if in check
    // TODO If a rook is captured, should castling right be lost? Or should we
    // have a check for if the rook exists here?
    yield* this.generateCastlingMove(r, c, piece, "short");
    yield* this.generateCastlingMove(r, c, piece, "long");
  }

  // Pseudolegal
  private *generateCastlingMove(
    r: number,
    c: number,
    piece: Piece,
    type: "short" | "long"
  ): Generator<Move> {
    const color = piece.color;
    const rights = this.castlingRights[color];
    if (rights[type]) {
      const direction = type === "short" ? 1 : -1;
      const intermediateSquare = addOffset({ r, c }, { dr: 0, dc: direction });
      const targetSquare = addOffset(intermediateSquare, {
        dr: 0,
        dc: direction,
      });
      if (!this.getPiece(intermediateSquare) && !this.getPiece(targetSquare)) {
        yield {
          piece,
          start: { r, c },
          target: targetSquare,
          isEnPassant: false,
          isCastling: true,
        };
      }
    }
  }

  // Pseudolegal
  private *generateQueenMoves(
    r: number,
    c: number,
    piece: Piece
  ): Generator<Move> {
    yield* this.generateSlidingMoves(r, c, piece, ALL_DIRECTIONS);
  }

  // Pseudolegal
  private *generateRookMoves(
    r: number,
    c: number,
    piece: Piece
  ): Generator<Move> {
    yield* this.generateSlidingMoves(r, c, piece, ROOK_DIRECTIONS);
  }

  // Pseudolegal
  private *generateKnightMoves(
    r: number,
    c: number,
    piece: Piece
  ): Generator<Move> {
    for (let offset of KNIGHT_MOVES) {
      const targetSquare = {
        r: r + offset.dr,
        c: c + offset.dc,
      };
      if (!inBounds(targetSquare)) {
        continue;
      }
      const capturedPiece: Piece | undefined =
        this.board[targetSquare.r][targetSquare.c];
      if (!capturedPiece || capturedPiece.color !== piece.color) {
        yield {
          piece,
          start: { r, c },
          target: targetSquare,
          isEnPassant: false,
          isCastling: false,
          capturedPiece,
        };
      }
    }
  }

  // Pseudolegal
  private *generateBishopMoves(
    r: number,
    c: number,
    piece: Piece
  ): Generator<Move> {
    yield* this.generateSlidingMoves(r, c, piece, BISHOP_DIRECTIONS);
  }

  // Pseudolegal
  private *generatePawnMoves(
    r: number,
    c: number,
    piece: Piece
  ): Generator<Move> {
    const direction = piece.color === "w" ? -1 : 1;
    const offset = { dr: direction, dc: 0 };

    // The square the pawn would go to with a single move forward
    const nextSquare = addOffset({ r, c }, offset);

    if (nextSquare.r === -1 || nextSquare.r === 8) {
      return; // Out of bounds
    }
    if (nextSquare.r === 0 || nextSquare.r === 7) {
      return; // TODO promotions;
    }

    // Normal move (forward 1 square)
    if (!this.getPiece(nextSquare)) {
      yield {
        piece,
        start: { r, c },
        target: nextSquare,
        isEnPassant: false,
        isCastling: false,
      };
    }

    const isOnInitialSquare = r === 1 || r === 6;
    // The square the pawn would go to with a single move forward
    const doubleMoveSquare = addOffset(nextSquare, offset);

    // Double move
    if (isOnInitialSquare && !this.getPiece(doubleMoveSquare)) {
      yield {
        piece,
        start: { r, c },
        target: doubleMoveSquare,
        isEnPassant: false,
        isCastling: false,
      };
    }

    // if (unmoved && double square empty) {
    //   yield double move;
    // }
    // if (left corner has opponent piece) { // don't forget oob
    //   yield capture;
    // }
    // if (right corner has opponent piece) { // don't forget oob
    //   yield capture;
    // }
    // if (is left corner of EP) { // don't forget oob?
    //   yield capture;
    // }
    // if (is right corner of EP) { // don't forget oob?
    //   yield capture;
    // }
  }

  // Pseudolegal
  private *generateSlidingMoves(
    r: number,
    c: number,
    piece: Piece,
    directions: Offset[]
  ): Generator<Move> {
    for (let direction of directions) {
      let i = 1;
      let targetSquare = {
        r: r + direction.dr,
        c: c + direction.dc,
      };
      while (inBounds(targetSquare)) {
        const capturedPiece: Piece | undefined =
          this.board[targetSquare.r][targetSquare.c];
        if (capturedPiece?.color === piece.color) {
          break;
        }

        yield {
          piece,
          start: { r, c },
          target: targetSquare,
          isEnPassant: false,
          isCastling: false,
          capturedPiece,
        };

        if (capturedPiece) {
          break;
        }

        i++;
        targetSquare = {
          r: r + direction.dr * i,
          c: c + direction.dc * i,
        };
      }
    }
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
    // TODO Disambiguation, check, mate promotion
    if (move.isCastling) {
      return move.target.c === 6 ? "O-O" : "O-O-O";
    } else {
      const piece =
        move.piece.type !== "p" ? move.piece.type.toUpperCase() : "";
      const capture = move.capturedPiece ? "x" : "";
      const target = toSquareName(move.target);
      return piece + capture + target;
    }
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

  private otherPlayer(): Color {
    return this.turn === "w" ? "b" : "w";
  }
}

export function demo() {
  const board = new Board();
  // console.log(board.moves());
  // board.move('e4');
  // board.move('e5');
  // board.move('Nf3');
  // board.move('Nc6');
  // board.move('Nxe5');
  // console.log(board.ascii());
  // console.log(board.moves());
}
