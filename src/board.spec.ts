import { Board } from "./board";
import { toSquareName } from "./util";

describe("moves()", () => {
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
