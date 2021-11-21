import { Board } from "./board";
import { toSquareName } from "./util";

describe(".moves()", () => {
  it("generates king moves on an empty board", () => {
    const board = new Board();
    const ascii = `
. . . . . . k .
. . . . . . . .
. . . . . . . .
. . . . . . . .
. . . . K . . .
. . . . . . . .
. . . . . . . .
. . . . . . . .`;
    board.loadAscii(ascii, { turn: "w", castling: "-" });
    const moves = board.moves();
    expect(moves.sort()).toEqual("Kd3 Kd4 Kd5 Ke3 Ke5 Kf3 Kf4 Kf5".split(" "));
  });

  it("generates knight moves on an empty board", () => {
    const board = new Board();
    const ascii = `
. . . . . . k .
. . . . . . . .
. . . . . . . .
. . . . . . . .
. . . . N . . .
. . . . . . . .
. . . . . . . .
. . . . . . . K`;
    board.loadAscii(ascii, { turn: "w" });
    const knightMoves = board.moves().filter((move) => move.startsWith("N"));
    expect(knightMoves.sort()).toEqual(
      "Nc3 Nc5 Nd2 Nd6 Nf2 Nf6 Ng3 Ng5".split(" ")
    );
  });

  it("generates rook moves on an empty board", () => {
    const board = new Board();
    const ascii = `
. . . . . . k .
. . . . . . . .
. . . . . . . .
. . . . . . . .
. . . . R . . .
. . . . . . . .
. . . . . . . .
. . . . . . . K`;
    board.loadAscii(ascii, { turn: "w" });
    const rookMoves = board.moves().filter((move) => move.startsWith("R"));
    expect(rookMoves.sort()).toEqual(
      (
        "Ra4 Rb4 Rc4 Rd4 " +
        "Re1 Re2 Re3 Re5 Re6 Re7 Re8 " + // vertical moves
        "Rf4 Rg4 Rh4"
      ).split(" ")
    );
  });

  it("generates rook moves, stopping at own pieces and capturing enemy pieces", () => {
    const board = new Board();
    const ascii = `
. . . . . . k .
. . . . P . . .
. . . . . . . .
. . . . . . . .
. . n . R . P .
. . . . . . . .
. . . . b . . .
. . . . . . . K`;
    board.loadAscii(ascii, { turn: "w" });
    const rookMoves = board.moves().filter((move) => move.startsWith("R"));
    expect(rookMoves.sort()).toEqual(
      "Rd4 Re3 Re5 Re6 Rf4 Rxc4 Rxe2".split(" ")
    );
  });

  // TODO Tests for the other sliding pieces

  it("won't generate self-captures or moves out of bounds", () => {
    const board = new Board();
    const ascii = `
. . . . . . k .
. . . . . . . .
. . . . . . . .
. . . . . . . .
. . . . . . . .
. . . . . . . .
. . . . . P P .
. . . . . . K .`;
    board.loadAscii(ascii, { turn: "w" });
    const kingMoves = board.moves().filter((move) => move.startsWith("K"));
    expect(kingMoves.sort()).toEqual(["Kf1", "Kh1", "Kh2"]);
  });

  it("distinguishes captures and non-captures", () => {
    const board = new Board();
    const ascii = `
. . . . . . k .
. . . . . . . .
. . . . . . . .
. . . . . P P P
. . . . . P K P
. . . . . b b .
. . . . . . . .
. . . . . . . .`;
    board.loadAscii(ascii, { turn: "w" });
    const kingMoves = board.moves().filter((move) => move.startsWith("K"));
    expect(kingMoves.sort()).toEqual(["Kh3", "Kxf3", "Kxg3"]);

    const verboseMoves = board.moves(true);
    const kxg3 = verboseMoves.find(
      (move) => toSquareName(move.target) === "g3"
    );
    expect(kxg3.capturedPiece).toBeTruthy();

    const kh3 = verboseMoves.find((move) => toSquareName(move.target) === "h3");
    expect(kh3.capturedPiece).toBeUndefined();
  });

  describe("(Pawn moves)", () => {
    it("generates single and double moves (white)", () => {
      const board = new Board();
      const ascii = `
. . . . . . k .
. . . . . . . .
. . . . . . . .
. . . . . . . .
. . . . . . . .
P . . . . . . .
. P P P P P P P
. . B Q K B . .`;
      board.loadAscii(ascii, { turn: "w" });
      const moves = board.moves();
      expect(moves.sort()).toEqual(
        "a4 b3 b4 c3 c4 d3 d4 e3 e4 f3 f4 g3 g4 h3 h4".split(" ")
      );
    });

    it("generates single and double moves (black)", () => {
      const board = new Board();
      const ascii = `
. . b q k b . .
. p p p p p p p
p . . . . . . .
. . . . . . . .
. . . . . . . .
. . . . . . . .
. . . . . . . .
. . . . . . K .`;
      board.loadAscii(ascii, { turn: "b" });
      const moves = board.moves();
      expect(moves.sort()).toEqual(
        "a5 b5 b6 c5 c6 d5 d6 e5 e6 f5 f6 g5 g6 h5 h6".split(" ")
      );
    });
  });

  describe("(Castling)", () => {
    it("should be possible", () => {
      const board = new Board();
      const ascii = `
. . . . . . k .
. . . . . . . .
. . . . . . . .
. . . . . . . .
. . . . . . . .
. . . . . . . .
. . . P P P . .
R . . . K . . R`;
      board.loadAscii(ascii, { turn: "w" });
      const castlingMoves = board
        .moves()
        .filter((move) => move.startsWith("O"));
      expect(castlingMoves.sort()).toEqual(["O-O", "O-O-O"]);
    });

    it("should respect castling rights (e.g. only can castle queenside)", () => {
      const board = new Board();
      const ascii = `
r . . . k . . r
. . . . . . . .
. . . . . . . .
. . . . . . . .
. . . . . . . .
. . . . . . . .
. . . . . . . .
. . . . . K . .`;
      board.loadAscii(ascii, { turn: "b", castling: "q" });
      const castlingMoves = board
        .moves()
        .filter((move) => move.startsWith("O"));
      expect(castlingMoves.sort()).toEqual(["O-O-O"]);
    });

    it("should not be possible if both castling rights have been lost", () => {
      const board = new Board();
      const ascii = `
r . . . k . . r
. . . . . . . .
. . . . . . . .
. . . . . . . .
. . . . . . . .
. . . . . . . .
. . . . . . . .
. . . . . K . .`;
      board.loadAscii(ascii, { turn: "b", castling: "-" });
      const castlingMoves = board
        .moves()
        .filter((move) => move.startsWith("O"));
      expect(castlingMoves.sort()).toEqual([]);
    });

    it("should not be possible with pieces in the way", () => {
      const board = new Board();
      const ascii = `
. . . . . . k .
. . . . . . . .
. . . . . . . .
. . . . . . . .
. . . . . . . .
. . . . . . . .
. . . P P P . .
R . . Q K . N R`;
      board.loadAscii(ascii, { turn: "w" });
      const castlingMoves = board
        .moves()
        .filter((move) => move.startsWith("O"));
      expect(castlingMoves.sort()).toEqual([]);
    });
  });
});
