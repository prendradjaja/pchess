import { Board } from "./board";

describe("moves()", () => {
  it("recognizes own pieces and the edge of the board", () => {
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

  it("can capture", () => {
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
  });
});
