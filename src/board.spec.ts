import { Board } from "./board";
import { toSquareName } from "./util";

describe("moves()", () => {
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
    board.loadAscii(ascii, { turn: "w" });
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
});
